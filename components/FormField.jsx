export default function FormField({ field, value, error, onChange, onBlur }) {
  const { name, label, type, required, options, autoComplete } = field;
  const inputId = `field-${name}`;
  const baseClasses =
    "w-full rounded-lg border bg-white/70 px-4 py-3 text-base text-ink placeholder:text-dust " +
    "transition-colors focus:bg-white focus:outline-none " +
    (error ? "border-clay-dark" : "border-dust-light focus:border-ink-light");

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-light">
        {label}
        {required && <span className="ml-0.5 text-clay-dark">*</span>}
        {!required && <span className="ml-1.5 text-xs font-normal text-dust">optional</span>}
      </label>

      {type === "select" ? (
        <select
          id={inputId}
          name={name}
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur(name)}
          className={baseClasses}
        >
          <option value="" disabled>
            Select…
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={inputId}
          name={name}
          rows={3}
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur(name)}
          className={baseClasses}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur(name)}
          className={baseClasses}
        />
      )}

      {error && <p className="mt-1.5 text-sm text-clay-dark">{error}</p>}
    </div>
  );
}
