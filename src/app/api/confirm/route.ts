import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { releaseEscrow } from '@/lib/escrow';
import { createTransferRecipient, initiateTransfer, MOMO_BANK_CODES } from '@/lib/paystack';
import { v4 as uuidv4 } from 'uuid';

// POST: Buyer confirms receipt — triggers fund release + MoMo payout
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealId, confirmationToken } = body;

    if (!dealId || !confirmationToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find deal and verify token
    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data()!;

    if (deal.confirmationToken !== confirmationToken) {
      return NextResponse.json({ error: 'Invalid confirmation token' }, { status: 403 });
    }

    if (deal.status !== 'in_escrow') {
      return NextResponse.json({ error: 'Deal is not in escrow' }, { status: 400 });
    }

    // Release escrow on blockchain
    let releaseTxHash = '';
    try {
      releaseTxHash = await releaseEscrow(dealId);
      console.log('Escrow released with tx:', releaseTxHash);
    } catch (err) {
      console.error('Release failed:', err);
      return NextResponse.json({ error: 'Blockchain release failed' }, { status: 500 });
    }

    // Update deal status
    await dealRef.update({
      status: 'completed',
      releaseTxHash,
      updatedAt: new Date().toISOString(),
    });

    // Update vendor stats
    const vendorRef = adminDb.collection('vendors').doc(deal.vendorId);
    const vendorSnap = await vendorRef.get();

    let payoutStatus = 'skipped';
    let payoutError = '';

    if (vendorSnap.exists) {
      const vendor = vendorSnap.data()!;
      const newSuccessful = (vendor.successfulTrades || 0) + 1;
      const newTotal = (vendor.totalTrades || 0) + 1;
      const newTrustScore = Math.round((newSuccessful / newTotal) * 5 * 100) / 100;

      await vendorRef.update({
        successfulTrades: newSuccessful,
        totalTrades: newTotal,
        trustScore: newTrustScore,
        verified: newSuccessful >= 10,
      });

      // P1-5: Initiate MoMo payout to vendor
      if (vendor.momoNumber && vendor.momoProvider) {
        try {
          const bankCode = MOMO_BANK_CODES[vendor.momoProvider];
          if (!bankCode) {
            throw new Error(`Unknown MoMo provider: ${vendor.momoProvider}`);
          }

          // Step 1: Create transfer recipient
          const recipientRes = await createTransferRecipient({
            name: vendor.displayName || 'Vendor',
            account_number: vendor.momoNumber,
            bank_code: bankCode,
            currency: 'GHS',
          });

          if (!recipientRes.status || !recipientRes.data?.recipient_code) {
            throw new Error(
              `Failed to create transfer recipient: ${recipientRes.message || JSON.stringify(recipientRes)}`
            );
          }

          const recipientCode = recipientRes.data.recipient_code;

          // Step 2: Initiate transfer (vendorPayout in pesewas)
          const transferRef = `payout-${dealId}-${uuidv4().slice(0, 8)}`;
          const payoutAmountPesewas = Math.round(deal.vendorPayout * 100);

          const transferRes = await initiateTransfer({
            amount: payoutAmountPesewas,
            recipient: recipientCode,
            reason: `SafeTrade payout for: ${deal.itemName}`,
            reference: transferRef,
          });

          if (!transferRes.status) {
            throw new Error(
              `Transfer failed: ${transferRes.message || JSON.stringify(transferRes)}`
            );
          }

          payoutStatus = 'initiated';
          console.log(
            `MoMo payout initiated: GHS ${deal.vendorPayout} to ${vendor.momoNumber} (${vendor.momoProvider}), ref: ${transferRef}`
          );

          // Save payout reference on the deal
          await dealRef.update({
            payoutReference: transferRef,
            payoutStatus: 'initiated',
          });
        } catch (payoutErr) {
          payoutError = payoutErr instanceof Error ? payoutErr.message : String(payoutErr);
          payoutStatus = 'failed';
          console.error('MoMo payout failed (non-blocking):', payoutErr);

          // Save the failure so admin can retry
          await dealRef.update({
            payoutStatus: 'failed',
            payoutError,
          });
        }
      } else {
        payoutStatus = 'skipped_no_momo';
        console.log(`Vendor ${deal.vendorId} has no MoMo configured — payout skipped`);
      }
    }

    return NextResponse.json({
      message: 'Delivery confirmed, funds released',
      releaseTxHash,
      payoutStatus,
      ...(payoutError ? { payoutError } : {}),
    });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
