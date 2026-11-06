import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { duration, ease } from "../../motion/presets.js";

// Brand stage of the auth screen: a lime light that falls from the top edge and
// dies into near-black, the same in both themes (it is a brand surface, not
// chrome). Static on purpose: the content inside carries the motion.
const STAGE_BACKGROUND = [
  // Haze on the top corners, so the light reads as coming from above the frame.
  "radial-gradient(45% 30% at 12% 0%, rgb(232 255 214 / 0.55) 0%, transparent 70%)",
  "radial-gradient(45% 30% at 88% 0%, rgb(232 255 214 / 0.45) 0%, transparent 70%)",
  // The fall: lime, brand green, forest, then almost black.
  "linear-gradient(180deg, #b6f28a 0%, #6fcf45 16%, #2f8a1f 34%, #0f4a12 54%, #06200a 74%, #030a04 100%)",
].join(", ");

export function AuthStage({ children, className = "" }) {
  return (
    <section
      className={`relative isolate flex overflow-hidden rounded-2xl text-white ${className}`}
      style={{ background: STAGE_BACKGROUND }}
    >
      {/* Side vignette keeps the edges calm next to the form. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "linear-gradient(90deg, rgb(3 10 4 / 0.35) 0%, transparent 18%, transparent 82%, rgb(3 10 4 / 0.35) 100%)" }}
      />
      {children}
    </section>
  );
}

export const REGISTER_STEPS = [
  { id: "account", label: "Crea tu cuenta" },
  { id: "agency", label: "Configura tarifas y catálogo" },
  { id: "brief", label: "Procesa tu primer brief" },
];

// Onboarding steps for the register mode. The current step is a white card;
// the rest are quiet translucent rows. Done steps swap the number for a check.
export function RegisterSteps({ active = 0, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <ol className={`flex w-full max-w-[320px] flex-col gap-2 ${className}`} aria-label="Pasos para empezar">
      {REGISTER_STEPS.map((step, index) => {
        const current = index === active;
        const done = index < active;
        return (
          <motion.li
            key={step.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.panel, ease: ease.out, delay: reduce ? 0 : 0.12 + index * 0.06 }}
            aria-current={current ? "step" : undefined}
            className={`flex h-12 items-center gap-3 rounded-xl px-4 text-sm transition-colors duration-200 ${
              current ? "bg-white text-[#0e0f0c]" : "bg-white/[0.08] text-white/80"
            }`}
          >
            <span
              className={`tabular grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-medium ${
                current ? "bg-[#0e0f0c] text-white" : "bg-white/15 text-white/80"
              }`}
            >
              {done ? <Check size={12} strokeWidth={2.5} aria-hidden="true" /> : index + 1}
            </span>
            {step.label}
          </motion.li>
        );
      })}
    </ol>
  );
}
