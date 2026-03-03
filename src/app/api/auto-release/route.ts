import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { releaseEscrow } from '@/lib/escrow';
import { createTransferRecipient, initiateTransfer, MOMO_BANK_CODES } from '@/lib/paystack';
import { v4 as uuidv4 } from 'uuid';

const CRON_SECRET = process.env.CRON_SECRET || '';
const AUTO_RELEASE_HOURS = 72;

/**
 * GET /api/auto-release
 * 
 * Checks for deals that have been in escrow for more than 72 hours
 * without a dispute and automatically releases funds to the vendor.
 * 
 * Intended to be called by Vercel Cron or an external scheduler.
 * Protected by a CRON_SECRET header to prevent unauthorized access.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all deals in escrow
    const snapshot = await adminDb
      .collection('deals')
      .where('status', '==', 'in_escrow')
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No deals in escrow', released: 0 });
    }

    const now = Date.now();
    const results: Array<{ dealId: string; status: string; error?: string }> = [];

    for (const doc of snapshot.docs) {
      const deal = doc.data();
      const createdAt = new Date(deal.createdAt).getTime();
      const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

      // Only auto-release if 72+ hours have passed
      if (hoursElapsed < AUTO_RELEASE_HOURS) {
        continue;
      }

      const dealRef = adminDb.collection('deals').doc(deal.id);

      try {
        // Release escrow on blockchain
        let releaseTxHash = '';
        try {
          releaseTxHash = await releaseEscrow(deal.id);
          console.log(`Auto-release: escrow released for deal ${deal.id}, tx: ${releaseTxHash}`);
        } catch (err) {
          console.error(`Auto-release: blockchain release failed for deal ${deal.id}:`, err);
          // Continue anyway — mark as completed in Firestore
        }

        // Update deal status
        await dealRef.update({
          status: 'completed',
          releaseTxHash,
          updatedAt: new Date().toISOString(),
          autoReleased: true,
        });

        // Update vendor stats
        const vendorRef = adminDb.collection('vendors').doc(deal.vendorId);
        const vendorSnap = await vendorRef.get();

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

          // Attempt MoMo payout
          if (vendor.momoNumber && vendor.momoProvider) {
            try {
              const bankCode = MOMO_BANK_CODES[vendor.momoProvider];
              if (bankCode) {
                const recipientRes = await createTransferRecipient({
                  name: vendor.displayName || 'Vendor',
                  account_number: vendor.momoNumber,
                  bank_code: bankCode,
                  currency: 'GHS',
                });

                if (recipientRes.status && recipientRes.data?.recipient_code) {
                  const transferRef = `auto-payout-${deal.id}-${uuidv4().slice(0, 8)}`;
                  await initiateTransfer({
                    amount: Math.round(deal.vendorPayout * 100),
                    recipient: recipientRes.data.recipient_code,
                    reason: `SafeTrade auto-payout for: ${deal.itemName}`,
                    reference: transferRef,
                  });

                  await dealRef.update({
                    payoutReference: transferRef,
                    payoutStatus: 'initiated',
                  });
                }
              }
            } catch (payoutErr) {
              console.error(`Auto-release: MoMo payout failed for deal ${deal.id}:`, payoutErr);
              await dealRef.update({
                payoutStatus: 'failed',
                payoutError: payoutErr instanceof Error ? payoutErr.message : String(payoutErr),
              });
            }
          }
        }

        results.push({ dealId: deal.id, status: 'released' });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Auto-release failed for deal ${deal.id}:`, errorMsg);
        results.push({ dealId: deal.id, status: 'failed', error: errorMsg });
      }
    }

    return NextResponse.json({
      message: `Auto-release complete`,
      released: results.filter((r) => r.status === 'released').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    });
  } catch (error) {
    console.error('Auto-release error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
