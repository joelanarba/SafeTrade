/**
 * SafeTrade Demo Data Seeder
 * 
 * Populates Firestore with realistic Ghanaian vendor profiles and transaction history
 * so the platform looks alive during hackathon demos.
 * 
 * Usage:
 *   node scripts/seed-demo-data.js
 * 
 * Requires: FIREBASE_SERVICE_ACCOUNT_KEY in .env.local
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { randomUUID } = require('crypto');
const path = require('path');

// ─── Load .env.local ───
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

// ─── Firebase Admin Init ───
function initAdmin() {
  let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
    process.exit(1);
  }
  // Strip surrounding single quotes if present
  if (serviceAccount.startsWith("'") && serviceAccount.endsWith("'")) {
    serviceAccount = serviceAccount.slice(1, -1);
  }
  const parsed = JSON.parse(serviceAccount);
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  const app = initializeApp({ credential: cert(parsed) });
  return getFirestore(app);
}

const db = initAdmin();

// ─── Realistic Ghanaian Demo Data ───

const VENDORS = [
  {
    id: 'vendor-sneakerplug-gh',
    displayName: 'SneakerPlugGH',
    email: 'sneakerplug@gmail.com',
    phone: '0241234567',
    momoNumber: '0241234567',
    momoProvider: 'MTN',
    trustScore: 4.9,
    totalTrades: 324,
    successfulTrades: 321,
    disputes: 3,
    verified: true,
    photoURL: '',
  },
  {
    id: 'vendor-accra-thrift',
    displayName: 'AccraThriftQueen',
    email: 'thriftqueen@gmail.com',
    phone: '0551234567',
    momoNumber: '0551234567',
    momoProvider: 'MTN',
    trustScore: 4.7,
    totalTrades: 189,
    successfulTrades: 185,
    disputes: 4,
    verified: true,
    photoURL: '',
  },
  {
    id: 'vendor-tech-deals',
    displayName: 'TechDealsGH',
    email: 'techdeals@gmail.com',
    phone: '0201234567',
    momoNumber: '0201234567',
    momoProvider: 'Vodafone',
    trustScore: 4.8,
    totalTrades: 256,
    successfulTrades: 253,
    disputes: 3,
    verified: true,
    photoURL: '',
  },
  {
    id: 'vendor-kumasi-kicks',
    displayName: 'KumasiKicks',
    email: 'kumasikicks@gmail.com',
    phone: '0271234567',
    momoNumber: '0271234567',
    momoProvider: 'AirtelTigo',
    trustScore: 4.6,
    totalTrades: 142,
    successfulTrades: 138,
    disputes: 4,
    verified: true,
    photoURL: '',
  },
  {
    id: 'vendor-glow-beauty',
    displayName: 'GlowBeautyGH',
    email: 'glowbeauty@gmail.com',
    phone: '0541234567',
    momoNumber: '0541234567',
    momoProvider: 'MTN',
    trustScore: 4.5,
    totalTrades: 97,
    successfulTrades: 94,
    disputes: 3,
    verified: false,
    photoURL: '',
  },
];

// Product catalog per vendor — typical items sold on Instagram/WhatsApp in Ghana
const PRODUCT_CATALOG = {
  'vendor-sneakerplug-gh': [
    { name: 'Nike Air Max 90', price: 850 },
    { name: 'Adidas Yeezy Boost 350', price: 1200 },
    { name: 'Jordan 4 Retro', price: 1500 },
    { name: 'New Balance 550', price: 650 },
    { name: 'Nike Dunk Low Panda', price: 700 },
    { name: 'Air Force 1 White', price: 500 },
    { name: 'Converse Chuck 70', price: 380 },
    { name: 'Puma Suede Classic', price: 420 },
  ],
  'vendor-accra-thrift': [
    { name: 'Vintage Denim Jacket', price: 180 },
    { name: 'Floral Summer Dress', price: 120 },
    { name: 'Retro Band T-Shirt', price: 80 },
    { name: 'High-Waist Mom Jeans', price: 150 },
    { name: 'Ankara Print Skirt', price: 200 },
    { name: 'Oversized Blazer', price: 250 },
    { name: 'Silk Blouse', price: 160 },
    { name: 'Cargo Pants', price: 140 },
  ],
  'vendor-tech-deals': [
    { name: 'iPhone 14 Pro (128GB)', price: 6500 },
    { name: 'Samsung Galaxy S24', price: 5800 },
    { name: 'AirPods Pro 2nd Gen', price: 1200 },
    { name: 'MacBook Air M2', price: 9500 },
    { name: 'iPad 10th Gen', price: 4200 },
    { name: 'JBL Flip 6 Speaker', price: 800 },
    { name: 'Sony WH-1000XM5', price: 2200 },
    { name: 'Apple Watch SE', price: 2800 },
  ],
  'vendor-kumasi-kicks': [
    { name: 'Nike Air Jordan 1 Mid', price: 900 },
    { name: 'Adidas Gazelle', price: 550 },
    { name: 'Reebok Classic Leather', price: 450 },
    { name: 'Nike Air Max 97', price: 780 },
    { name: 'Vans Old Skool', price: 350 },
    { name: 'ASICS Gel-Lyte III', price: 620 },
    { name: 'Timberland 6-Inch Boot', price: 1100 },
    { name: 'Crocs Classic Clog', price: 280 },
  ],
  'vendor-glow-beauty': [
    { name: 'The Ordinary Niacinamide Serum', price: 120 },
    { name: 'CeraVe Moisturizing Cream', price: 180 },
    { name: 'Fenty Beauty Foundation', price: 350 },
    { name: 'Shea Butter Body Lotion (500ml)', price: 85 },
    { name: 'MAC Lipstick — Ruby Woo', price: 250 },
    { name: 'Maybelline Mascara', price: 95 },
    { name: 'African Black Soap Set', price: 60 },
    { name: 'Hair Growth Oil Bundle', price: 150 },
  ],
};

// Ghanaian buyer names
const BUYER_NAMES = [
  'Kwame Asante', 'Ama Mensah', 'Kofi Boateng', 'Akosua Darko', 'Yaw Owusu',
  'Abena Osei', 'Kwesi Appiah', 'Efua Agyemang', 'Kojo Amoako', 'Adwoa Frimpong',
  'Nana Adu', 'Akua Sarpong', 'Fiifi Mensah', 'Esi Opoku', 'Paa Kwesi Nkrumah',
  'Maame Yaa Konadu', 'Kwabena Ofori', 'Adjoa Badu', 'Yaw Brefo', 'Afia Pokua',
  'Kwadwo Antwi', 'Serwaa Amihere', 'Nii Lante', 'Gifty Oware', 'Bright Addai',
  'Mercy Adom', 'Emmanuel Tetteh', 'Priscilla Acheampong', 'Samuel Mensah', 'Linda Boakye',
];

const BUYER_PHONES = [
  '0244000001', '0244000002', '0244000003', '0244000004', '0244000005',
  '0554000001', '0554000002', '0554000003', '0554000004', '0554000005',
  '0204000001', '0204000002', '0204000003', '0204000004', '0204000005',
  '0274000001', '0274000002', '0274000003', '0274000004', '0274000005',
  '0544000001', '0544000002', '0544000003', '0544000004', '0544000005',
  '0244000006', '0244000007', '0244000008', '0244000009', '0244000010',
];

// Helper — random date within the last N days
function randomDate(daysBack) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

// Helper — pick random from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper — fake tx hash
function fakeTxHash() {
  const hex = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) hash += hex[Math.floor(Math.random() * 16)];
  return hash;
}

// Helper — fake Paystack reference
function fakePaystackRef() {
  return 'PSK_' + randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
}

// ─── Generate Deals for a Single Vendor ───
function generateDeals(vendor) {
  const products = PRODUCT_CATALOG[vendor.id];
  const deals = [];

  // Generate transactions going back ~180 days
  // Mix of completed, delivered (recent), and a few disputed
  const totalToGenerate = vendor.totalTrades;

  for (let i = 0; i < totalToGenerate; i++) {
    const product = pick(products);
    const buyerIdx = Math.floor(Math.random() * BUYER_NAMES.length);
    const buyerName = BUYER_NAMES[buyerIdx];
    const buyerPhone = BUYER_PHONES[buyerIdx];
    const buyerEmail = buyerName.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';

    const createdAt = randomDate(180);
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);

    const amountGHS = product.price;
    const platformFee = Math.round(amountGHS * 0.02 * 100) / 100;
    const vendorPayout = Math.round((amountGHS - platformFee) * 100) / 100;

    // Decide status distribution:
    //   ~85% completed, ~8% delivered (recent), ~5% disputed, ~2% in_escrow (very recent)
    let status;
    const roll = Math.random();
    if (i < vendor.disputes) {
      status = 'disputed';
    } else if (roll < 0.02) {
      status = 'in_escrow';
    } else if (roll < 0.10) {
      status = 'delivered';
    } else {
      status = 'completed';
    }

    const dealId = randomUUID();
    const confirmationToken = randomUUID();

    deals.push({
      id: dealId,
      vendorId: vendor.id,
      vendorName: vendor.displayName,
      vendorPhone: vendor.phone,
      itemName: product.name,
      description: `${product.name} — authentic, brand new. DM for more details.`,
      amountGHS,
      platformFee,
      vendorPayout,
      buyerName,
      buyerPhone,
      buyerEmail,
      status,
      paystackReference: status !== 'in_escrow' ? fakePaystackRef() : '',
      escrowTxHash: status !== 'in_escrow' ? fakeTxHash() : '',
      releaseTxHash: status === 'completed' ? fakeTxHash() : '',
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      disputeReason: status === 'disputed' ? pick([
        'Item not as described — different color received',
        'Item was damaged during delivery',
        'Wrong size was sent',
        'Item appears to be counterfeit',
      ]) : '',
      disputePhoto: '',
      confirmationToken,
    });
  }

  return deals;
}

// ─── Main Seed Function ───
async function seed() {
  console.log('🌱 SafeTrade Demo Data Seeder');
  console.log('─'.repeat(50));

  // 1. Seed vendors
  console.log('\n📦 Seeding vendors...');
  for (const vendor of VENDORS) {
    const vendorData = {
      ...vendor,
      createdAt: randomDate(365).toISOString(), // member for up to 1 year
    };
    await db.collection('vendors').doc(vendor.id).set(vendorData, { merge: true });
    console.log(`   ✅ ${vendor.displayName} (${vendor.totalTrades} trades, ${vendor.trustScore}⭐)`);
  }

  // 2. Seed deals
  console.log('\n💰 Seeding transaction history...');
  let totalDeals = 0;

  for (const vendor of VENDORS) {
    const deals = generateDeals(vendor);
    totalDeals += deals.length;

    // Batch write (500 per batch max in Firestore)
    const batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const deal of deals) {
      const ref = db.collection('deals').doc(deal.id);
      currentBatch.set(ref, deal, { merge: true });
      batchCount++;

      if (batchCount >= 450) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        batchCount = 0;
      }
    }
    if (batchCount > 0) batches.push(currentBatch);

    for (const batch of batches) {
      await batch.commit();
    }

    const statusCounts = deals.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`   ✅ ${vendor.displayName}: ${deals.length} deals`);
    console.log(`      └─ ${Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  }

  // 3. Summary
  console.log('\n' + '─'.repeat(50));
  console.log(`🎉 Seeding complete!`);
  console.log(`   Vendors:      ${VENDORS.length}`);
  console.log(`   Total Deals:  ${totalDeals}`);
  console.log(`   Collections:  vendors, deals`);
  console.log('\n💡 Your platform now looks alive for the demo!');
  console.log('   Open /vendor/vendor-sneakerplug-gh to see SneakerPlugGH\'s profile');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
