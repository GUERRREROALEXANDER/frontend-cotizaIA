import { forwardRef, useId, useState } from "react";
import { toast } from "sonner";
import { COUNTER_VISIBLE_FROM, COUNTER_WARNING_FROM } from "../limits.js";

// Wise input: 10px radius, pebble hairline, forest border on focus.
export const fieldClass =
  "w-full rounded-lg border border-line-strong bg-surface px-4 py-3 text-[15px] text-fg outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-out placeholder:text-faint hover:border-brand/60 focus:border-brand focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-danger";

// Label + control + hint/error row. Every form control goes through this so
// spacing, error wording and ids stay consistent across screens.
export function Field({ label, hint, error, htmlFor, counter, className = "", children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-fg">
          {label}
        </label>
      )}
      {children}
      {(hint || error || counter) && (
        <div className="mt-2 flex items-start justify-between gap-3 text-xs leading-4">
          <span id={htmlFor ? `${htmlFor}-msg` : undefined} className={error ? "text-danger" : "text-faint"} role={error ? "alert" : undefined}>
            {error || hint}
          </span>
          {counter}
        </div>
      )}
    </div>
  );
}

function CharCounter({ length, limit, alwaysVisible }) {
  const ratio = limit ? length / limit : 0;
  if (!limit || (!alwaysVisible && ratio < COUNTER_VISIBLE_FROM)) return null;
  const tone = ratio >= 1 ? "text-danger" : ratio >= COUNTER_WARNING_FROM ? "text-warning" : "text-faint";
  return (
    <span className={`shrink-0 font-mono tabular transition-colors duration-200 ${tone}`} aria-live="polite">
      {length.toLocaleString("es-CO")}/{limit.toLocaleString("es-CO")}
    </span>
  );
}

// Shared cap behavior: the native maxLength blocks typing, a paste that
// overflows is cut by the browser and we tell the user how much was dropped,
// and typing at the cap shakes the field once so the block is noticed.
function useLimit(limit, value) {
  const [shake, setShake] = useState(false);
  const length = String(value ?? "").length;

  function onPaste(event) {
    if (!limit) return;
    const target = event.currentTarget;
    const pasted = event.clipboardData?.getData("text") ?? "";
    const selected = (target.selectionEnd ?? 0) - (target.selectionStart ?? 0);
    const overflow = length - selected + pasted.length - limit;
    if (overflow > 0) {
      toast.warning(`Se recortaron ${overflow.toLocaleString("es-CO")} caracteres`, {
        description: `Este campo admite hasta ${limit.toLocaleString("es-CO")}.`,
      });
    }
  }

  function onBeforeInput(event) {
    const target = event.currentTarget;
    const hasSelection = target.selectionEnd !== target.selectionStart;
    if (limit && length >= limit && !hasSelection) {
      setShake(false);
      requestAnimationFrame(() => setShake(true));
    }
  }

  return { length, shake, onPaste, onBeforeInput, onAnimationEnd: () => setShake(false) };
}

export const LimitedInput = forwardRef(function LimitedInput(
  { label, hint, error, limit, id, className = "", fieldClassName = "", value, onPaste, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  const cap = useLimit(limit, value);
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} className={className} counter={<CharCounter length={cap.length} limit={limit} />}>
      <input
        ref={ref}
        id={inputId}
        value={value}
        maxLength={limit}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${inputId}-msg` : undefined}
        className={`${fieldClass} ${cap.shake ? "limit-shake" : ""} ${fieldClassName}`}
        onPaste={(event) => { cap.onPaste(event); onPaste?.(event); }}
        onBeforeInput={cap.onBeforeInput}
        onAnimationEnd={cap.onAnimationEnd}
        {...props}
      />
    </Field>
  );
});

export const LimitedTextarea = forwardRef(function LimitedTextarea(
  { label, hint, error, limit, id, className = "", fieldClassName = "", value, onPaste, alwaysShowCounter = false, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  const cap = useLimit(limit, value);
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} className={className} counter={<CharCounter length={cap.length} limit={limit} alwaysVisible={alwaysShowCounter} />}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        value={value}
        maxLength={limit}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${inputId}-msg` : undefined}
        className={`${fieldClass} resize-y leading-6 ${cap.shake ? "limit-shake" : ""} ${fieldClassName}`}
        onPaste={(event) => { cap.onPaste(event); onPaste?.(event); }}
        onBeforeInput={cap.onBeforeInput}
        onAnimationEnd={cap.onAnimationEnd}
        {...props}
      />
    </Field>
  );
});

export function Select({ label, hint, error, id, className = "", children, ...props }) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={selectId} className={className}>
      <select id={selectId} aria-invalid={error ? true : undefined} className={`${fieldClass} appearance-none pr-8`} {...props}>
        {children}
      </select>
    </Field>
  );
}
