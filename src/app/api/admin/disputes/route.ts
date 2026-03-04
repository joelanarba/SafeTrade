import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden', adminEmails: ADMIN_EMAILS, userEmail: decodedToken.email }, { status: 403 });
    }

    // Fetch disputed deals using Admin SDK (bypasses security rules)
    // Using only where() without orderBy() to avoid composite index requirement
    const db = getAdminDb();
    const snapshot = await db
      .collection('deals')
      .where('status', '==', 'disputed')
      .get();

    const disputes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort in memory instead of requiring a Firestore composite index
    disputes.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error('Admin disputes error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}
