import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { releaseEscrow } from '@/lib/escrow';

// POST: Buyer confirms receipt — triggers fund release
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
      // releaseTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
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
    }

    // TODO: Initiate Paystack transfer to vendor's MoMo number
    // This would use createTransferRecipient + initiateTransfer from paystack.ts

    return NextResponse.json({ message: 'Delivery confirmed, funds released', releaseTxHash });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
