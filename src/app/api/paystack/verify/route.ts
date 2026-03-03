import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyPayment } from '@/lib/paystack';
import { sendPaymentConfirmation, sendVendorNotification } from '@/lib/email';
import { lockEscrow } from '@/lib/escrow';
import { ethers } from 'ethers';

export async function POST(req: NextRequest) {
  try {
    const { reference, dealId, buyerName, buyerPhone, buyerEmail } = await req.json();

    if (!reference || !dealId) {
      return NextResponse.json({ error: 'Missing reference or dealId' }, { status: 400 });
    }

    // 1. Verify with Paystack API
    const verification = await verifyPayment(reference);
    if (!verification || verification.data?.status !== 'success') {
      console.error('Payment verification failed for reference:', reference);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // 2. Load deal
    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data()!;

    // If perfectly processed by webhook already, just return success
    if (deal.status !== 'pending_payment') {
      return NextResponse.json({ message: 'Deal already processed' }, { status: 200 });
    }

    // 3. Lock escrow on blockchain (symbolic amount for mock integration)
    let escrowTxHash = '';
    try {
      const symbolicBnb = (deal.amountGHS / 10000).toFixed(18);
      const amountWei = ethers.parseEther(symbolicBnb);

      const vendorSnap = await adminDb.collection('vendors').doc(deal.vendorId).get();
      const vendorWallet = vendorSnap.exists && vendorSnap.data()?.walletAddress
        ? vendorSnap.data()!.walletAddress
        : process.env.ESCROW_VENDOR_FALLBACK_ADDRESS || '0x0000000000000000000000000000000000000001';

      escrowTxHash = await lockEscrow(dealId, vendorWallet, amountWei);
      console.log('Client-side trigger: Escrow locked on-chain with tx:', escrowTxHash);
    } catch (escrowErr) {
      console.error('Blockchain escrow lock failed from client trigger:', escrowErr);
    }

    // 4. Update deal state
    await dealRef.update({
      status: 'in_escrow',
      buyerName: buyerName || '',
      buyerPhone: buyerPhone || '',
      buyerEmail: buyerEmail || '',
      paystackReference: reference,
      escrowTxHash,
      updatedAt: new Date().toISOString(),
    });

    // 5. Send transaction emails
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

    return NextResponse.json({ 
      message: 'Payment verified and escrow locked', 
      escrowTxHash,
      confirmationToken: deal.confirmationToken,
    }, { status: 200 });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
