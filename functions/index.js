/**
 * SafeTrade Ghana — Firebase Cloud Functions
 *
 * These functions run separately from the Next.js app.
 * Deploy with: firebase deploy --only functions
 *
 * Required setup:
 *   1. npm install -g firebase-tools
 *   2. firebase login
 *   3. firebase init functions
 *   4. Copy this file to functions/index.js
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled function: Auto-release escrows after 72 hours with no dispute.
 * Runs every hour.
 */
exports.autoReleaseEscrows = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    console.log("🔄 Running auto-release check...");

    const now = new Date();
    const cutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 72 hours ago

    try {
      const snapshot = await db
        .collection("deals")
        .where("status", "==", "in_escrow")
        .get();

      let released = 0;

      for (const doc of snapshot.docs) {
        const deal = doc.data();
        const createdAt = new Date(deal.createdAt);

        if (createdAt < cutoff) {
          // 72 hours have passed with no dispute — auto-confirm
          console.log(`⏰ Auto-releasing deal ${doc.id}: ${deal.itemName}`);

          // Generate mock tx hash (replace with real escrow release)
          const releaseTxHash = `0x${"auto" + doc.id.replace(/-/g, "").substring(0, 60)}`;

          await doc.ref.update({
            status: "completed",
            releaseTxHash,
            updatedAt: new Date().toISOString(),
          });

          // Update vendor stats
          const vendorRef = db.collection("vendors").doc(deal.vendorId);
          const vendorSnap = await vendorRef.get();

          if (vendorSnap.exists) {
            const vendor = vendorSnap.data();
            const newSuccessful = (vendor.successfulTrades || 0) + 1;
            const newTotal = (vendor.totalTrades || 0) + 1;
            const newTrustScore =
              Math.round((newSuccessful / newTotal) * 5 * 100) / 100;

            await vendorRef.update({
              successfulTrades: newSuccessful,
              totalTrades: newTotal,
              trustScore: newTrustScore,
              verified: newSuccessful >= 10,
            });
          }

          released++;
        }
      }

      console.log(`✅ Auto-released ${released} deal(s)`);
      return null;
    } catch (error) {
      console.error("❌ Auto-release error:", error);
      return null;
    }
  });

/**
 * Firestore trigger: When a deal status changes to 'disputed',
 * log it for admin notification.
 */
exports.onDealDisputed = functions.firestore
  .document("deals/{dealId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== "disputed" && after.status === "disputed") {
      console.log(`🚨 Dispute raised for deal ${context.params.dealId}`);
      console.log(`   Item: ${after.itemName}`);
      console.log(`   Reason: ${after.disputeReason}`);
      console.log(`   Vendor: ${after.vendorName}`);
      console.log(`   Buyer: ${after.buyerName}`);

      // In production, you could send push notifications here
      // or trigger additional email alerts
    }

    return null;
  });

/**
 * Firestore trigger: When a new vendor is created,
 * initialize their trust profile.
 */
exports.onVendorCreated = functions.firestore
  .document("vendors/{vendorId}")
  .onCreate(async (snap, context) => {
    console.log(`👤 New vendor registered: ${context.params.vendorId}`);
    return null;
  });
