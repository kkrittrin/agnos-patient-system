import { useEffect, useMemo, useState } from "react";
import PatientCard from "./PatientCard";
import { useSocket } from "../lib/useSocket";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "filling", label: "Filling in" },
  { key: "submitted", label: "Submitted" },
  { key: "inactive", label: "Inactive" },
];

export default function StaffDashboard() {
  const { socket, connected } = useSocket();
  const [patients, setPatients] = useState({});
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    socket.emit("staff:join");

    const onInit = (list) => {
      const map = {};
      for (const p of list) map[p.id] = p;
      setPatients(map);
    };
    const onUpdate = (record) => {
      setPatients((prev) => ({ ...prev, [record.id]: record }));
    };

    socket.on("staff:init", onInit);
    socket.on("patient:update", onUpdate);
    socket.on("connect", () => socket.emit("staff:join"));

    return () => {
      socket.off("staff:init", onInit);
      socket.off("patient:update", onUpdate);
    };
  }, [socket]);

  const list = useMemo(() => {
    let arr = Object.values(patients);
    if (filter !== "all") arr = arr.filter((p) => p.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter((p) => {
        const name = `${p.data.firstName || ""} ${p.data.lastName || ""}`.toLowerCase();
        return name.includes(q) || p.id.toLowerCase().includes(q);
      });
    }

    const rank = { filling: 0, submitted: 1, inactive: 2 };
    return arr.sort((a, b) => {
      const r = (rank[a.status] ?? 3) - (rank[b.status] ?? 3);
      if (r !== 0) return r;
      return b.lastActive - a.lastActive;
    });
  }, [patients, filter, query]);

  const counts = useMemo(() => {
    const arr = Object.values(patients);
    return {
      all: arr.length,
      filling: arr.filter((p) => p.status === "filling").length,
      submitted: arr.filter((p) => p.status === "submitted").length,
      inactive: arr.filter((p) => p.status === "inactive").length,
    };
  }, [patients]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-2xl font-medium text-paper">Staff Monitor</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-dust">
            <span className={"h-1.5 w-1.5 rounded-full " + (connected ? "bg-sage" : "bg-clay")} />
            {connected ? "Live" : "Reconnecting…"}
          </p>
        </div>

        <input
          type="search"
          placeholder="Search by name or reference…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-paper placeholder:text-dust focus:outline-none sm:w-72"
        />
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors " +
              (filter === f.key
                ? "bg-clay text-white"
                : "bg-white/5 text-dust hover:bg-white/10")
            }
          >
            {f.label}
            <span className="ml-1.5 opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-white/5 bg-white/[0.02] py-16 text-center text-sm text-dust">
          No patients match this view yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((record) => (
            <PatientCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
