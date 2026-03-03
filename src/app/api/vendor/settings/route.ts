import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

// POST: Update vendor profile (MoMo details, display name, etc.)
export async function POST(req: NextRequest) {
  try {
    // Verify Firebase auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { momoNumber, momoProvider, phone, displayName } = body;

    // Validate MoMo provider
    const validProviders = ['MTN', 'Vodafone', 'AirtelTigo'];
    if (momoProvider && !validProviders.includes(momoProvider)) {
      return NextResponse.json({ error: 'Invalid MoMo provider' }, { status: 400 });
    }

    // Validate MoMo number format (Ghana: 10 digits starting with 0)
    if (momoNumber && !/^0\d{9}$/.test(momoNumber)) {
      return NextResponse.json(
        { error: 'Invalid MoMo number. Must be 10 digits starting with 0 (e.g., 0241234567)' },
        { status: 400 }
      );
    }

    // Build update object — only include provided fields
    const updateData: Record<string, string> = {};
    if (momoNumber !== undefined) updateData.momoNumber = momoNumber;
    if (momoProvider !== undefined) updateData.momoProvider = momoProvider;
    if (phone !== undefined) updateData.phone = phone;
    if (displayName !== undefined) updateData.displayName = displayName;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const vendorRef = adminDb.collection('vendors').doc(uid);
    const vendorSnap = await vendorRef.get();

    if (!vendorSnap.exists) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    await vendorRef.update(updateData);

    return NextResponse.json({
      message: 'Profile updated',
      updated: Object.keys(updateData),
    });
  } catch (error) {
    console.error('Vendor settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
