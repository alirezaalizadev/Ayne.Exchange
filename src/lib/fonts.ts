import { Manrope, Vazirmatn, JetBrains_Mono } from 'next/font/google';

/**
 * ONE English/Latin + Cyrillic family across the whole site — Manrope (variable,
 * full weight range + high-quality Cyrillic for Russian). Headings and body use
 * the SAME family, differentiated only by weight.
 */
export const fontSans = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

/** ONE Persian family (RTL). */
export const fontFa = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-fa',
  display: 'swap',
});

/** Monospace — ONLY for technical reference codes (e.g. AYN-260812-X7K4). */
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const fontVariables = `${fontSans.variable} ${fontFa.variable} ${fontMono.variable}`;
