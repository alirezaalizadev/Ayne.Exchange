'use client';

import dynamic from 'next/dynamic';

/**
 * Client boundary that lazy-loads the network experience (map + geometry
 * chunk) off the critical path. The placeholder reserves the same aspect
 * ratio per breakpoint so CLS stays at 0; the map's own entrance sequence
 * begins when it scrolls into view anyway, so nothing visual is lost.
 */
export const NetworkLazy = dynamic(
  () => import('./network-experience').then((m) => m.NetworkExperience),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-[575/340] md:aspect-[940/500] lg:aspect-[1120/555]" aria-hidden />
    ),
  },
);
