import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Load .env into process.env for tests (Next.js does this automatically at
 * runtime; vitest does not). Existing env vars win.
 */
try {
  const raw = readFileSync(resolve(__dirname, '../../.env'), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {
  /* .env is optional — CI can inject env directly */
}
