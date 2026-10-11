import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { COUNTER_VISIBLE_FROM, COUNTER_WARNING_FROM, LIMITS } from "../limits.js";
import { duration, ease } from "../motion/presets.js";

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

function normalizeOptionText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function initialsOfLabel(text) {
  let out = "";
  for (const part of String(text ?? "").trim().split(/\s+/)) {
    const char = [...part].find((item) => /[\p{L}\p{N}]/u.test(item));
    if (char) out += char;
    if (out.length >= 2) break;
  }
  return (out || "?").toUpperCase();
}

// Custom combobox that replaces the native select. Options carry value,
// label and optional description, meta and initials; the trigger shows the
// selected option with its avatar, and the popover offers search, keyboard
// navigation and an empty state with an optional action.
export function ComboSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  emptyText = "Sin resultados",
  emptyAction,
  searchable,
  id,
  required,
  error,
  className = "",
  ...props
}) {
  const autoId = useId();
  const triggerId = id || `combo-${autoId.replaceAll(":", "")}`;
  const listId = `${triggerId}-list`;
  const searchId = `${triggerId}-search`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const itemRefs = useRef([]);
  const typeahead = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const reduce = useReducedMotion();

  const canSearch = searchable ?? options.length > 5;
  const selected = options.find((option) => String(option.value) === String(value ?? ""));

  const filtered = useMemo(() => {
    const asked = normalizeOptionText(query.trim());
    if (!asked) return options;
    return options.filter((option) =>
      normalizeOptionText([option.label, option.description, option.meta].filter(Boolean).join(" ")).includes(asked),
    );
  }, [options, query]);

  function openMenu() {
    const selectedIndex = options.findIndex((option) => String(option.value) === String(value ?? ""));
    setQuery("");
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
    if (searchable ?? options.length > 5) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }

  function closeMenu(focusTrigger = false) {
    setOpen(false);
    setQuery("");
    if (focusTrigger) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function choose(option) {
    onChange?.(String(option.value));
    closeMenu(true);
  }

  function move(delta) {
    if (!filtered.length) return;
    setActiveIndex((current) => {
      const base = current < 0 ? (delta > 0 ? -1 : 0) : current;
      return (base + delta + filtered.length) % filtered.length;
    });
  }

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex((current) => {
      if (!filtered.length) return -1;
      return Math.min(Math.max(current, 0), filtered.length - 1);
    });
  }, [filtered.length, open]);

  useEffect(() => {
    if (open && activeIndex >= 0) itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function onTriggerKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) openMenu();
      else move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter") {
      if (open && filtered[activeIndex]) {
        event.preventDefault();
        choose(filtered[activeIndex]);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        closeMenu(true);
      }
    } else if (event.key === "Home" || event.key === "End") {
      if (open) {
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? 0 : filtered.length - 1);
      }
    } else if (!canSearch && event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const now = Date.now();
      const text = now - typeahead.current.at > 500 ? event.key : typeahead.current.text + event.key;
      typeahead.current = { text, at: now };
      const asked = normalizeOptionText(text);
      const found = options.findIndex((option) => normalizeOptionText(option.label).startsWith(asked));
      if (found >= 0) {
        if (!open) setOpen(true);
        setActiveIndex(found);
      }
    }
  }

  function onSearchKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter") {
      if (filtered[activeIndex]) {
        event.preventDefault();
        choose(filtered[activeIndex]);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : filtered.length - 1);
    }
  }

  const popoverMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: -6, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: duration.state, ease: ease.fluid } },
        exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: duration.micro, ease: ease.in } },
      };

  return (
    <Field label={label} error={error} htmlFor={triggerId} className={className}>
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${triggerId}-msg` : undefined}
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={onTriggerKeyDown}
          className={`flex h-14 w-full items-center gap-3 rounded-xl border bg-surface px-3 text-left outline-none transition-[border-color,box-shadow] duration-200 ease-out hover:border-brand/60 focus:border-brand focus:ring-4 focus:ring-accent-soft aria-invalid:border-danger ${open ? "border-brand ring-4 ring-accent-soft" : "border-line-strong"}`}
          {...props}
        >
          {selected ? (
            <>
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-brand">
                {selected.initials || initialsOfLabel(selected.label)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-fg">{selected.label}</span>
                {selected.description ? (
                  <span className="block truncate text-sm text-muted">{selected.description}</span>
                ) : null}
              </span>
            </>
          ) : (
            <span className="min-w-0 flex-1 truncate text-[15px] text-faint">{placeholder}</span>
          )}
          <ChevronDown size={18} aria-hidden className={`shrink-0 text-muted transition-transform duration-[220ms] ${open ? "rotate-180" : ""}`} />
        </button>
        {required ? (
          <input
            type="text"
            tabIndex={-1}
            aria-hidden
            required
            value={selected ? String(selected.value) : ""}
            onChange={() => {}}
            onFocus={() => triggerRef.current?.focus()}
            className="sr-only"
          />
        ) : null}
        <AnimatePresence>
          {open ? (
            <motion.div
              key="combo-popover"
              {...popoverMotion}
              className="scrollbar-subtle absolute inset-x-0 top-full z-40 mt-2 max-h-80 origin-top overflow-auto rounded-2xl border border-line bg-surface p-2 shadow-overlay"
            >
              {canSearch ? (
                <div className="sticky top-0 bg-surface pb-2">
                  <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3">
                    <Search size={16} aria-hidden className="shrink-0 text-faint" />
                    <input
                      ref={searchRef}
                      id={searchId}
                      value={query}
                      maxLength={LIMITS.search}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                      }}
                      onKeyDown={onSearchKeyDown}
                      placeholder="Buscar..."
                      aria-label="Buscar opciones"
                      aria-controls={listId}
                      className="h-10 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
                    />
                  </div>
                </div>
              ) : null}
              {filtered.length ? (
                <div role="listbox" id={listId} aria-label={typeof label === "string" ? label : "Opciones"}>
                  {filtered.map((option, index) => {
                    const isSelected = selected != null && String(selected.value) === String(option.value);
                    const isActive = index === activeIndex;
                    return (
                      <motion.div
                        key={String(option.value)}
                        initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: reduce ? duration.micro : duration.state,
                          ease: ease.out,
                          delay: reduce ? 0 : Math.min(index, 8) * 0.03,
                        }}
                      >
                        <button
                          ref={(element) => {
                            itemRefs.current[index] = element;
                          }}
                          type="button"
                          role="option"
                          id={`${listId}-${index}`}
                          aria-selected={isSelected}
                          onClick={() => choose(option)}
                          onMouseMove={() => setActiveIndex(index)}
                          className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors duration-150 ${isSelected ? "bg-accent-soft" : isActive ? "bg-surface-2" : "hover:bg-surface-2"}`}
                        >
                          <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${isSelected ? "bg-surface text-brand" : "bg-surface-2 text-muted"}`}>
                            {option.initials || initialsOfLabel(option.label)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-semibold text-fg">{option.label}</span>
                            {option.description ? (
                              <span className="block truncate text-sm text-muted">{option.description}</span>
                            ) : null}
                          </span>
                          {option.meta ? (
                            <span className="shrink-0 font-mono text-sm text-muted">{option.meta}</span>
                          ) : null}
                          {isSelected ? <Check size={18} aria-hidden className="shrink-0 text-brand" /> : null}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-muted">{query.trim() ? `Sin resultados para "${query.trim()}"` : emptyText}</p>
                  {emptyAction ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        emptyAction.onClick?.();
                      }}
                      className="mt-3 inline-flex h-10 items-center rounded-full border border-brand/70 px-4 text-sm font-semibold text-brand transition-colors duration-200 hover:bg-accent-soft"
                    >
                      {emptyAction.label}
                    </button>
                  ) : null}
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Field>
  );
}
