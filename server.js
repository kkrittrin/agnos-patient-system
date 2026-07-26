/**
 * Custom server: Next.js + Socket.IO
 *
 * A custom server is required because real-time, bidirectional sync
 * (patient -> staff) needs a persistent Socket.IO server. This cannot
 * run inside a stateless Vercel serverless function, so this project
 * is deployed on a platform that supports a long-running Node process
 * (Render / Railway / Heroku). See README.md "Deployment" section.
 */
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// How long (ms) a patient can go without a heartbeat/update before
// staff sees them flip from "filling" to "inactive".
const INACTIVITY_TIMEOUT_MS = 12000;

// In-memory store. Fine for this assignment's scope; a production
// version would move this to Redis so it survives restarts / scales
// across multiple server instances.
/** @type {Map<string, PatientRecord>} */
const patients = new Map();

/**
 * @typedef {Object} PatientRecord
 * @property {string} id
 * @property {Object} data
 * @property {"filling"|"submitted"|"inactive"} status
 * @property {number} lastActive
 * @property {number} createdAt
 * @property {number|null} submittedAt
 */

function inactivityTimerFor(id) {
  const record = patients.get(id);
  if (!record) return;
  if (record.status === "submitted") return; // submitted is a final state
  if (Date.now() - record.lastActive >= INACTIVITY_TIMEOUT_MS) {
    record.status = "inactive";
    broadcastPatient(id);
  }
}

let io;

function broadcastPatient(id) {
  const record = patients.get(id);
  if (!record || !io) return;
  io.to("staff").emit("patient:update", record);
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    // --- Patient joins their own session ---
    socket.on("patient:join", (sessionId) => {
      const id = sessionId || nanoid(10);
      socket.data.patientId = id;
      socket.join(`patient:${id}`);

      if (!patients.has(id)) {
        patients.set(id, {
          id,
          data: {},
          status: "filling",
          lastActive: Date.now(),
          createdAt: Date.now(),
          submittedAt: null,
        });
      }

      socket.emit("patient:joined", { id, record: patients.get(id) });
      broadcastPatient(id);
    });

    // --- Patient sends a field update (debounced client-side) ---
    socket.on("patient:update", ({ id, data }) => {
      if (!id) return;
      const existing = patients.get(id) || {
        id,
        data: {},
        status: "filling",
        lastActive: Date.now(),
        createdAt: Date.now(),
        submittedAt: null,
      };
      existing.data = { ...existing.data, ...data };
      existing.lastActive = Date.now();
      if (existing.status !== "submitted") existing.status = "filling";
      patients.set(id, existing);
      broadcastPatient(id);
      setTimeout(() => inactivityTimerFor(id), INACTIVITY_TIMEOUT_MS + 250);
    });

    // --- Patient submits the completed form ---
    socket.on("patient:submit", ({ id, data }) => {
      if (!id) return;
      const existing = patients.get(id);
      if (!existing) return;
      existing.data = { ...existing.data, ...data };
      existing.status = "submitted";
      existing.submittedAt = Date.now();
      existing.lastActive = Date.now();
      patients.set(id, existing);
      broadcastPatient(id);
    });

    // --- Staff dashboard joins the monitoring room ---
    socket.on("staff:join", () => {
      socket.join("staff");
      socket.emit("staff:init", Array.from(patients.values()));
    });

    socket.on("disconnect", () => {
      const id = socket.data.patientId;
      if (!id) return;
      // Give the patient a grace period (e.g. page refresh) before
      // marking inactive, rather than flipping instantly on disconnect.
      setTimeout(() => inactivityTimerFor(id), INACTIVITY_TIMEOUT_MS);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
