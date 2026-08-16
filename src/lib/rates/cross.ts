import Big from 'big.js';

/**
 * Pure cross-rate engine — the SINGLE conversion logic, shared by the server
 * (rate cards, chips, ticker) and the client (calculator). Given the set of
 * admin-managed pairs, it converts between any two connected currencies via a
 * shortest-path walk (handles direct, inverse and cross rates uniformly).
 *
 * A pair {base, quote, rate} means: 1 base = rate quote.
 */
export interface RatePair {
  base: string;
  quote: string;
  rate: number;
}

/** Convert `amount` from one currency to another. Returns null if unreachable. */
export function convertAmount(
  pairs: RatePair[],
  amount: number,
  from: string,
  to: string,
): number | null {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (!isFinite(amount)) return null;
  if (f === t) return amount;

  // Adjacency: currency -> [{ next, factor }] where value * factor stays consistent.
  const adj = new Map<string, { next: string; factor: number }[]>();
  const add = (a: string, b: string, factor: number) => {
    if (!isFinite(factor) || factor <= 0) return;
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push({ next: b, factor });
  };
  for (const p of pairs) {
    const b = p.base.toUpperCase();
    const q = p.quote.toUpperCase();
    if (!p.rate || p.rate <= 0) continue;
    add(b, q, p.rate); // 1 base = rate quote
    add(q, b, 1 / p.rate);
  }

  // BFS for the fewest hops (most reliable path).
  const queue: string[] = [f];
  const factorTo = new Map<string, Big>([[f, new Big(1)]]);
  const visited = new Set<string>([f]);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === t) break;
    for (const edge of adj.get(cur) ?? []) {
      if (visited.has(edge.next)) continue;
      visited.add(edge.next);
      factorTo.set(edge.next, factorTo.get(cur)!.times(edge.factor));
      queue.push(edge.next);
    }
  }

  const factor = factorTo.get(t);
  if (!factor) return null;
  try {
    return Number(new Big(amount).times(factor));
  } catch {
    return null;
  }
}

/** Unit rate: 1 `from` = X `to`. */
export function getCrossRate(pairs: RatePair[], from: string, to: string): number | null {
  return convertAmount(pairs, 1, from, to);
}

/** Currencies reachable in the pair graph (for populating selectors). */
export function currenciesInPairs(pairs: RatePair[]): string[] {
  const set = new Set<string>();
  for (const p of pairs) {
    set.add(p.base.toUpperCase());
    set.add(p.quote.toUpperCase());
  }
  return [...set];
}
