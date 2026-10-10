import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { duration, ease, fadeUp, staggerDelay } from "./presets.js";

// Fades a block up once on mount; reduced motion gets a plain fade.
export function FadeUp({ as = "div", delay = 0, className, children, ...props }) {
  const reduce = useReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={reduce ? { opacity: 0 } : "hidden"}
      animate={reduce ? { opacity: 1 } : "show"}
      variants={fadeUp}
      transition={reduce ? { duration: duration.micro } : { delay }}
      {...props}
    >
      {children}
    </Component>
  );
}

// Wraps list children so the first render staggers in (capped, see presets).
export function StaggerItem({ index = 0, as = "div", className, children, ...props }) {
  const reduce = useReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? duration.micro : duration.state, ease: ease.out, delay: reduce ? 0 : staggerDelay(index) }}
      {...props}
    >
      {children}
    </Component>
  );
}

// Counts a number up the first time it scrolls into view.
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("es-CO"), className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const target = Number(value) || 0;
  const [shown, setShown] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      setShown(target);
      return undefined;
    }
    const controls = animate(0, target, { duration: 0.6, ease: ease.out, onUpdate: setShown });
    return () => controls.stop();
  }, [inView, reduce, target]);

  return <span ref={ref} className={`tabular ${className || ""}`}>{format(shown)}</span>;
}
