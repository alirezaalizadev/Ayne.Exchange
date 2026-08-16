/** Shared quote types (safe to import from both client and server files). */
export interface QuoteActionResult {
  ok: boolean;
  reference?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}
