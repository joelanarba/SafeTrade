const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function paystackHeaders() {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json',
  };
}

export async function initializePayment(params: {
  email: string;
  amount: number; // in kobo (pesewas for GHS) — amount * 100
  reference: string;
  callback_url: string;
  currency?: string;
  metadata?: Record<string, string>;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callback_url,
      currency: params.currency || 'GHS',
      metadata: params.metadata,
    }),
  });
  return res.json();
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: 'GET',
    headers: paystackHeaders(),
  });
  return res.json();
}

export async function createTransferRecipient(params: {
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      type: 'mobile_money',
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
      currency: params.currency || 'GHS',
    }),
  });
  return res.json();
}

export async function initiateTransfer(params: {
  amount: number; // in pesewas
  recipient: string; // recipient code from createTransferRecipient
  reason: string;
  reference: string;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      source: 'balance',
      amount: params.amount,
      recipient: params.recipient,
      reason: params.reason,
      reference: params.reference,
    }),
  });
  return res.json();
}

// MoMo provider to Paystack bank code mapping for Ghana
export const MOMO_BANK_CODES: Record<string, string> = {
  MTN: 'MTN',
  Vodafone: 'VOD',
  AirtelTigo: 'ATL',
};
