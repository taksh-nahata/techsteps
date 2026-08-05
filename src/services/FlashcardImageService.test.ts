import { describe, it, expect } from 'vitest';
import { sanitizeFlashcardSteps } from './FlashcardImageService';
import type { FlashcardStep } from '../types/services';

const baseStep = (overrides: Partial<FlashcardStep>): FlashcardStep => ({
  id: 's1',
  stepNumber: 1,
  title: 'Open Settings',
  content: 'Tap the Settings app on your iPad home screen.',
  instructions: ['Find the gray gear icon', 'Tap Settings'],
  estimatedDuration: 30,
  ...overrides,
});

describe('FlashcardImageService', () => {
  it('strips random Google URLs from AI-provided images', async () => {
    const step = baseStep({
      image: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    });
    const result = await sanitizeFlashcardSteps([step]);
    expect(result[0].image).toBeUndefined();
  });

  it('does not add images from web search', async () => {
    const step = baseStep({
      title: 'Connect to Wi-Fi',
      content: 'Open Settings, tap Wi-Fi, choose your network.',
    });
    const result = await sanitizeFlashcardSteps([step]);
    expect(result[0].image).toBeUndefined();
  });
});
