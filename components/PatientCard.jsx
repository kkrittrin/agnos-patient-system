import { useEffect, useState } from "react";
import StatusPulse from "./StatusPulse";
import { ALL_FIELDS } from "../lib/formSchema";
import { timeAgo } from "../lib/time";

export default function PatientCard({ record }) {
  const [, forceTick] = useState(0);

  // Re-render every few seconds purely so the "x seconds ago" label
  // stays fresh without needing a fresh socket event.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 4000);
    return () => clearInterval(t);
  }, []);

  const { data, status, lastActive, submittedAt, id } = record;
  const displayName =
    [data.firstName, data.lastName].filter(Boolean).join(" ") || "New patient";

  const filledFields = ALL_FIELDS.filter((f) => (data[f.name] ?? "").toString().trim());

  return (
    <div
      className={
        "rounded-xl border p-5 transition-colors " +
        (status === "submitted"
          ? "border-sage/30 bg-sage/[0.06]"
          : status === "inactive"
          ? "border-white/5 bg-white/[0.02] opacity-70"
          : "border-clay/20 bg-white/[0.03]")
      }
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-medium text-paper">{displayName}</p>
          <p className="font-mono text-[11px] text-dust">
            {id} · {timeAgo(lastActive)}
          </p>
        </div>
        <StatusPulse status={status} />
      </div>

      {filledFields.length === 0 ? (
        <p className="py-3 text-sm italic text-dust">No fields entered yet…</p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {filledFields.map((f) => (
            <div key={f.name} className="min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-dust">{f.label}</dt>
              <dd className="truncate text-paper/90">{data[f.name]}</dd>
            </div>
          ))}
        </dl>
      )}

      {status === "submitted" && submittedAt && (
        <p className="mt-3 text-xs text-sage-light">
          Submitted {timeAgo(submittedAt)}
        </p>
      )}
    </div>
  );
}
