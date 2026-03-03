import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendDisputeAlert } from '@/lib/email';

// POST: Buyer raises a dispute
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealId, confirmationToken, reason, photoUrl, category, photoUrls, details } = body;

    if (!dealId || !confirmationToken || (!reason && !details)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify deal and token
    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data()!;

    if (deal.confirmationToken !== confirmationToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    if (deal.status !== 'in_escrow') {
      return NextResponse.json({ error: 'Deal is not in escrow' }, { status: 400 });
    }

    // Check 72-hour window
    const createdAt = new Date(deal.createdAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed > 72) {
      return NextResponse.json({ error: 'Dispute window has expired (72 hours)' }, { status: 400 });
    }

    // Build full reason text
    const fullReason = category 
      ? `[${category}] ${details || reason || ''}`.trim()
      : reason || details || '';

    // Update deal with dispute info
    await dealRef.update({
      status: 'disputed',
      disputeReason: fullReason,
      disputePhoto: photoUrl || (photoUrls && photoUrls.length > 0 ? photoUrls[0] : ''),
      disputeCategory: category || '',
      disputePhotos: photoUrls || (photoUrl ? [photoUrl] : []),
      updatedAt: new Date().toISOString(),
    });

    // Update vendor dispute count
    const vendorRef = adminDb.collection('vendors').doc(deal.vendorId);
    const vendorSnap = await vendorRef.get();

    if (vendorSnap.exists) {
      const vendor = vendorSnap.data()!;
      await vendorRef.update({
        disputes: (vendor.disputes || 0) + 1,
        totalTrades: (vendor.totalTrades || 0) + 1,
        trustScore: Math.round(
          ((vendor.successfulTrades || 0) / ((vendor.totalTrades || 0) + 1)) * 5 * 100
        ) / 100,
      });
    }

    // Send dispute alerts
    try {
      // Alert vendor
      const vendorSnap2 = await adminDb.collection('vendors').doc(deal.vendorId).get();
      if (vendorSnap2.exists) {
        const vendor = vendorSnap2.data()!;
        if (vendor.email) {
          await sendDisputeAlert(vendor.email, vendor.displayName, deal.itemName, reason, true);
        }
      }

      // Alert buyer
      if (deal.buyerEmail) {
        await sendDisputeAlert(deal.buyerEmail, deal.buyerName, deal.itemName, reason, false);
      }
    } catch (emailErr) {
      console.error('Email error (non-critical):', emailErr);
    }

    return NextResponse.json({ message: 'Dispute submitted' });
  } catch (error) {
    console.error('Dispute error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
