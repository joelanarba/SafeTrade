import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';
import { getAdminDb } from '@/lib/firebase-admin';

// The bucket name for Firebase Storage in GCS format
// Firebase projects use either .appspot.com or .firebasestorage.app
const BUCKET_NAME = 'safetrade-africa.firebasestorage.app';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const dealId = formData.get('dealId') as string | null;

    if (!file || !dealId) {
      return NextResponse.json({ error: 'Missing file or dealId' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Trigger admin app initialization via existing firebase-admin.ts
    getAdminDb();

    // Now get storage from the already-initialized admin app, with explicit bucket name
    const bucket = getStorage().bucket(BUCKET_NAME);

    const fileName = `disputes/${dealId}_${Date.now()}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Generate a secure download token
    const downloadToken = uuidv4();

    const fileRef = bucket.file(fileName);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        }
      },
    });

    // Format the URL the same way Firebase client SDK does
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
