import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

// Ensure admin app is initialized
function getAdminApp() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      try {
        let cleanKey = serviceAccount;
        if (cleanKey.startsWith("'") && cleanKey.endsWith("'")) {
          cleanKey = cleanKey.slice(1, -1);
        }
        const parsedKey = JSON.parse(cleanKey);
        if (parsedKey.private_key) {
          parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, '\n');
        }
        return initializeApp({
          credential: cert(parsedKey),
          storageBucket: 'safetrade-africa.firebasestorage.app',
        });
      } catch {
        return initializeApp({ storageBucket: 'safetrade-africa.firebasestorage.app' });
      }
    } else {
      return initializeApp({ storageBucket: 'safetrade-africa.firebasestorage.app' });
    }
  }
  return getApps()[0];
}

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

    const app = getAdminApp();
    const bucket = getStorage(app).bucket();

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

    // Format the URL the exact same way Firebase client SDK does
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' }, 
      { status: 500 }
    );
  }
}

