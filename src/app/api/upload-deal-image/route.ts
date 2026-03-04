import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';
import { getAdminDb } from '@/lib/firebase-admin';

const BUCKET_NAME = 'safetrade-africa.firebasestorage.app';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Trigger admin app initialization
    getAdminDb();

    const bucket = getStorage().bucket(BUCKET_NAME);

    const fileName = `deal-images/${Date.now()}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const downloadToken = uuidv4();

    const fileRef = bucket.file(fileName);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Deal image upload error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
