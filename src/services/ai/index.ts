import { AIService } from '../../types/services';
import { MistralService } from './MistralService';
import { FALLBACK_CONFIG } from './config';

// Simplified central AI orchestration: use Mistral as the sole provider.
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const mistralKey = FALLBACK_CONFIG.mistralKey;
    console.log('Initializing central AI with Mistral as primary provider');
    aiServiceInstance = new MistralService(mistralKey);
  }
  return aiServiceInstance;
}

export function resetAIService(): void {
  aiServiceInstance = null;
}

export { MistralService } from './MistralService';
export * from './config';

// Backwards-compatible shim: export a `GeminiService` that delegates to Mistral.
// This prevents runtime import errors in files still importing `GeminiService` from the ai barrel.
import { MistralService as _Mistral } from './MistralService';

export class GeminiService extends (_Mistral as any) {
  constructor(apiKey?: string, model?: string) {
    console.warn('GeminiService is deprecated in this build; delegating to MistralService');
    super(apiKey, model);
  }
}
