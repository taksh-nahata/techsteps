import { GuideStep, TroubleshootingGuide } from '../types/guides';
import { AIResponse, FlashcardStep } from '../types/services';
import {
  getDirectionsForDevice,
  GuideDeviceType,
  GUIDE_DEVICE_TYPES,
} from '../utils/deviceDetection';
import { GuideStorageService } from './GuideStorageService';
import { MemoryService } from './MemoryService';

export const GUIDE_CATEGORIES = [
  'wifi',
  'ios',
  'android',
  'windows',
  'mac',
  'browser',
  'email',
  'printer',
  'video-calls',
  'photos',
  'general',
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

function buildContentFromDirections(
  directionsByDevice: Partial<Record<GuideDeviceType, string[]>>
): string {
  const parts: string[] = [];
  for (const key of GUIDE_DEVICE_TYPES) {
    const lines = (directionsByDevice[key] ?? []).filter((l) => l.trim());
    if (lines.length) parts.push(...lines);
  }
  return parts.join('\n');
}

export function normalizeStep(step: Partial<GuideStep>, index: number): GuideStep {
  let directionsByDevice = step.directionsByDevice
    ? { ...step.directionsByDevice }
    : undefined;

  if (!directionsByDevice && step.instructions?.length) {
    directionsByDevice = { all: [...step.instructions] };
  }

  if (!directionsByDevice && step.content) {
    const parsed = step.content
      .split(/\n+/)
      .map((l) => l.replace(/^[\d•\-*.]+\s*/, '').trim())
      .filter((l) => l.length > 0);
    if (parsed.length) directionsByDevice = { all: parsed };
  }

  if (!directionsByDevice || Object.keys(directionsByDevice).length === 0) {
    directionsByDevice = { all: [''] };
  }

  const normalized: Partial<Record<GuideDeviceType, string[]>> = {};
  for (const key of GUIDE_DEVICE_TYPES) {
    const vals = directionsByDevice[key as GuideDeviceType];
    if (vals && vals.length > 0) {
      normalized[key] = [...vals];
    }
  }
  if (Object.keys(normalized).length === 0) {
    normalized.all = [''];
  }

  const content = step.content || buildContentFromDirections(normalized);

  return {
    id: step.id || `step-${index + 1}`,
    title: step.title || `Step ${index + 1}`,
    content,
    directionsByDevice: normalized,
    image: step.image,
    imageCaption: step.imageCaption,
    annotations: step.annotations,
  };
}

export function normalizeGuide(guide: Partial<TroubleshootingGuide>): TroubleshootingGuide {
  const now = new Date().toISOString();
  const steps = (guide.steps || []).map((s, i) => normalizeStep(s, i));

  return {
    id: guide.id || `guide-${Date.now()}`,
    title: guide.title || 'Untitled guide',
    problemDescription: guide.problemDescription || '',
    keywords: guide.keywords?.length ? guide.keywords : ['tech', 'help'],
    category: guide.category || 'general',
    steps,
    alternates: guide.alternates,
    meta: {
      created: guide.meta?.created || now,
      updated: now,
      sourceUrl: guide.meta?.sourceUrl,
      source: guide.meta?.source || 'manual',
      originalQuery: guide.meta?.originalQuery,
      confidenceScore: guide.meta?.confidenceScore ?? 0.8,
      priorityScore: guide.meta?.priorityScore,
      difficulty: guide.meta?.difficulty || 'Easy',
    },
  };
}

export function guideToFlashcardSteps(
  guide: TroubleshootingGuide,
  device: GuideDeviceType = 'all'
): FlashcardStep[] {
  return guide.steps.map((step, idx) => {
    const instructions = getDirectionsForDevice(
      step.directionsByDevice as Partial<Record<GuideDeviceType, string[]>>,
      device,
      step.instructions,
      step.content
    );

    return {
      id: step.id,
      stepNumber: idx + 1,
      title: step.title,
      content: step.content,
      instructions: instructions.length ? instructions : [step.content || step.title],
      directionsByDevice: step.directionsByDevice,
      audioScript: `${step.title}. ${instructions[0] || step.content}`,
      estimatedDuration: 30,
      image: step.image,
      annotations: step.annotations,
    };
  });
}

export function extractKeywords(text: string): string[] {
  const STOP = new Set(['the', 'and', 'for', 'your', 'with', 'this', 'that', 'from', 'how', 'what']);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .slice(0, 8);
}

export function createBlankGuide(): TroubleshootingGuide {
  return normalizeGuide({
    id: `guide-${Date.now()}`,
    title: 'New guide',
    problemDescription: '',
    keywords: [],
    category: 'general',
    steps: [
      {
        id: 'step-1',
        title: 'Step 1',
        content: '',
        directionsByDevice: { all: [''] },
      },
    ],
    meta: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      source: 'manual',
      difficulty: 'Easy',
      confidenceScore: 1,
    },
  });
}

