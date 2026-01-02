import { AIService } from '../../types/services';
import { MistralService } from './MistralService';
import { FALLBACK_CONFIG } from './config';

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const mistralKey = FALLBACK_CONFIG.mistralKey;
    const mistralModel = FALLBACK_CONFIG.mistralModel;

    console.log('🚀 Initializing Mistral AI as Primary Service...');
    aiServiceInstance = new MistralService(mistralKey, mistralModel);
  }
  return aiServiceInstance;
}

export function resetAIService(): void {
  aiServiceInstance = null;
}

export { MistralService } from './MistralService';
export * from './config';
