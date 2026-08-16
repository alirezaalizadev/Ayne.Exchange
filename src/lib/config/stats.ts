/**
 * Homepage trust statistics. Admin-configurable later via SiteSetting; these
 * are the defaults. Wording is deliberately careful: "combined transaction
 * experience", NOT audited volume.
 *
 * `labelKey` resolves against the `stats` namespace. Use `to` for count-up
 * numbers or `textKey` (also in `stats`) for non-numeric values.
 */
export interface StatDef {
  labelKey: string;
  to?: number;
  prefix?: string;
  suffix?: string;
  textKey?: string;
}

export const homeStats: StatDef[] = [
  { labelKey: 'yearsExperience', to: 7, suffix: '+' },
  { labelKey: 'transactionExperience', prefix: '$', to: 1, suffix: 'B+' },
  { labelKey: 'networkExperience', textKey: 'global' },
  { labelKey: 'paymentRoutes', textKey: 'multiple' },
];
