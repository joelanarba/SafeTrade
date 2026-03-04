const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../service-account-key.json'); // assuming it's available

if (!serviceAccount) {
  console.error('Service account key not found');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function backfillUsernames() {
  const vendorsSnapshot = await db.collection('vendors').get();
  let count = 0;
  
  for (const doc of vendorsSnapshot.docs) {
    const data = doc.data();
    
    // Always recalculate or assign if missing/incorrect format 
    // The requirement: "use their names and make them smaller case as default username"
    if (data.displayName) {
      let desiredUsername = data.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (desiredUsername.length < 3) {
        desiredUsername += Math.floor(Math.random() * 10000);
      }
      
      // Ensure uniqueness (simple approach, assume mostly unique or handle suffix)
      let finalUsername = desiredUsername;
      let existingDocs = await db.collection('vendors').where('username', '==', finalUsername).get();
      let attempt = 1;
      
      while (!existingDocs.empty && existingDocs.docs[0].id !== doc.id) {
        finalUsername = `${desiredUsername}${attempt}`;
        existingDocs = await db.collection('vendors').where('username', '==', finalUsername).get();
        attempt++;
      }
      
      // Update the vendor document if it doesn't have the final username
      if (data.username !== finalUsername) {
        await doc.ref.update({ username: finalUsername });
        console.log(`Updated ${doc.id} (${data.displayName}) to username: ${finalUsername}`);
        count++;
      } else {
        console.log(`Vendor ${doc.id} already has correct username: ${finalUsername}`);
      }
    } else {
      console.log(`Skipping ${doc.id} - No displayName found`);
    }
  }
  
  console.log(`Backfill complete. Updated ${count} vendors.`);
}

backfillUsernames().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
