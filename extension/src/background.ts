// Phase 0: isolated round trip only. No tab-tracking, no Gemini, no real
// drawing logic yet -- just prove that a message from an allowed origin can
// reach this service worker and result in something appearing on a real tab.
// See the plan (Plan C) for what Phases 1-3 add on top of this file.

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[TechSteps Screen Assist] onMessageExternal:', message, 'from', sender.origin);

  if (message?.type === 'PING') {
    sendResponse({ ok: true, phase: 0 });
    return false;
  }

  if (message?.type === 'TEST_HIGHLIGHT') {
    drawTestDotOnActiveTab()
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // async sendResponse
  }

  return false;
});

async function drawTestDotOnActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found');

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const existing = document.getElementById('__techsteps_test_dot__');
      existing?.remove();

      const host = document.createElement('div');
      host.id = '__techsteps_test_dot__';
      host.style.cssText = 'position:fixed; left:50vw; top:50vh; z-index:2147483647; pointer-events:none;';
      const shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        .dot {
          width: 48px; height: 48px; border-radius: 9999px;
          border: 4px solid #ef4444; box-shadow: 0 0 20px rgba(239,68,68,0.4);
          transform: translate(-50%, -50%);
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `;
      const dot = document.createElement('div');
      dot.className = 'dot';
      shadow.appendChild(style);
      shadow.appendChild(dot);
      document.documentElement.appendChild(host);

      setTimeout(() => host.remove(), 6000);
    },
  });
}
