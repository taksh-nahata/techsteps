import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CloudBillingClient } from '@google-cloud/billing';

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

// ============================================================
// Budget kill switch — disables billing for this project the moment
// actual spend crosses the budget you configure in Cloud Billing.
// Disabling billing stops ALL billable APIs on the project (not just
// Text-to-Speech), since Cloud Billing has no per-API kill switch — that's
// the intended, blunt behavior here: a last-resort stop, not a soft warning.
//
// This code alone does nothing until you complete the Cloud Console setup:
//   1. Billing > Budgets & alerts > your budget for this project >
//      "Manage notifications" > check "Connect a Pub/Sub topic" and create
//      (or pick) a topic named exactly "budget-alerts" — or change
//      BUDGET_PUBSUB_TOPIC below to match whatever name you actually use.
//   2. Deploy this function (see package.json's "deploy" script).
//   3. Grant the "Billing Account Administrator" role, on the BILLING
//      ACCOUNT (Billing > Account Management > Permissions — not the
//      project's IAM page), to this project's App Engine default service
//      account: <project-id>@appspot.gserviceaccount.com. Without this the
//      disable call fails silently in the function logs and billing stays
//      on.
// ============================================================
const BUDGET_PUBSUB_TOPIC = 'budget-alerts';

const billing = new CloudBillingClient();

interface BudgetNotification {
  budgetDisplayName?: string;
  costAmount?: number;
  budgetAmount?: number;
  currencyCode?: string;
}

export const stopBillingOnBudgetAlert = functions.pubsub
  .topic(BUDGET_PUBSUB_TOPIC)
  .onPublish(async (message) => {
    const data = message.json as BudgetNotification | undefined;
    console.log('Budget notification received:', data);

    if (!data || typeof data.costAmount !== 'number' || typeof data.budgetAmount !== 'number') {
      console.warn('Unexpected/empty budget notification payload — taking no action.', data);
      return null;
    }

    if (data.costAmount <= data.budgetAmount) {
      console.log(`Cost (${data.costAmount}) is within budget (${data.budgetAmount}) — no action.`);
      return null;
    }

    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
    if (!projectId) {
      console.error('No project ID available in the function environment — cannot disable billing.');
      return null;
    }

    console.warn(`Cost (${data.costAmount}) exceeded budget (${data.budgetAmount}) for ${projectId} — disabling billing.`);
    return disableBillingForProject(`projects/${projectId}`);
  });

async function disableBillingForProject(projectName: string): Promise<void> {
  const billingEnabled = await isBillingEnabled(projectName);
  if (!billingEnabled) {
    console.log('Billing is already disabled for this project — nothing to do.');
    return;
  }

  const [res] = await billing.updateProjectBillingInfo({
    name: projectName,
    projectBillingInfo: { billingAccountName: '' }, // empty string unlinks the billing account, disabling billing
  });
  console.log('Billing disabled:', res);
}

async function isBillingEnabled(projectName: string): Promise<boolean> {
  try {
    const [info] = await billing.getProjectBillingInfo({ name: projectName });
    return !!info.billingEnabled;
  } catch (e) {
    // Fail safe toward taking the disable action rather than silently doing
    // nothing if we can't even tell what the current state is.
    console.warn('Could not read current billing status; assuming billing is enabled.', e);
    return true;
  }
}
