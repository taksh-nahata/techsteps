import { GuideStep, TroubleshootingGuide } from '../types/guides';
import { FlashcardStep } from '../types/services';
import {
  getDirectionsForDevice,
  GuideDeviceType,
  GUIDE_DEVICE_TYPES,
} from '../utils/deviceDetection';

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