/**
 * True only when at least one step has real per-device directions for more
 * than one device — i.e. the device picker would actually change what's
 * shown. AI chat guides only ever populate a single "all" bucket (tailored
 * once to the asker's detected device), so the picker has nothing to switch
 * between and showing it just promises a feature that doesn't work.
 */
export function hasDeviceVariants(steps: FlashcardStep[]): boolean {
  return steps.some((step) => {
    const byDevice = step.directionsByDevice as Partial<Record<GuideDeviceType, string[]>> | undefined;
    if (!byDevice) return false;
    const populated = Object.entries(byDevice).filter(([key, lines]) => key !== 'all' && (lines?.length ?? 0) > 0);
    return populated.length > 0;
  });
}

export interface PersistedGuideResult {
  guideId: string;
  guideTitle: string;
  steps: FlashcardStep[];
}

/**
 * Persists an AI-generated step-by-step guide: saves it to GuideStorageService
 * (so it can be reopened later via its guideId) and enters it into the
 * pending-review workflow unless it came from the cached guide-matching fast
 * path. Extracted from ChatDashboard's handleSendMessage so a guide generated
 * from a different entry point (e.g. the voice-first home screen) is
 * persisted identically instead of duplicating this logic.
 *
 * Takes already-sanitized `steps` (run them through sanitizeFlashcardSteps()
 * from FlashcardImageService yourself first) rather than importing that
 * service here — FlashcardImageService pulls in ImageLibraryService, which
 * pulls in GuideLibraryService, which itself imports this file to reuse
 * normalizeGuide(); importing FlashcardImageService from here would close
 * that into a circular import.
 */
export async function persistGeneratedGuide(
  userId: string,
  messageContent: string,
  aiMessageId: string,
  response: AIResponse,
  steps: FlashcardStep[]
): Promise<PersistedGuideResult> {
  const cleaned = steps;

  const guideId = `guide-${Date.now()}`;
  const guideTitle =
    messageContent.slice(0, 60) + (messageContent.length > 60 ? '…' : '') || 'Step-by-step guide';

  GuideStorageService.save(userId, {
    id: guideId,
    messageId: aiMessageId,
    title: guideTitle,
    steps: cleaned,
    createdAt: new Date().toISOString(),
  });

  if (response.metadata?.model !== 'cached-guide') {
    const newGuide: TroubleshootingGuide = {
      id: `ai-${Date.now()}`,
      title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : ''),
      problemDescription:
        response.content.slice(0, 200) + (response.content.length > 200 ? '...' : ''),
      keywords: messageContent.toLowerCase().split(/\W+/).filter((w) => w.length > 3),
      category: 'ai-chat',
      steps: cleaned.map((f) => {
        const step: GuideStep = { id: f.id, title: f.title, content: f.content };
        if (f.image) step.image = f.image;
        if (f.imageCaption) step.imageCaption = f.imageCaption;
        if (f.annotations?.length) step.annotations = f.annotations;
        return step;
      }),
      meta: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        source: 'ai-chat',
        originalQuery: messageContent,
        confidenceScore: response.confidence || 0.8,
        difficulty: 'Medium',
      },
    };
    await MemoryService.savePendingGuide(newGuide);
  }

  return { guideId, guideTitle, steps: cleaned };
}

/** Update one device’s direction list on a step (preserves empty rows for editing) */
export function resolveFlashcardStepsForDevice(
  steps: FlashcardStep[],
  device: GuideDeviceType
): FlashcardStep[] {
  return steps.map((step) => {
    const instructions = getDirectionsForDevice(
      step.directionsByDevice as Partial<Record<GuideDeviceType, string[]>>,
      device,
      step.instructions,
      step.content
    );
    return {
      ...step,
      instructions: instructions.length ? instructions : step.instructions,
    };
  });
}
