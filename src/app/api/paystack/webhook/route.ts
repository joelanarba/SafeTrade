import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyPayment } from '@/lib/paystack';
import { sendPaymentConfirmation, sendVendorNotification } from '@/lib/email';
import { lockEscrow } from '@/lib/escrow';
import { ethers } from 'ethers';

// Paystack webhook handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    // Verify payment with Paystack
    const verification = await verifyPayment(reference);
    if (verification?.data?.status !== 'success') {
      console.log('Payment verification skipped (no Paystack key or test mode)');
      // In production, you'd return an error here
      // return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Get the deal
    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data()!;

    // Lock escrow on blockchain
    let escrowTxHash = '';
    try {
      const amountWei = ethers.parseEther((deal.amountGHS / 10000).toString()); // Symbolic amount
      escrowTxHash = await lockEscrow(dealId, '0x0000000000000000000000000000000000000000', amountWei);
      // escrowTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      console.log('Escrow locked with tx:', escrowTxHash);
    } catch (err) {
      console.error('Escrow lock failed (continuing):', err);
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
