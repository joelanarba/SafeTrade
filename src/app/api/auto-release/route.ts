import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { releaseEscrow } from '@/lib/escrow';
import { createTransferRecipient, initiateTransfer, MOMO_BANK_CODES } from '@/lib/paystack';
import { sendAutoReleaseReminder } from '@/lib/sms';
import { v4 as uuidv4 } from 'uuid';

const CRON_SECRET = process.env.CRON_SECRET || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * GET /api/auto-release
 * 
 * Smart Release Protection:
 * - Auto-release fires at: shippedAt + estimatedDeliveryHours + 48 hours
 * - If vendor never marks as shipped, auto-release never fires
 * - If buyer raises a dispute, auto-release does not fire
 * - Sends 6-hour pre-release reminder SMS/email
 * - Backward compat: deals without estimatedDeliveryHours default to 72hrs
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
      return NextResponse.json({ message: 'No deals in escrow', released: 0, reminded: 0 });
    }

    const now = Date.now();
    const results: Array<{ dealId: string; status: string; error?: string }> = [];
    let reminded = 0;

    for (const doc of snapshot.docs) {
      const deal = doc.data();
      const dealRef = adminDb.collection('deals').doc(deal.id);

      // RULE: If deal is disputed, skip entirely
      if (deal.status === 'disputed') {
        continue;
      }

      // RULE: If vendor has not marked as shipped, skip (funds stay locked)
      if (!deal.shippedAt) {
        continue;
      }

      // Calculate auto-release time
      const shippedAt = new Date(deal.shippedAt).getTime();
      const estimatedHours = deal.estimatedDeliveryHours || 72;
      const bufferHours = 48;
      const autoReleaseTime = shippedAt + (estimatedHours + bufferHours) * 60 * 60 * 1000;
      const hoursUntilRelease = (autoReleaseTime - now) / (1000 * 60 * 60);

      // Send 6-hour reminder if not sent yet
      if (hoursUntilRelease > 0 && hoursUntilRelease <= 6 && !deal.reminderSent) {
        try {
          if (deal.buyerPhone) {
            const confirmLink = `${APP_URL}/confirm/${deal.confirmationToken}`;
            await sendAutoReleaseReminder(deal.buyerPhone, confirmLink, Math.ceil(hoursUntilRelease));
          }
          await dealRef.update({ reminderSent: true });
          reminded++;
          console.log(`[REMINDER] Sent 6hr reminder for deal ${deal.id}`);
        } catch (reminderErr) {
          console.error(`[REMINDER] Failed for deal ${deal.id}:`, reminderErr);
        }
      }

      // Only auto-release if time has passed
      if (now < autoReleaseTime) {
        continue;
      }

      try {
        // Release escrow on blockchain
        let releaseTxHash = '';
        try {
          releaseTxHash = await releaseEscrow(deal.id);
          console.log(`Auto-release: escrow released for deal ${deal.id}, tx: ${releaseTxHash}`);
        } catch (err) {
          console.error(`Auto-release: blockchain release failed for deal ${deal.id}:`, err);
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

        // Update buyer stats
        if (deal.buyerPhone) {
          try {
            const buyerRef = adminDb.collection('buyers').doc(deal.buyerPhone);
            const buyerSnap = await buyerRef.get();
            if (buyerSnap.exists) {
              await buyerRef.update({
                totalPurchases: (buyerSnap.data()!.totalPurchases || 0) + 1,
                lastSeen: new Date().toISOString(),
              });
            }
          } catch (buyerErr) {
            console.error(`Auto-release: buyer update failed for ${deal.buyerPhone}:`, buyerErr);
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
      reminded,
      results,
    });
  } catch (error) {
    console.error('Auto-release error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
