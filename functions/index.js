/**
 * SafeTrade Ghana — Firebase Cloud Functions
 *
 * Smart Release Protection:
 * - Auto-release fires at: shippedAt + estimatedDeliveryHours + 48 hours
 * - If vendor never marks as shipped, auto-release never fires
 * - If buyer raises a dispute, auto-release does not fire
 * - Backward compat: deals without estimatedDeliveryHours default to 72hrs after shippedAt
 *
 * Deploy with: firebase deploy --only functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled function: Smart Release — auto-release escrows based on delivery window.
 * Runs every hour.
 */
exports.autoReleaseEscrows = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    console.log("[SYNC] Running smart auto-release check...");

    const now = new Date();

    try {
      const snapshot = await db
        .collection("deals")
        .where("status", "==", "in_escrow")
        .get();

      let released = 0;
      let skipped = 0;

      for (const doc of snapshot.docs) {
        const deal = doc.data();

        // RULE: If deal is disputed, skip entirely — auto-release must not fire
        if (deal.status === "disputed") {
          skipped++;
          continue;
        }

        // RULE: If vendor has not marked as shipped, skip — funds stay locked
        if (!deal.shippedAt) {
          skipped++;
          continue;
        }

        // Calculate auto-release time: shippedAt + estimatedDeliveryHours + 48hrs buffer
        const shippedAt = new Date(deal.shippedAt).getTime();
        const estimatedHours = deal.estimatedDeliveryHours || 72; // backward compat
        const bufferHours = 48; // non-negotiable
        const autoReleaseTime = shippedAt + (estimatedHours + bufferHours) * 60 * 60 * 1000;

        if (now.getTime() < autoReleaseTime) {
          continue; // Not yet time
        }

        console.log(`[TIME] Auto-releasing deal ${doc.id}: ${deal.itemName}`);

        // Generate mock tx hash (replace with real escrow release in production)
        const releaseTxHash = `0x${"auto" + doc.id.replace(/-/g, "").substring(0, 60)}`;

        await doc.ref.update({
          status: "completed",
          releaseTxHash,
          updatedAt: new Date().toISOString(),
          autoReleased: true,
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

        // Update buyer stats
        if (deal.buyerPhone) {
          try {
            const buyerRef = db.collection("buyers").doc(deal.buyerPhone);
            const buyerSnap = await buyerRef.get();
            if (buyerSnap.exists) {
              await buyerRef.update({
                totalPurchases: (buyerSnap.data().totalPurchases || 0) + 1,
                lastSeen: new Date().toISOString(),
              });
            }
          } catch (err) {
            console.error(`Buyer update failed for ${deal.buyerPhone}:`, err);
          }
        }

        released++;
      }

      console.log(`[SUCCESS] Auto-released ${released} deal(s), skipped ${skipped}`);
      return null;
    } catch (error) {
      console.error("[ERROR] Auto-release error:", error);
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
      console.log(`[ALERT] Dispute raised for deal ${context.params.dealId}`);
      console.log(`   Item: ${after.itemName}`);
      console.log(`   Reason: ${after.disputeReason}`);
      console.log(`   Vendor: ${after.vendorName}`);
      console.log(`   Buyer: ${after.buyerName}`);

      // Update buyer dispute count
      if (after.buyerPhone) {
        try {
          const buyerRef = db.collection("buyers").doc(after.buyerPhone);
          const buyerSnap = await buyerRef.get();
          if (buyerSnap.exists) {
            await buyerRef.update({
              disputes: (buyerSnap.data().disputes || 0) + 1,
            });
          }
        } catch (err) {
          console.error("Buyer dispute count update failed:", err);
        }
      }
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
    console.log(`[USER] New vendor registered: ${context.params.vendorId}`);
    return null;
  });
