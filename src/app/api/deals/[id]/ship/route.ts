import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;

    // Verify vendor auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Load deal
    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data()!;

    // Verify ownership
    if (deal.vendorId !== uid) {
      return NextResponse.json({ error: 'Not your deal' }, { status: 403 });
    }

    // Only in_escrow deals can be marked as shipped
    if (deal.status !== 'in_escrow') {
      return NextResponse.json({ error: 'Deal is not in escrow' }, { status: 400 });
    }

    // Already shipped
    if (deal.shippedAt) {
      return NextResponse.json({ error: 'Already marked as shipped' }, { status: 400 });
    }

    const now = new Date();
    const estimatedHours = deal.estimatedDeliveryHours || 72;
    const autoReleaseAt = new Date(now.getTime() + (estimatedHours + 48) * 60 * 60 * 1000);

    await dealRef.update({
      shippedAt: now.toISOString(),
      autoReleaseAt: autoReleaseAt.toISOString(),
      updatedAt: now.toISOString(),
    });

    return NextResponse.json({
      message: 'Order marked as shipped',
      shippedAt: now.toISOString(),
      autoReleaseAt: autoReleaseAt.toISOString(),
    });
  } catch (error) {
    console.error('Ship error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
