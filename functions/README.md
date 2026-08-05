# Cloud Functions for TechSteps

This folder contains a scheduled Cloud Function that purges Firestore chat messages older than 14 days.

Deploy steps (requires the Firebase CLI: `npm install -g firebase-tools`, then `firebase login`):

1. `cd functions && npm install` (installs `typescript`, `firebase-admin`, `firebase-functions`)
2. From the **repo root** (where `firebase.json` and `.firebaserc` live): `firebase deploy --only functions:purgeOldChatMessages`
   - This runs the `predeploy` build step automatically (`tsc` compiling `src/` to `lib/`).
3. Also deploy the Firestore index this function's query needs (one-time, or whenever `firestore.indexes.json` changes), from the repo root: `firebase deploy --only firestore:indexes`
   - The function runs `collectionGroup('chats').where('timestamp', '<', cutoff)`. Firestore only auto-indexes collection-scoped queries, not collection-group ones, so without this the function throws `FAILED_PRECONDITION` every time it runs.

Notes:
- The function uses `collectionGroup('chats')` to find chat message documents under `users/{userId}/chats`.
- In GCP production, prefer using Firestore TTL policies or set an automated job with proper batching and retry logic for large datasets.
