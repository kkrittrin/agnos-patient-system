# Agnos Patient Intake & Staff Monitor

A real-time patient intake form and staff monitoring dashboard, built for the
Agnos front-end developer assignment.

- **`/`** — Patient Form: a mobile-friendly, 3-step intake form.
- **`/staff`** — Staff View: a live dashboard showing every patient's data as
  they type it, with a status indicator (filling in / submitted / inactive).

The two pages sync **instantly** over a WebSocket connection (Socket.IO) — no
page refresh needed on either side.

## Tech stack

| Layer            | Choice                                   |
|------------------|-------------------------------------------|
| Framework        | Next.js 14 (Pages Router)                 |
| Styling          | TailwindCSS                               |
| Real-time        | Socket.IO (WebSocket, falls back to polling) |
| Runtime          | Custom Node server (`server.js`)          |

### Why a custom server?

Real-time push from patient → staff needs a **persistent** WebSocket server
that keeps every connected client in memory. That doesn't fit a stateless
serverless function (e.g. a default Vercel deployment), so this project runs
Socket.IO inside a small custom Node server that wraps Next.js
(`server.js`). This is deployed to a platform that keeps a long-running
process alive — see **Deployment** below.

## Getting started locally

```bash
npm install
npm run dev
```

Open two tabs:
- http://localhost:3000/ — fill out the patient form
- http://localhost:3000/staff — watch the data appear live

## Deployment

Because of the custom server, deploy to a platform that runs a persistent
Node process rather than serverless functions:

### Render / Railway (recommended)
1. Push this repo to GitHub.
2. Create a new **Web Service**, connect the repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Render/Railway auto-injects `PORT`; `server.js` already reads
   `process.env.PORT`.

### Heroku
1. `heroku create`
2. `git push heroku main`
3. Heroku detects Node automatically and runs `npm run build` then
   `npm start` (the `Procfile` below is optional but explicit):
   ```
   web: npm start
   ```

### A note on Vercel
Vercel's default deployment model uses stateless serverless functions, which
cannot hold a persistent Socket.IO server or in-memory patient store across
requests. To deploy this exact app on Vercel you'd need to move the
real-time layer to a managed pub/sub service (e.g. Pusher, Ably, or
Vercel's own Realtime primitives) instead of a self-hosted Socket.IO server.
That's a meaningful architecture change, so for this assignment the app
targets Render/Railway/Heroku, all of which are named as acceptable options
in the brief.

## Features implemented

- **Patient Form**
  - All required fields: first/middle/last name, date of birth, gender,
    phone, email, address, preferred language, nationality, emergency
    contact (name + relationship, optional), religion (optional).
  - Split into 3 short steps (Identity → Contact → Additional) so it
    doesn't feel overwhelming on a phone.
  - Inline validation: required fields, email format, phone format,
    sane date of birth.
  - Responsive, single-column layout down to small phone widths.
- **Staff View**
  - Every field appears live as the patient types (debounced ~350ms so we
    don't flood the socket on every keystroke).
  - Status badge per patient: **Filling in** (clay, pulsing), **Submitted**
    (sage), **Inactive** (dimmed — auto-applied after ~12s without any
    update).
  - Search by name/reference id, filter by status, live counts.
  - Responsive grid: 1 column on mobile, up to 3 on wide screens.
- **Real-time sync**
  - Socket.IO WebSocket connection; each patient tab gets a persistent
    session id (stored in `localStorage`) so a refresh resumes the same
    record instead of creating a duplicate.
  - Server holds an in-memory map of patients and broadcasts diffs to a
    `staff` room on every update/submit.

### Bonus features
- Multi-step form with a progress bar, rather than one long scroll.
- "Inactive" auto-detection: if a patient stops interacting, staff see them
  flip to inactive without any explicit signal from the patient.
- Search + status filters on the staff dashboard.
- Session persistence across refresh via `localStorage`.

## Known limitations / trade-offs

- Patient data lives in memory on the server — restarting the server clears
  it. For this assignment's scope that's an acceptable trade-off; a
  production version would back it with Redis (documented in
  `server.js` comments as the intended upgrade path).
- No authentication on `/staff` — anyone with the URL can view it. Out of
  scope for this assignment, but the natural next step would be a login
  gate before the dashboard.
