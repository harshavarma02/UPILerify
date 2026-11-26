/**
 * UPILerify — NPCI UPI Intent & App Deep-Link Builder
 *
 * Centralizes UPI payment URI construction across server order creation
 * and client checkout app buttons so query encoding stays consistent.
 */

export interface UpiIntentParams {
  merchantUpiId: string;
  merchantName: string;
  amount: number;
  refNote: string;
}

export type UpiAppId = 'gpay' | 'phonepe' | 'paytm' | 'generic';
export type DedicatedUpiAppId = Exclude<UpiAppId, 'generic'>;

export interface UpiAppLink<T extends UpiAppId = UpiAppId> {
  id: T;
  name: string;
  schemePrefix: string;
  uri: string;
}

const UPI_APP_SCHEMES: ReadonlyArray<{ id: DedicatedUpiAppId; name: string; schemePrefix: string }> = [
  { id: 'gpay', name: 'GPay', schemePrefix: 'tez://upi/pay' },
  { id: 'phonepe', name: 'PhonePe', schemePrefix: 'phonepe://pay' },
  { id: 'paytm', name: 'Paytm', schemePrefix: 'paytmmp://pay' },
];

/** Builds the canonical NPCI UPI query string for a payment order. */
export function buildUpiQueryString(params: UpiIntentParams): string {
  const numericAmount = Number(params.amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('UPI intent amount must be a positive number.');
  }

  return [
    `pa=${encodeURIComponent(params.merchantUpiId.trim())}`,
    `pn=${encodeURIComponent(params.merchantName.trim())}`,
    `am=${numericAmount.toFixed(2)}`,
    'cu=INR',
    `tn=${encodeURIComponent(params.refNote.trim())}`,
  ].join('&');
}

/** Builds the universal `upi://pay?...` intent URI. */
export function buildUpiIntentUri(params: UpiIntentParams): string {
  return `upi://pay?${buildUpiQueryString(params)}`;
}

/** Builds app-specific deep links alongside the universal `upi://pay` fallback. */
export function buildUpiAppLinks(params: UpiIntentParams): {
  apps: Array<UpiAppLink<DedicatedUpiAppId>>;
  fallbackUri: string;
} {
  const query = buildUpiQueryString(params);
  const apps: Array<UpiAppLink<DedicatedUpiAppId>> = UPI_APP_SCHEMES.map((app) => ({
    id: app.id,
    name: app.name,
    schemePrefix: app.schemePrefix,
    uri: `${app.schemePrefix}?${query}`,
  }));

  return {
    apps,
    fallbackUri: `upi://pay?${query}`,
  };
}
