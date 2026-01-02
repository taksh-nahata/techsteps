import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK. In Cloud Functions, credentials are provided by the environment.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Purge chat messages older than retentionDays (14 by default)
export const purgeOldChatMessages = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const retentionDays = 14;
    const cutoffMillis = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const cutoff = admin.firestore.Timestamp.fromMillis(cutoffMillis);

    console.log(`Running purgeOldChatMessages - deleting messages older than ${retentionDays} days`);

    try {
      const batchSize = 500;
      // Use collection group to find all 'chats' subcollection documents with old timestamp
      const q = db.collectionGroup('chats').where('timestamp', '<', cutoff).limit(batchSize);
      const snapshot = await q.get();

      if (snapshot.empty) {
        console.log('No old chat messages found');
        return null;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${snapshot.size} old chat messages`);

      // Note: If there are more than batchSize old docs, this function will delete up to batchSize per run.
      // You can loop until fewer than batchSize are returned, but be cautious of function time limits.
    } catch (err) {
      console.error('Error purging old chat messages:', err);
    }

    return null;
  });
