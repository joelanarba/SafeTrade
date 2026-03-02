import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// POST: Create a new deal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendorId, vendorName, vendorPhone, itemName, description, amountGHS } = body;

    if (!vendorId || !itemName || !amountGHS) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dealId = uuidv4();
    const confirmationToken = uuidv4();
    const platformFee = Math.round(amountGHS * 0.02 * 100) / 100;
    const vendorPayout = Math.round((amountGHS - platformFee) * 100) / 100;

    const deal = {
      id: dealId,
      vendorId,
      vendorName: vendorName || 'Vendor',
      vendorPhone: vendorPhone || '',
      itemName,
      description: description || '',
      amountGHS: Number(amountGHS),
      platformFee,
      vendorPayout,
      buyerName: '',
      buyerPhone: '',
      buyerEmail: '',
      status: 'pending_payment',
      paystackReference: '',
      escrowTxHash: '',
      releaseTxHash: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      disputeReason: '',
      disputePhoto: '',
      confirmationToken,
    };

    await adminDb.collection('deals').doc(dealId).set(deal);

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: List vendor deals
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection('deals')
      .where('vendorId', '==', vendorId)
      .orderBy('createdAt', 'desc')
      .get();

    const deals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
