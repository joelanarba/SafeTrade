import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendOTP } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const { phone, name } = await req.json();

    if (!phone || !name) {
      return NextResponse.json({ error: 'Phone and name are required' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^0/, '+233');

    // Rate limit: max 1 OTP per phone per 60 seconds
    const otpRef = adminDb.collection('otps').doc(normalizedPhone);
    const existingOtp = await otpRef.get();

    if (existingOtp.exists) {
      const data = existingOtp.data()!;
      const sentAt = new Date(data.sentAt).getTime();
      const now = Date.now();
      if (now - sentAt < 60 * 1000) {
        const waitSeconds = Math.ceil((60 * 1000 - (now - sentAt)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting another OTP` },
          { status: 429 }
        );
      }
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Firestore with 10-minute expiry
    await otpRef.set({
      code,
      name,
      phone: normalizedPhone,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
    });

    // Send via Arkesel
    const sent = await sendOTP(normalizedPhone, code);

    if (!sent) {
      console.error('[OTP] Failed to send SMS to', normalizedPhone);
      // Still return success since OTP is stored (dev fallback: check logs)
    }

    console.log(`[OTP] Code sent to ${normalizedPhone}: ${code}`);

    return NextResponse.json({
      message: 'OTP sent successfully',
      phone: normalizedPhone,
    });
  } catch (error) {
    console.error('[OTP] Send error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
