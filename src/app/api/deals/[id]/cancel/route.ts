import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;

    if (!dealId) {
      return NextResponse.json({ error: 'Missing deal ID' }, { status: 400 });
    }

    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data();

    if (deal?.vendorId !== uid) {
      return NextResponse.json({ error: 'Unauthorized to cancel this deal' }, { status: 403 });
    }

    if (deal?.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Only pending deals can be cancelled' }, { status: 400 });
    }

    await dealRef.update({
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Deal cancelled successfully' });
  } catch (error) {
    console.error('Cancel Deal Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
