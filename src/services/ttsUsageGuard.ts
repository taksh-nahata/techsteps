/**
 * Client-side, best-effort spend guard for Google Cloud TTS. Tracks
 * characters sent to the paid Neural2/WaveNet voices this calendar month in
 * localStorage and caps usage well under the real 1,000,000-character/month
 * free tier, so a single browser never gets close to it on its own.
 *
 * This is NOT a real billing guarantee: a different browser, device, or
 * tester using the same API key isn't tracked here, and clearing site data
 * resets the counter. The only actual guarantee against being charged has to
 * come from a Google Cloud Billing budget alert (with an automated
 * disable-the-API action) configured in the Cloud Console — no client-side
 * code can set that up on your behalf.
 */
const SAFE_CHARACTER_LIMIT = 700_000; // ~70% of the real 1,000,000 free-tier ceiling

function monthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function storageKey(): string {
  return `techsteps_tts_usage_${monthKey()}`;
}

function getUsedCharacters(): number {
  try {
    return Number(localStorage.getItem(storageKey())) || 0;
  } catch {
    return 0;
  }
}

export function wouldExceedSafeLimit(charCount: number): boolean {
  return getUsedCharacters() + charCount > SAFE_CHARACTER_LIMIT;
}

export function recordTTSUsage(charCount: number): void {
  try {
    const used = getUsedCharacters() + charCount;
    localStorage.setItem(storageKey(), String(used));
    if (used > SAFE_CHARACTER_LIMIT * 0.8) {
      console.warn(
        `Google Cloud TTS usage this month: ${used}/${SAFE_CHARACTER_LIMIT} of the safe cap ` +
        `(real free tier is 1,000,000 characters). Falling back to free browser speech once the cap is hit.`
      );
    }
  } catch {
    // localStorage unavailable — fails open; the real safeguard is a Cloud
    // Billing budget alert, not this counter.
  }
}
