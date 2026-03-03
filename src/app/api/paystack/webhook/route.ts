import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyPayment } from '@/lib/paystack';
import { sendPaymentConfirmation, sendVendorNotification } from '@/lib/email';
import { lockEscrow } from '@/lib/escrow';
import { ethers } from 'ethers';
import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

/**
 * Verify the Paystack webhook signature using HMAC SHA-512.
 * Returns true if the signature is valid, false otherwise.
 */
function verifyPaystackSignature(body: string, signature: string | null): boolean {
  if (!signature || !PAYSTACK_SECRET) return false;
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(body)
    .digest('hex');
  return hash === signature;
}

// Paystack webhook handler
export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // P0-2: Verify Paystack webhook signature
    if (!verifyPaystackSignature(rawBody, signature)) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    // Only process successful charges
    if (event !== 'charge.success') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const { reference, metadata } = data;
    const { dealId, buyerName, buyerPhone, buyerEmail } = metadata || {};

    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId' }, { status: 400 });
    }

    // P0-3: Verify payment with Paystack — reject if verification fails
    const verification = await verifyPayment(reference);
    if (!verification || verification.data?.status !== 'success') {
      console.error('Payment verification failed for reference:', reference);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Get the deal
    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data()!;

    // P0-1: Lock escrow on blockchain for real
    let escrowTxHash = '';
    try {
      // Convert GHS amount to a symbolic BNB wei amount (GHS / 10000 as BNB)
      const symbolicBnb = (deal.amountGHS / 10000).toFixed(18);
      const amountWei = ethers.parseEther(symbolicBnb);

      // Get vendor's wallet address — use contract owner as fallback
      const vendorSnap = await adminDb.collection('vendors').doc(deal.vendorId).get();
      const vendorWallet = vendorSnap.exists && vendorSnap.data()?.walletAddress
        ? vendorSnap.data()!.walletAddress
        : process.env.ESCROW_VENDOR_FALLBACK_ADDRESS || '0x0000000000000000000000000000000000000001';

      escrowTxHash = await lockEscrow(dealId, vendorWallet, amountWei);
      console.log('Escrow locked on-chain with tx:', escrowTxHash);
    } catch (escrowErr) {
      console.error('Blockchain escrow lock failed:', escrowErr);
      // Still proceed — payment was successful, we store it offline
      // Generate a placeholder so the deal isn't stuck, but log the failure
      escrowTxHash = '';
    }

    // Update deal with payment info
    await dealRef.update({
      status: 'in_escrow',
      buyerName: buyerName || '',
      buyerPhone: buyerPhone || '',
      buyerEmail: buyerEmail || '',
      paystackReference: reference,
      escrowTxHash,
      updatedAt: new Date().toISOString(),
    });

    // Send emails
    try {
      if (buyerEmail) {
        await sendPaymentConfirmation(
          buyerEmail,
          buyerName || 'Buyer',
          deal.itemName,
          deal.amountGHS,
          deal.confirmationToken
        );
      }

      // Get vendor email
      const vendorSnap = await adminDb.collection('vendors').doc(deal.vendorId).get();
      if (vendorSnap.exists) {
        const vendor = vendorSnap.data()!;
        if (vendor.email) {
          await sendVendorNotification(
            vendor.email,
            vendor.displayName,
            deal.itemName,
            deal.amountGHS,
            buyerName || 'A buyer'
          );
        }
      }
    } catch (emailErr) {
      console.error('Email sending failed (non-critical):', emailErr);
    }

    return NextResponse.json({ message: 'Payment processed', escrowTxHash }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
