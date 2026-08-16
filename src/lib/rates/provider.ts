import 'server-only';
import { usdRates } from './indicative';

/**
 * Provider-agnostic exchange-rate layer. Selecting/replacing a provider is a
 * config change (RATES_PROVIDER env), never a code rewrite. Add a provider by
 * implementing RateProvider and registering it in `getProvider`.
 */
export interface RateQuote {
  base: string;
  quote: string;
  rate: number;
  sourceLabel: string; // official | NIMA | market | ...
  fetchedAt: Date;
  provider: string;
}

export interface RateProvider {
  name: string;
  /** Fetch USD-based rates for the given currency codes. */
  fetchUsdRates(symbols: string[]): Promise<Record<string, number>>;
}

/** Fallback provider using bundled indicative values. Always available. */
const manualProvider: RateProvider = {
  name: 'manual',
  async fetchUsdRates(symbols) {
    const out: Record<string, number> = {};
    for (const s of symbols) if (usdRates[s] != null) out[s] = usdRates[s];
    return out;
  },
};

/** Example live provider (exchangerate.host). Enable via RATES_PROVIDER. */
const exchangerateHostProvider: RateProvider = {
  name: 'exchangerate-host',
  async fetchUsdRates(symbols) {
    const key = process.env.EXCHANGERATE_HOST_API_KEY ?? '';
    const url = `https://api.exchangerate.host/live?source=USD&currencies=${symbols.join(',')}${
      key ? `&access_key=${key}` : ''
    }`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`rate provider error: ${res.status}`);
    const data = (await res.json()) as { quotes?: Record<string, number> };
    const out: Record<string, number> = {};
    for (const s of symbols) {
      const v = data.quotes?.[`USD${s}`];
      if (typeof v === 'number') out[s] = v;
    }
    return out;
  },
};

const providers: Record<string, RateProvider> = {
  manual: manualProvider,
  'exchangerate-host': exchangerateHostProvider,
};

export function getProvider(): RateProvider {
  const name = process.env.RATES_PROVIDER ?? 'manual';
  return providers[name] ?? manualProvider;
}

/**
 * Resolve a displayed rate: base→quote via USD cross, with graceful fallback to
 * indicative values if the live provider fails. Never throws to the caller.
 */
export async function getDisplayRate(
  base: string,
  quote: string,
): Promise<number | null> {
  try {
    const provider = getProvider();
    const rates = await provider.fetchUsdRates([base, quote]);
    const rb = rates[base] ?? usdRates[base];
    const rq = rates[quote] ?? usdRates[quote];
    if (!rb || !rq) return null;
    return rq / rb;
  } catch {
    const rb = usdRates[base];
    const rq = usdRates[quote];
    return rb && rq ? rq / rb : null;
  }
}
