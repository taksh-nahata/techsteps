import { DEFAULT_GEMINI_CONFIG } from './config';
import { GuideAnnotation } from '../../types/guides';

export interface ScreenAssistRequest {
  /** Raw base64 JPEG data, no "data:" prefix. */
  imageBase64: string;
  question: string;
}

export interface ScreenAssistResponse {
  found: boolean;
  spokenText: string;
  displayText: string;
  annotation: GuideAnnotation | null;
  refusedForSensitiveContent?: boolean;
}

// Separate from GLOBAL_SYSTEM_PROMPT -- this is a single-frame "where do I
// click" call, not a conversational chat turn, and has its own strict JSON
// contract plus the one safety rule that matters here: refuse on anything
// that looks like a password/payment field, since this is the only
// enforcement point available -- the app only ever sees pixels, never the
// shared window's URL or DOM.
const SCREEN_ASSIST_SYSTEM_PROMPT = `You are looking at a single screenshot of a window someone shared with you because they need help finding what to click. You cannot see anything except this one image -- no page URL, no history, no other context.

Respond with ONLY a JSON object matching this exact shape, no markdown fences, no commentary:
{
  "found": boolean,
  "spokenText": "short, conversational, 1-2 sentences, suitable for text-to-speech",
  "displayText": "a slightly more detailed caption, still short",
  "annotation": { "type": "circle" or "arrow", "x": number 0-100, "y": number 0-100, "color": "#hex (optional)", "label": "short optional label" } or null,
  "refusedForSensitiveContent": boolean
}

Rules:
- If the image shows a password field, a payment/card entry form, an SSN, or any other sensitive input, set refusedForSensitiveContent to true, annotation to null, and a brief spokenText explaining you can't help with that for their safety. Do not describe or repeat the sensitive content itself.
- If you can't find what they're asking about, set found to false, annotation to null, and say so plainly in spokenText.
- x/y are percentages of the image's width/height, marking where the pointer should appear.
- Never invent an annotation you aren't reasonably confident about -- an absent marker is better than a wrong one.
- Output ONLY the JSON object.`;

/**
 * One-shot vision call for the screen-share assist: given a single frame and
 * a question, returns where to point. Its own small service rather than
 * bolted onto MistralService/AIResponse/FlashcardStep -- those assume a
 * multi-step chat turn or a numbered guide, neither of which fits "point at
 * one spot on one image right now."
 */
export async function askAboutFrame(request: ScreenAssistRequest): Promise<ScreenAssistResponse> {
  const { apiKey, primaryModel, maxTokens } = DEFAULT_GEMINI_CONFIG;
  if (!apiKey) {
    throw new Error('No Gemini API key configured (VITE_GEMINI_API_KEY).');
  }

  const body = {
    systemInstruction: { parts: [{ text: SCREEN_ASSIST_SYSTEM_PROMPT }] },
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: request.imageBase64 } },
          { text: request.question?.trim() || 'What should I click?' },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Gemini vision error: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
  if (!text) throw new Error('Gemini vision returned an empty response');

  let parsed: any;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    throw new Error('Could not parse Gemini vision JSON response: ' + text.slice(0, 200));
  }

  const rawAnnotation = parsed.annotation;
  const validAnnotation: GuideAnnotation | null =
    !parsed.refusedForSensitiveContent && rawAnnotation && typeof rawAnnotation.x === 'number' && typeof rawAnnotation.y === 'number'
      ? {
          type: rawAnnotation.type === 'arrow' ? 'arrow' : 'circle',
          x: Math.max(0, Math.min(100, rawAnnotation.x)),
          y: Math.max(0, Math.min(100, rawAnnotation.y)),
          color: typeof rawAnnotation.color === 'string' ? rawAnnotation.color : undefined,
          label: typeof rawAnnotation.label === 'string' ? rawAnnotation.label : undefined,
        }
      : null;

  return {
    found: !!parsed.found,
    spokenText:
      parsed.spokenText ||
      (parsed.refusedForSensitiveContent
        ? "I can't help with that for your safety."
        : "I couldn't find that on your screen."),
    displayText: parsed.displayText || parsed.spokenText || '',
    annotation: validAnnotation,
    refusedForSensitiveContent: !!parsed.refusedForSensitiveContent,
  };
}
