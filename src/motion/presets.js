// Motion tokens from docs/DESIGN.md. Durations are seconds for framer-motion.
export const ease = {
  out: [0.22, 1, 0.36, 1],
  fluid: [0.32, 0.72, 0, 1],
  in: [0.64, 0, 0.78, 0],
};

export const duration = { micro: 0.12, state: 0.22, panel: 0.42, reveal: 0.64 };

export const STAGGER_STEP = 0.06;
export const STAGGER_MAX_ITEMS = 8;

export const viewTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.panel, ease: ease.out } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.panel * 0.6, ease: ease.in } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: duration.panel, ease: ease.out } },
};

// Items past STAGGER_MAX_ITEMS share the last delay, so long lists never crawl in.
export function staggerDelay(index) {
  return Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_STEP;
}

export const overlay = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: duration.panel, ease: ease.fluid } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: duration.panel * 0.6, ease: ease.in } },
};

// Reduced-motion variants keep the state change visible with opacity only.
export const reducedFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.micro } },
  exit: { opacity: 0, transition: { duration: duration.micro } },
};
