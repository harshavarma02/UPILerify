import assert from 'node:assert/strict';
import test from 'node:test';
import { buildUpiAppLinks, buildUpiIntentUri, buildUpiQueryString } from '../lib/payments/upiIntent.ts';

const sampleOrder = {
  merchantUpiId: 'creator@okhdfcbank',
  merchantName: 'Acme Studio & Co',
  amount: 499.03,
  refNote: 'ORD-A1B2C',
};

test('builds encoded NPCI query parameters with two decimal places', () => {
  const query = buildUpiQueryString(sampleOrder);
  const parsed = new URLSearchParams(query);

  assert.equal(parsed.get('pa'), 'creator@okhdfcbank');
  assert.equal(parsed.get('pn'), 'Acme Studio & Co');
  assert.equal(parsed.get('am'), '499.03');
  assert.equal(parsed.get('cu'), 'INR');
  assert.equal(parsed.get('tn'), 'ORD-A1B2C');
});

test('formats whole amounts with trailing decimals in universal intent URI', () => {
  const uri = buildUpiIntentUri({ ...sampleOrder, amount: 150 });
  assert.ok(uri.startsWith('upi://pay?'));
  assert.ok(uri.includes('am=150.00'));
});

test('generates dedicated Google Pay, PhonePe, Paytm, and fallback deep links', () => {
  const { apps, fallbackUri } = buildUpiAppLinks(sampleOrder);
  const byId = Object.fromEntries(apps.map((app) => [app.id, app.uri]));

  assert.ok(byId.gpay.startsWith('tez://upi/pay?'));
  assert.ok(byId.phonepe.startsWith('phonepe://pay?'));
  assert.ok(byId.paytm.startsWith('paytmmp://pay?'));
  assert.ok(fallbackUri.startsWith('upi://pay?'));

  const expectedQuery = fallbackUri.split('?')[1];
  assert.equal(byId.gpay.split('?')[1], expectedQuery);
  assert.equal(byId.phonepe.split('?')[1], expectedQuery);
  assert.equal(byId.paytm.split('?')[1], expectedQuery);
});

test('rejects invalid or non-positive amounts', () => {
  for (const invalid of [0, -10, Number.NaN]) {
    assert.throws(() => buildUpiIntentUri({ ...sampleOrder, amount: invalid }), /positive number/);
  }
});
