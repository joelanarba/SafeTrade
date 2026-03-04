import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Deal, Vendor, DeliveryMethod, Buyer } from './types';
import { v4 as uuidv4 } from 'uuid';

// ===== Deal Operations =====

export async function createDeal(
  vendorId: string,
  vendorName: string,
  vendorPhone: string,
  itemName: string,
  description: string,
  amountGHS: number,
  deliveryMethod?: DeliveryMethod,
  trackingNumber?: string,
  estimatedDeliveryHours?: number,
  itemImage?: string
): Promise<Deal> {
  const dealId = uuidv4();
  const confirmationToken = uuidv4();
  const platformFee = Math.round(amountGHS * 0.02 * 100) / 100; // 2% fee
  const vendorPayout = Math.round((amountGHS - platformFee) * 100) / 100;

  const deal: Deal = {
    id: dealId,
    vendorId,
    vendorName,
    vendorPhone,
    itemName,
    description,
    amountGHS,
    platformFee,
    vendorPayout,
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    status: 'pending_payment',
    paystackReference: '',
    escrowTxHash: '',
    releaseTxHash: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    disputeReason: '',
    disputePhoto: '',
    confirmationToken,
    deliveryMethod: deliveryMethod || 'personal',
    trackingNumber: trackingNumber || '',
    estimatedDeliveryHours: estimatedDeliveryHours || 72,
    itemImage: itemImage || '',
  };

  await setDoc(doc(db, 'deals', dealId), deal);
  return deal;
}

export async function getDeal(dealId: string): Promise<Deal | null> {
  const docSnap = await getDoc(doc(db, 'deals', dealId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Deal;
}

export async function getDealByConfirmationToken(token: string): Promise<Deal | null> {
  const q = query(collection(db, 'deals'), where('confirmationToken', '==', token), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as Deal;
}

export async function updateDeal(dealId: string, data: Partial<Deal>): Promise<void> {
  await updateDoc(doc(db, 'deals', dealId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getVendorDeals(vendorId: string): Promise<Deal[]> {
  const q = query(
    collection(db, 'deals'),
    where('vendorId', '==', vendorId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Deal));
}

export async function getTotalDealsCount(): Promise<number> {
  const coll = collection(db, 'deals');
  const snapshot = await getCountFromServer(coll);
  return snapshot.data().count;
}

// ===== Buyer Operations =====

export async function getOrCreateBuyer(phone: string, name: string): Promise<Buyer> {
  const buyerRef = doc(db, 'buyers', phone);
  const buyerSnap = await getDoc(buyerRef);

  if (buyerSnap.exists()) {
    // Update lastSeen and name
    await updateDoc(buyerRef, {
      name,
      lastSeen: new Date().toISOString(),
    });
    return { ...buyerSnap.data(), phone } as Buyer;
  }

  const buyer: Buyer = {
    phone,
    name,
    totalPurchases: 0,
    disputes: 0,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };

  await setDoc(buyerRef, buyer);
  return buyer;
}

export async function getBuyer(phone: string): Promise<Buyer | null> {
  const buyerSnap = await getDoc(doc(db, 'buyers', phone));
  if (!buyerSnap.exists()) return null;
  return { ...buyerSnap.data(), phone } as Buyer;
}

export async function getBuyerDeals(phone: string): Promise<Deal[]> {
  const q = query(
    collection(db, 'deals'),
    where('buyerPhone', '==', phone),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Deal));
}

// ===== Vendor Operations =====

export async function getVendor(vendorId: string): Promise<Vendor | null> {
  const docSnap = await getDoc(doc(db, 'vendors', vendorId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Vendor;
}

export async function createVendor(
  vendorId: string,
  displayName: string,
  email: string,
  photoURL: string
): Promise<Vendor> {
  const vendor: Vendor = {
    id: vendorId,
    displayName,
    email,
    phone: '',
    momoNumber: '',
    momoProvider: 'MTN',
    trustScore: 0,
    totalTrades: 0,
    successfulTrades: 0,
    disputes: 0,
    createdAt: new Date().toISOString(),
    verified: false,
    photoURL: photoURL || '',
  };

  await setDoc(doc(db, 'vendors', vendorId), vendor, { merge: true });
  return vendor;
}

export async function updateVendor(vendorId: string, data: Partial<Vendor>): Promise<void> {
  await updateDoc(doc(db, 'vendors', vendorId), data);
}

export async function getVendorTransactionHistory(vendorId: string, count = 10): Promise<Deal[]> {
  const q = query(
    collection(db, 'deals'),
    where('vendorId', '==', vendorId),
    where('status', 'in', ['completed', 'refunded', 'disputed']),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Deal));
}

// ===== Admin Operations =====

export async function getDisputedDeals(): Promise<Deal[]> {
  const q = query(
    collection(db, 'deals'),
    where('status', '==', 'disputed'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Deal));
}

