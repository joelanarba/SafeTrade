import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { releaseEscrow, refundEscrow } from '@/lib/escrow';

// Admin email whitelist — add your admin emails here
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Verify that the request comes from an authenticated admin user.
 * Checks the Authorization header for a Firebase ID token and
 * validates the user's email against the admin whitelist.
 */
async function verifyAdmin(req: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing authorization token' };
  }

  const idToken = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase() || '';

    if (ADMIN_EMAILS.length === 0) {
      // If no admin emails are configured, deny all access for safety
      console.error('ADMIN_EMAILS env variable not configured — denying admin access');
      return { authorized: false, error: 'Admin access not configured' };
    }

    if (!ADMIN_EMAILS.includes(email)) {
      console.warn(`Unauthorized admin access attempt by: ${email}`);
      return { authorized: false, error: 'Insufficient permissions' };
    }

    return { authorized: true };
  } catch (err) {
    console.error('Token verification failed:', err);
    return { authorized: false, error: 'Invalid authorization token' };
  }
}

// POST: Admin resolves a dispute — release or refund
export async function POST(req: NextRequest) {
  try {
    // P0-4: Verify admin access
    const { authorized, error: authError } = await verifyAdmin(req);
    if (!authorized) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { dealId, action } = body;

    if (!dealId || !['release', 'refund'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data()!;

    if (deal.status !== 'disputed') {
      return NextResponse.json({ error: 'Deal is not in dispute' }, { status: 400 });
    }

    let txHash = '';

    if (action === 'release') {
      // Release funds to vendor
      try {
        txHash = await releaseEscrow(dealId);
      } catch (err) {
        console.error('Release failed:', err);
      }

      await dealRef.update({
        status: 'completed',
        releaseTxHash: txHash,
        updatedAt: new Date().toISOString(),
      });

      // Update vendor stats (successful)
      const vendorRef = adminDb.collection('vendors').doc(deal.vendorId);
      const vendorSnap = await vendorRef.get();
      if (vendorSnap.exists) {
        const vendor = vendorSnap.data()!;
        const newSuccessful = (vendor.successfulTrades || 0) + 1;
        await vendorRef.update({
          successfulTrades: newSuccessful,
          trustScore: Math.round((newSuccessful / (vendor.totalTrades || 1)) * 5 * 100) / 100,
          verified: newSuccessful >= 10,
        });
      }
    } else {
      // Refund buyer
      try {
        txHash = await refundEscrow(dealId);
      } catch (err) {
        console.error('Refund failed:', err);
      }

      await dealRef.update({
        status: 'refunded',
        releaseTxHash: txHash,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: `Deal ${action === 'release' ? 'released' : 'refunded'}`,
      txHash,
    });
  } catch (error) {
    console.error('Admin resolve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
