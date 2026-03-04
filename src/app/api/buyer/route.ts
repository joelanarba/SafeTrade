import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Use Admin SDK to bypass client-side rules and fetch buyer details directly
    const buyerDoc = await adminDb.collection('buyers').doc(phone).get();
    let buyer = null;
    if (buyerDoc.exists) {
      buyer = { ...buyerDoc.data(), phone };
    }

    // Fetch buyer deals
    const dealsSnap = await adminDb.collection('deals')
      .where('buyerPhone', '==', phone)
      .orderBy('createdAt', 'desc')
      .get();
      
    const deals = dealsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ buyer, deals });

  } catch (error) {
    console.error('Buyer API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
