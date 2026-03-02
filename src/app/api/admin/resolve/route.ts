import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { releaseEscrow, refundEscrow } from '@/lib/escrow';

// POST: Admin resolves a dispute — release or refund
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealId, action } = body;

    if (!dealId || !['release', 'refund'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data()!;

    if (deal.status !== 'disputed') {
      return NextResponse.json({ error: 'Deal is not in dispute' }, { status: 400 });
    }

    let txHash = '';

    if (action === 'release') {
      // Release funds to vendor
      try {
        txHash = await releaseEscrow(dealId);
        // txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      } catch (err) {
        console.error('Release failed:', err);
      }

      await dealRef.update({
        status: 'completed',
        releaseTxHash: txHash,
        updatedAt: new Date().toISOString(),
      });

      // Update vendor stats (successful)
      const vendorRef = adminDb.collection('vendors').doc(deal.vendorId);
      const vendorSnap = await vendorRef.get();
      if (vendorSnap.exists) {
        const vendor = vendorSnap.data()!;
        const newSuccessful = (vendor.successfulTrades || 0) + 1;
        await vendorRef.update({
          successfulTrades: newSuccessful,
          trustScore: Math.round((newSuccessful / (vendor.totalTrades || 1)) * 5 * 100) / 100,
          verified: newSuccessful >= 10,
        });
      }
    } else {
      // Refund buyer
      try {
        txHash = await refundEscrow(dealId);
        // txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      } catch (err) {
        console.error('Refund failed:', err);
      }

      await dealRef.update({
        status: 'refunded',
        releaseTxHash: txHash,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: `Deal ${action === 'release' ? 'released' : 'refunded'}`,
      txHash,
    });
  } catch (error) {
    console.error('Admin resolve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
