import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data();

    if (deal?.vendorId !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!['pending_payment', 'cancelled'].includes(deal?.status)) {
      return NextResponse.json({ error: 'Only pending or cancelled deals can be deleted' }, { status: 400 });
    }

    await dealRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Deal Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { itemName, description, price } = await req.json();

    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data();

    if (deal?.vendorId !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (deal?.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Only pending deals can be edited' }, { status: 400 });
    }

    const amountGHS = parseFloat(price);
    if (isNaN(amountGHS) || amountGHS <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const platformFee = Math.round(amountGHS * 0.02 * 100) / 100;
    const vendorPayout = Math.round((amountGHS - platformFee) * 100) / 100;

    await dealRef.update({
      itemName: itemName || deal.itemName,
      description: description ?? deal.description,
      amountGHS,
      platformFee,
      vendorPayout,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Edit Deal Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
