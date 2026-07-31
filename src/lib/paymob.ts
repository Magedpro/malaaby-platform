/**
 * PayMob API Client
 * Docs: https://developers.paymob.com/egypt/docs
 *
 * Flow:
 *  1. paymobAuth()         → get auth_token (valid ~1 hour)
 *  2. createPaymobOrder()  → get order_id
 *  3. generatePaymentKey() → get payment_key (valid 1 hour)
 *  4. Redirect customer to: https://accept.paymob.com/api/acceptance/iframes/<IFRAME_ID>?payment_token=<payment_key>
 *  5. Webhook hits /api/v1/payments/webhook → verify HMAC → confirm booking
 */

const PAYMOB_BASE = 'https://accept.paymob.com/api';

// ── Step 1: Auth ────────────────────────────────────────────────────────────
export async function paymobAuth(): Promise<string> {
  const apiKey = process.env.PAYMOB_API_KEY;
  if (!apiKey) throw new Error('PAYMOB_API_KEY is not set in environment variables');

  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayMob auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error('PayMob auth: no token in response');
  return data.token as string;
}

// ── Step 2: Create Order ────────────────────────────────────────────────────
export interface PaymobOrderParams {
  authToken: string;
  amountCents: number;   // Amount in PIASTRES (1 EGP = 100 piastres)
  currency?: string;     // Default: 'EGP'
  merchantOrderId: string; // Your internal booking ID
}

export async function createPaymobOrder(params: PaymobOrderParams): Promise<number> {
  const { authToken, amountCents, currency = 'EGP', merchantOrderId } = params;

  const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency,
      merchant_order_id: merchantOrderId,
      items: [],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayMob create order failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.id) throw new Error('PayMob create order: no order id in response');
  return data.id as number;
}

// ── Step 3: Generate Payment Key ────────────────────────────────────────────
export interface PaymobPaymentKeyParams {
  authToken: string;
  amountCents: number;
  orderId: number;
  currency?: string;
  integrationId?: string;
  billingData: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
  };
}

export async function generatePaymentKey(params: PaymobPaymentKeyParams): Promise<string> {
  const {
    authToken, amountCents, orderId,
    currency = 'EGP', billingData, integrationId: customIntegrationId,
  } = params;

  const integrationId = customIntegrationId || process.env.PAYMOB_INTEGRATION_ID;
  if (!integrationId) throw new Error('PAYMOB_INTEGRATION_ID is not set');

  const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        ...billingData,
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'NA',
        country: 'EG',
        state: 'NA',
      },
      currency,
      integration_id: parseInt(integrationId, 10),
      lock_order_when_paid: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayMob payment key failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error('PayMob payment key: no token in response');
  return data.token as string;
}

// ── Build Checkout URL ──────────────────────────────────────────────────────
export function buildCheckoutUrl(paymentToken: string): string {
  const iframeId = process.env.PAYMOB_IFRAME_ID;
  if (!iframeId) throw new Error('PAYMOB_IFRAME_ID is not set');
  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
}

// ── Full Initiation Flow (convenience) ──────────────────────────────────────
export interface InitiatePaymobParams {
  amountEGP: number;       // In EGP — will be converted to piastres
  bookingId: string;       // Your internal booking ID
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod?: 'card' | 'wallet';
}

export async function initiatePaymobPayment(params: InitiatePaymobParams): Promise<{
  checkoutUrl: string;
  paymobOrderId: number;
}> {
  const { amountEGP, bookingId, customerName, customerPhone, customerEmail, paymentMethod = 'wallet' } = params;
  const amountCents = Math.round(amountEGP * 100);

  // Split name into first/last (Arabic names handled gracefully)
  const nameParts = customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'NA';

  const integrationId = paymentMethod === 'wallet' && process.env.PAYMOB_WALLET_INTEGRATION_ID
    ? process.env.PAYMOB_WALLET_INTEGRATION_ID
    : process.env.PAYMOB_INTEGRATION_ID;

  const authToken = await paymobAuth();
  const paymobOrderId = await createPaymobOrder({
    authToken,
    amountCents,
    merchantOrderId: bookingId,
  });
  const paymentKey = await generatePaymentKey({
    authToken,
    amountCents,
    orderId: paymobOrderId,
    integrationId,
    billingData: {
      first_name: firstName,
      last_name: lastName,
      phone_number: customerPhone || 'NA',
      email: customerEmail || 'NA',
    },
  });

  const checkoutUrl = buildCheckoutUrl(paymentKey);
  return { checkoutUrl, paymobOrderId };
}

// ── Webhook HMAC Verification ────────────────────────────────────────────────
/**
 * PayMob sends a `hmac` query param with each webhook.
 * We verify it by concatenating specific fields and hashing with HMAC-SHA512.
 * See: https://developers.paymob.com/egypt/docs/payment-callback
 */
import crypto from 'crypto';

export function verifyPaymobHMAC(params: Record<string, string>): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret) {
    console.error('[PayMob] PAYMOB_HMAC_SECRET is not set — skipping HMAC verification');
    return false;
  }

  // Fields to concatenate IN ORDER (per PayMob docs)
  const fields = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success',
  ];

  const concatenated = fields.map(f => params[f] ?? '').join('');
  const computed = crypto
    .createHmac('sha512', secret)
    .update(concatenated)
    .digest('hex');

  return computed === params['hmac'];
}
