const STATUS_META = {
  filling: { color: "#C97B63", label: "Filling in" },
  submitted: { color: "#6B8F71", label: "Submitted" },
  inactive: { color: "#A8A29B", label: "Inactive" },
};

export default function StatusPulse({ status }) {
  const meta = STATUS_META[status] || STATUS_META.inactive;
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {status === "filling" && (
          <span
            className="absolute inline-flex h-full w-full animate-pulse_ring rounded-full"
            style={{ backgroundColor: meta.color }}
          />
        )}
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
      </span>
      <span className="text-xs font-medium" style={{ color: meta.color }}>
        {meta.label}
      </span>
    </span>
  );
}
