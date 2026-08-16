import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation helpers. Import these instead of next/link and
 * next/navigation so locale prefixes are handled for you.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
