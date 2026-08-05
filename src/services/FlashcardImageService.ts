import { FlashcardStep } from '../types/services';
import { imageLibraryService } from './ImageLibraryService';

/**
 * Flashcard images: ONLY pre-verified library matches.
 * Web search / Wikipedia / AI generation disabled — too many irrelevant results.
 */

const BLOCKED_URL_RE = [
  /google\.com/i,
  /gstatic\.com/i,
  /facebook\.com/i,
  /twitter\.com/i,
  /favicon/i,
  /wikipedia\.org/i,
  /wikimedia\.org/i,
  /pollinations/i,
];

function extractKeywords(text: string): string[] {
  const STOP = new Set(['the', 'and', 'for', 'your', 'with', 'this', 'that', 'step', 'tap', 'click', 'open']);
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .slice(0, 6);
}

function libraryMatchScore(step: FlashcardStep): number {
  const matches = imageLibraryService.suggestImagesForStep(step.content, step.title);
  if (matches.length === 0) return 0;
  const keywords = extractKeywords(`${step.title} ${step.content}`);
  const caption = matches[0].caption.toLowerCase();
  const hits = keywords.filter((k) => caption.includes(k)).length;
  return hits / Math.max(keywords.length, 1);
}

async function probeImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const t = setTimeout(() => resolve(false), 5000);
    img.onload = () => {
      clearTimeout(t);
      resolve(img.naturalWidth >= 120 && img.naturalHeight >= 80);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(false);
    };
    img.src = url;
  });
}

/** Keep image only from curated guide library with strong keyword match. */
export async function sanitizeFlashcardSteps(steps: FlashcardStep[]): Promise<FlashcardStep[]> {
  const out: FlashcardStep[] = [];

  for (const step of steps) {
    const score = libraryMatchScore(step);
    const matches = imageLibraryService.suggestImagesForStep(step.content, step.title);

    if (score >= 0.45 && matches[0]) {
      const url = matches[0].imageUrl;
      if (!BLOCKED_URL_RE.some((re) => re.test(url)) && (await probeImage(url))) {
        out.push({
          ...step,
          image: url,
          imageCaption: matches[0].caption,
        });
        continue;
      }
    }

    // Strip any AI-hallucinated or random URLs
    const { image: _img, imageCaption: _cap, ...clean } = step;
    out.push(clean);
  }

  return out;
}

/** @deprecated use sanitizeFlashcardSteps */
export const enrichFlashcardsWithImages = sanitizeFlashcardSteps;
