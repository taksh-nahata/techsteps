# Cloud Functions for TechSteps

This folder contains a scheduled Cloud Function that purges Firestore chat messages older than 14 days.

Deploy steps (requires Firebase CLI and project setup):

1. cd functions
2. npm install
3. npm run build (if you add TypeScript build step) or ensure files are JS
4. firebase deploy --only functions:purgeOldChatMessages

Notes:
- The function uses `collectionGroup('chats')` to find chat message documents under `users/{userId}/chats`.
- In GCP production, prefer using Firestore TTL policies or set an automated job with proper batching and retry logic for large datasets.
