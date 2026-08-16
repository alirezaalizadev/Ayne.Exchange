'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variant } from 'framer-motion';

/**
 * Lightweight scroll-reveal wrapper. Fades/slides content in on first view.
 * Honors prefers-reduced-motion (renders statically).
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'span';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  const hidden: Variant = reduce ? { opacity: 1 } : { opacity: 0, y };
  const shown: Variant = { opacity: 1, y: 0 };

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-80px' }}
      variants={{ hidden, shown }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}
