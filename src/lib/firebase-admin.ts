import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

function getAdminApp(): App {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      try {
        let cleanKey = serviceAccount;
        if (cleanKey.startsWith("'") && cleanKey.endsWith("'")) {
          cleanKey = cleanKey.slice(1, -1);
        }
        const parsedKey = JSON.parse(cleanKey);
        
        // Vercel often escapes newlines in env vars, which breaks the PEM format
        if (parsedKey.private_key) {
          parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, '\n');
        }

        return initializeApp({
          credential: cert(parsedKey),
        });
      } catch (error) {
        console.error('Firebase Admin init error (JSON parse failed):', error);
        return initializeApp(); // Fallback to ADC
      }
    } else {
      return initializeApp();
    }
  }
  return getApps()[0];
}

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    _adminDb = getFirestore(getAdminApp());
  }
  return _adminDb;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(getAdminApp());
  }
  return _adminAuth;
}

// Convenience aliases — lazily initialized
export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getAdminDb() as any)[prop];
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getAdminAuth() as any)[prop];
  },
});
