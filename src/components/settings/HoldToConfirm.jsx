import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";
import { duration, ease } from "../../motion/presets.js";

const HOLD_MS = 800;

// Destructive action that needs a deliberate press-and-hold: the fill bar
// runs for HOLD_MS and only then calls onConfirm; releasing early cancels.
// Works with pointer (mouse/touch/pen) and with Space/Enter held down.
export function HoldToConfirm({ label = "Mantén para eliminar", onConfirm, onCancel, disabled = false, compact = false, className = "" }) {
  const reduce = useReducedMotion();
  const [holding, setHolding] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const mounted = useRef(true);

  useEffect(() => () => {
    mounted.current = false;
    clearTimeout(timer.current);
  }, []);

  function start() {
    if (disabled || busy || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(async () => {
      timer.current = null;
      setHolding(false);
      setBusy(true);
      try {
        await onConfirm?.();
      } finally {
        if (mounted.current) setBusy(false);
      }
    }, HOLD_MS);
  }

  function cancel() {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
    onCancel?.();
  }

  function onKeyDown(event) {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      start();
    }
  }

  function onKeyUp(event) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      cancel();
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-label={label}
      title={label}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onContextMenu={(event) => event.preventDefault()}
      className={`relative inline-flex h-8 select-none items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-line px-2.5 text-xs font-medium text-danger transition-colors duration-200 hover:border-danger/50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 origin-left bg-danger/15"
        initial={false}
        animate={{ scaleX: holding ? 1 : 0 }}
        transition={holding ? { duration: reduce ? 0 : HOLD_MS / 1000, ease: "linear" } : { duration: duration.state, ease: ease.out }}
      />
      <span className="relative flex items-center gap-1.5">
        {busy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Trash2 size={13} aria-hidden />}
        {!compact && <span>{holding ? "Sigue presionando…" : label}</span>}
      </span>
    </button>
  );
}

export default HoldToConfirm;
