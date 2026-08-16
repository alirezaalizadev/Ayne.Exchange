'use client';

import * as React from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Counts up to `to` once when scrolled into view. For non-numeric stats
 * (e.g. "Global"), pass `text` and it renders statically.
 */
export function StatCounter({
  to,
  text,
  prefix = '',
  suffix = '',
  duration = 1400,
}: {
  to?: number;
  text?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (text !== undefined || to === undefined) return;
    if (!inView) return;
    if (reduce) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce, text]);

  return (
    <span ref={ref} className="tabular-nums">
      {text !== undefined ? text : `${prefix}${value}${suffix}`}
    </span>
  );
}
