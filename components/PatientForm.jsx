import { useEffect, useMemo, useRef, useState } from "react";
import FormField from "./FormField";
import { useSocket } from "../lib/useSocket";
import { getOrCreatePatientId } from "../lib/patientSession";
import { FIELD_GROUPS, validateField, validateAll, isGroupComplete } from "../lib/formSchema";

const DEBOUNCE_MS = 350;

export default function PatientForm() {
  const { socket, connected } = useSocket();
  const [patientId, setPatientId] = useState(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const debounceRef = useRef(null);
  const pendingRef = useRef({});

  // Establish (or resume) this patient's session on mount.
  useEffect(() => {
    const id = getOrCreatePatientId();
    setPatientId(id);
    socket.emit("patient:join", id);
  }, [socket]);

  const flushUpdate = () => {
    if (!patientId || Object.keys(pendingRef.current).length === 0) return;
    socket.emit("patient:update", { id: patientId, data: pendingRef.current });
    pendingRef.current = {};
  };

  const handleChange = (name, value) => {
    setData((prev) => ({ ...prev, [name]: value }));
    pendingRef.current[name] = value;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushUpdate, DEBOUNCE_MS);
  };

  const handleBlur = (name) => {
    setErrors((prev) => ({ ...prev, [name]: validateField(name, data[name]) }));
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const group = FIELD_GROUPS[step];
  const isLastStep = step === FIELD_GROUPS.length - 1;
  const stepComplete = isGroupComplete(group.key, data);

  const goNext = () => {
    const groupErrors = {};
    for (const f of group.fields) {
      const err = validateField(f.name, data[f.name]);
      if (err) groupErrors[f.name] = err;
    }
    setErrors((prev) => ({ ...prev, ...groupErrors }));
    if (Object.keys(groupErrors).length > 0) return;
    flushUpdate();
    setStep((s) => Math.min(s + 1, FIELD_GROUPS.length - 1));
  };

  const goBack = () => {
    flushUpdate();
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLastStep) {
      goNext();
      return;
    }
    setSubmitAttempted(true);
    const allErrors = validateAll(data);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      // Jump back to the first step that has a problem.
      const badGroupIndex = FIELD_GROUPS.findIndex((g) =>
        g.fields.some((f) => allErrors[f.name])
      );
      if (badGroupIndex !== -1) setStep(badGroupIndex);
      return;
    }
    flushUpdate();
    socket.emit("patient:submit", { id: patientId, data });
    setSubmitted(true);
  };

  const progressPct = useMemo(
    () => Math.round(((step + 1) / FIELD_GROUPS.length) * 100),
    [step]
  );

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage/15">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B8F71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-medium text-ink">Thanks — you&apos;re all set</h1>
        <p className="mt-3 text-ink-light">
          Your information has been sent to our staff. Please have a seat; someone will call you shortly.
        </p>
        <p className="mt-8 font-mono text-xs text-dust">Reference: {patientId}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-6 py-10 sm:py-14">
      <header className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-display text-2xl font-medium text-ink">Patient Intake</p>
          <span
            className={
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium " +
              (connected ? "bg-sage/15 text-sage" : "bg-dust/20 text-dust")
            }
          >
            <span className={"h-1.5 w-1.5 rounded-full " + (connected ? "bg-sage" : "bg-dust")} />
            {connected ? "Synced" : "Connecting…"}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-dust-light/60">
          <div
            className="h-full rounded-full bg-clay transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-dust">
          {FIELD_GROUPS.map((g, i) => (
            <span key={g.key} className={i === step ? "font-semibold text-ink-light" : ""}>
              {i + 1}. {g.title.replace(/[?]/g, "")}
            </span>
          ))}
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <h2 className="mb-5 font-display text-xl font-medium text-ink">{group.title}</h2>

        <div className="space-y-5">
          {group.fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={data[field.name]}
              error={errors[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-light disabled:opacity-0"
          >
            Back
          </button>

          {isLastStep ? (
            <button
              type="submit"
              className="rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink-light"
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-clay px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay-dark"
            >
              Continue
            </button>
          )}
        </div>

        {submitAttempted && Object.keys(errors).some((k) => errors[k]) && (
          <p className="mt-4 text-center text-sm text-clay-dark">
            Please check the highlighted fields above.
          </p>
        )}
      </form>
    </div>
  );
}
