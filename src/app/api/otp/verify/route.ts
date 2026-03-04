import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^0/, '+233');

    const otpRef = adminDb.collection('otps').doc(normalizedPhone);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 404 });
    }

    const data = otpSnap.data()!;

    // Check expiry
    const expiresAt = new Date(data.expiresAt).getTime();
    if (Date.now() > expiresAt) {
      await otpRef.delete();
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 410 });
    }

    // Check max attempts (5)
    if (data.attempts >= 5) {
      await otpRef.delete();
      return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 429 });
    }

    // Verify code
    if (data.code !== otp.trim()) {
      await otpRef.update({ attempts: (data.attempts || 0) + 1 });
      const remaining = 5 - (data.attempts + 1);
      return NextResponse.json(
        { error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 400 }
      );
    }

    // OTP is valid — delete it and return success
    await otpRef.delete();

    return NextResponse.json({
      verified: true,
      phone: normalizedPhone,
      name: data.name,
    });
  } catch (error) {
    console.error('[OTP] Verify error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
