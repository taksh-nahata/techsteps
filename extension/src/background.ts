import { drawHighlight } from './inject/drawHighlight';
import type { HighlightAnnotation } from './types';

// Phase 0's PING/TEST_HIGHLIGHT (targeting whatever tab happened to be
// active) is gone -- this now does real tab-tracking (Phase 1) and draws
// real annotations (Phase 2). Phase 3 (wiring the real web app to send
// HIGHLIGHT messages) happens in the main app, not here.

const TARGET_TAB_KEY = 'targetTabId';

const TECHSTEPS_ORIGIN_PREFIXES = ['https://tech-steps.org', 'http://localhost'];

function isTechStepsOrigin(url: string | undefined): boolean {
  if (!url) return false;
  return TECHSTEPS_ORIGIN_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function isInjectableUrl(url: string | undefined): boolean {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}

async function trackIfEligible(tab: chrome.tabs.Tab | undefined): Promise<void> {
  if (!tab?.active || !tab.id) return;
  if (!isInjectableUrl(tab.url) || isTechStepsOrigin(tab.url)) return;
  await chrome.storage.session.set({ [TARGET_TAB_KEY]: tab.id });
}

// Passive tracking: no click/gesture required, matching the user's
// repeatedly-stated preference for zero extra manual steps. This is why
// host_permissions: ["<all_urls>"] is required (declared in manifest.json)
// rather than activeTab -- activeTab only activates on a direct gesture
// aimed at the extension itself, which passive onActivated tracking never
// has.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    await trackIfEligible(tab);
  } catch {
    // Tab may already be gone; nothing to track.
  }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  // Covers navigating within an already-active tab (no onActivated fires
  // for that), without re-tracking every background tab's unrelated updates.
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
    void trackIfEligible(tab);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const stored = await chrome.storage.session.get(TARGET_TAB_KEY);
  if (stored[TARGET_TAB_KEY] === tabId) {
    await chrome.storage.session.remove(TARGET_TAB_KEY);
  }
});

/**
 * Re-validates at injection time, not just at tracking time: the tracked
 * tab id can go stale between being stored and being used (closed,
 * navigated to a restricted page, etc.) -- MV3 service workers also don't
 * survive a plain in-memory variable across their own restarts, which is
 * why the id lives in chrome.storage.session in the first place, not a
 * bare module-level variable.
 */
async function getValidatedTargetTabId(): Promise<number | null> {
  const stored = await chrome.storage.session.get(TARGET_TAB_KEY);
  const tabId = stored[TARGET_TAB_KEY];
  if (typeof tabId !== 'number') return null;

  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isInjectableUrl(tab.url) || isTechStepsOrigin(tab.url)) return null;
    return tabId;
  } catch {
    // Tab no longer exists.
    await chrome.storage.session.remove(TARGET_TAB_KEY);
    return null;
  }
}

async function highlightOnTargetTab(annotation: HighlightAnnotation): Promise<void> {
  const tabId = await getValidatedTargetTabId();
  if (tabId === null) {
    throw new Error('No valid target tab to highlight -- switch to the app you need help with, then ask again.');
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    func: drawHighlight,
    args: [annotation],
  });
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[TechSteps Screen Assist] onMessageExternal:', message, 'from', sender.origin);

  if (message?.type === 'PING') {
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === 'HIGHLIGHT' && message.annotation) {
    highlightOnTargetTab(message.annotation as HighlightAnnotation)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // async sendResponse
  }

  return false;
});
