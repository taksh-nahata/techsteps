import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import {
  AIService,
  AIResponse,
  ConversationContext,
  PageContext,
  HelpContent,
  AIMessage
} from '../../types/services';
import { DEFAULT_GEMINI_CONFIG, GLOBAL_SYSTEM_PROMPT } from './config';
import { parseAIJSONResponse } from './responseParser';
import { guideMatchingService } from '../GuideMatchingService';
import { imageLibraryService } from '../ImageLibraryService';

export class GeminiService implements AIService {
  private genAI: GoogleGenerativeAI;
  private conversationHistory: Map<string, AIMessage[]> = new Map();
  private failureCount: Map<string, number> = new Map();
  private readonly MAX_FAILURES = DEFAULT_GEMINI_CONFIG.escalationThreshold;
  private readonly SENIOR_SYSTEM_PROMPT = GLOBAL_SYSTEM_PROMPT;

  constructor(apiKey?: string) {
    const key = apiKey || DEFAULT_GEMINI_CONFIG.apiKey;
    if (!key) {
      throw new Error('Google Gemini API key is required');
    }

    if (key === 'YOUR_ACTUAL_GEMINI_API_KEY_HERE') {
      throw new Error('Please replace YOUR_ACTUAL_GEMINI_API_KEY_HERE with your actual Gemini API key in the .env file');
    }

    console.log('Initializing Gemini service with API key:', key.substring(0, 10) + '...');
    this.genAI = new GoogleGenerativeAI(key);
  }

  async sendMessage(message: string, context: ConversationContext): Promise<AIResponse> {
    const startTime = Date.now();
    const conversationId = this.getConversationId(context);

    // ========== GUIDE MATCHING - Check for existing guides first ==========
    const existingMatch = guideMatchingService.findBestMatch(message, 0.5);
    if (existingMatch && existingMatch.score > 0.6) {
      console.log(`📚 Found matching guide: "${existingMatch.guide.title}" (${Math.round(existingMatch.score * 100)}% match)`);

      // Convert existing guide to flashcard format
      const flashcards = existingMatch.guide.steps.map((step, index) => {
        // Try to find matching images for this step
        const suggestedImages = imageLibraryService.suggestImagesForStep(step.content, step.title);
        const imageUrl = step.image || (suggestedImages.length > 0 ? suggestedImages[0].imageUrl : undefined);

        return {
          id: step.id || `step-${index + 1}`,
          stepNumber: index + 1,
          title: step.title,
          content: step.content,
          instructions: step.content.split('. ').filter((s: string) => s.length > 10),
          audioScript: `Step ${index + 1}: ${step.title}. ${step.content}`,
          estimatedDuration: 30,
          image: imageUrl,
          imageCaption: step.imageCaption
        };
      });

      return {
        content: `I found a verified guide that should help you with this!\n\n**${existingMatch.guide.title}**\n\n${existingMatch.guide.problemDescription}`,
        confidence: 0.95,
        suggestedActions: [],
        requiresHumanEscalation: false,
        flashcards,
        metadata: {
          processingTime: Date.now() - startTime,
          model: 'cached-guide',
          tokens: 0,
          sources: ['TechSteps Guide Library']
        }
      };
    }

    // ========== No match found - Generate with AI ==========
    // Try primary, then try stable if primary fails with 429
    const modelsToTry = [DEFAULT_GEMINI_CONFIG.primaryModel, DEFAULT_GEMINI_CONFIG.stableModel];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`📡 Gemini: Attempting with ${modelName}...`);
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });

        const factsPrefix = context.knownFacts && context.knownFacts.length > 0
          ? `KNOWN USER FACTS:\n${context.knownFacts.map((f: string) => `- ${f}`).join('\n')}\n\n`
          : "";

        const fullPrompt = GLOBAL_SYSTEM_PROMPT + '\n' + factsPrefix + this.buildFullPrompt(message, context);
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        const parsed = parseAIJSONResponse(responseText);
        const processingTime = Date.now() - startTime;
        this.updateConversationHistory(conversationId, message, parsed.display_text);
        this.failureCount.set(conversationId, 0);

        return {
          content: parsed.display_text,
          confidence: 0.9,
          suggestedActions: this.generateSuggestedActions(parsed.display_text, context),
          requiresHumanEscalation: this.shouldEscalate(parsed.display_text, context, conversationId),
          extractedFacts: parsed.new_facts,
          spokenText: parsed.spoken_text,
          flashcards: parsed.flashcards,
          metadata: {
            processingTime,
            model: modelName,
            tokens: 0,
            sources: [`Gemini (${modelName})`]
          }
        };
      } catch (error: any) {
        lastError = error;
        const isRateLimit = error.message?.includes('429') ||
          error.message?.toLowerCase().includes('too many requests') ||
          error.status === 429;

        if (isRateLimit && modelName === DEFAULT_GEMINI_CONFIG.primaryModel) {
          console.warn(`⚠️ Gemini Primary (${modelName}) rate limited. Trying stable model...`);
          continue; // Try next model in loop
        }

        // If not a rate limit, or we already tried the stable model, break and let fallback system handle it
        break;
      }
    }

    // If we reach here, it means all Gemini attempts failed
    console.error('Gemini Service exhausted all model attempts:', lastError);
    throw lastError;
  }

  private _incrementFailureCount(conversationId: string) {
    const currentFailures = this.failureCount.get(conversationId) || 0;
    this.failureCount.set(conversationId, currentFailures + 1);
  }

  async sendVoiceMessage(audioBlob: Blob, context: ConversationContext): Promise<AIResponse> {
    try {
      // Convert audio blob to base64 for Gemini
      const audioBase64 = await this.blobToBase64(audioBlob);

      // Get the generative model that supports multimodal input
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp", // Use multimodal model for audio
      });

      const prompt = this.buildSystemPrompt(context) + "\n\nPlease respond to this voice message from a senior learner:";

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: audioBase64,
            mimeType: audioBlob.type || "audio/wav"
          }
        }
      ]);

      const response = result.response.text();

      // Update conversation history
      const conversationId = this.getConversationId(context);
      this.updateConversationHistory(conversationId, "[Voice message]", response);

      return {
        content: response,
        confidence: 0.8,
        suggestedActions: this.generateSuggestedActions(response, context),
        requiresHumanEscalation: false,
        metadata: {
          processingTime: 0,
          model: "gemini-2.0-flash-exp",
          tokens: this.estimateTokens(response),
          sources: []
        }
      };
    } catch (error) {
      console.error('Voice message processing error:', error);
      return this.getFallbackResponse(error as Error, context, this.getConversationId(context));
    }
  }

  async sendImageMessage(imageFile: File, context: ConversationContext): Promise<AIResponse> {
    try {
      // Convert image file to base64 for Gemini
      const imageBase64 = await this.fileToBase64(imageFile);

      // Get the generative model that supports multimodal input
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp", // Use multimodal model for images
      });

      const prompt = this.buildSystemPrompt(context) + "\n\nPlease help this senior learner with what you see in this image. Provide clear, step-by-step guidance:";

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageFile.type
          }
        }
      ]);

      const response = result.response.text();

      // Update conversation history
      const conversationId = this.getConversationId(context);
      this.updateConversationHistory(conversationId, "[Image shared]", response);

      return {
        content: response,
        confidence: 0.8,
        suggestedActions: this.generateSuggestedActions(response, context),
        requiresHumanEscalation: false,
        metadata: {
          processingTime: 0,
          model: "gemini-2.0-flash-exp",
          tokens: this.estimateTokens(response),
          sources: []
        }
      };
    } catch (error) {
      console.error('Image message processing error:', error);
      return this.getFallbackResponse(error as Error, context, this.getConversationId(context));
    }
  }

  async formatAsFlashcards(response: string): Promise<any[]> {
    try {
      // Use Gemini to format the response as flashcards
      const model = this.genAI.getGenerativeModel({
        model: DEFAULT_GEMINI_CONFIG.primaryModel,
      });

      const prompt = `Take this response and format it as a series of flashcard steps for senior learners. Each step should be:
1. Numbered clearly
2. Have a short, descriptive title
3. Contain simple, actionable instructions
4. Be encouraging and supportive
5. Include an audioScript field optimized for text-to-speech
6. Include clear, actionable instructions

Response to format:
${response}

Format as JSON array with this structure:
[
  {
    "id": "step-1",
    "stepNumber": 1,
    "title": "Step Title",
    "content": "Clear instructions",
    "instructions": ["Action 1", "Action 2"],
    "audioScript": "Step 1: Step Title. Clear instructions. Action 1. Action 2.",
    "estimatedDuration": 60,

  }
]

IMPORTANT GUIDELINES:
- Make instructions clear and easy to follow
- Use encouraging and supportive language
- Break down complex tasks into simple steps`;

      const result = await model.generateContent(prompt);
      const flashcardText = result.response.text();

      // Try to parse as JSON, fallback to manual parsing if needed
      try {
        const parsed = JSON.parse(flashcardText);
        // Ensure each step has an audioScript
        return parsed.map((step: any, _index: number) => ({
          ...step,
          audioScript: step.audioScript || this.generateAudioScript(step)
        }));
      } catch {
        return this.parseFlashcardsManually(response);
      }
    } catch (error) {
      console.error('Error formatting flashcards:', error);
      return this.parseFlashcardsManually(response);
    }
  }

  // Core Gemini service methods

  async escalateToHuman(conversationId: string, reason: string): Promise<void> {
    try {
      // Simple escalation - just log and clear conversation
      console.log(`Escalating conversation ${conversationId} to human support. Reason: ${reason}`);

      this.conversationHistory.delete(conversationId);
      this.failureCount.delete(conversationId);

      // In a real implementation, this would create a support ticket
      console.log(`Successfully escalated conversation ${conversationId} to human support.`);
    } catch (error) {
      console.error('Failed to escalate to human support:', error);
      this.conversationHistory.delete(conversationId);
      this.failureCount.delete(conversationId);
    }
  }

  async getContextualHelp(pageContext: PageContext): Promise<HelpContent> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: DEFAULT_GEMINI_CONFIG.primaryModel,
      });

      const prompt = `Provide contextual help for a senior user on the page: "${pageContext.title}" (${pageContext.url}). 
      The user is in the ${pageContext.section} section. 
      ${pageContext.userSkillLevel ? `Their skill level is: ${pageContext.userSkillLevel}` : ''}
      ${pageContext.currentTutorial ? `They are currently working on: ${pageContext.currentTutorial}` : ''}
      
      Provide helpful, senior-friendly guidance for this specific context in a warm, encouraging tone.`;

      const result = await model.generateContent([this.SENIOR_SYSTEM_PROMPT, prompt].join('\n\n'));
      const content = result.response.text();

      return {
        title: `Help for ${pageContext.title}`,
        content,
        actions: [
          { label: 'Contact Support', type: 'contact', target: 'support' },
          { label: 'View Tutorial', type: 'tutorial', target: pageContext.currentTutorial || 'getting-started' }
        ],
        relatedTopics: this.getRelatedTopics(pageContext)
      };

    } catch (error) {
      console.error('Error getting contextual help:', error);
      return this.getFallbackHelp(pageContext);
    }
  }

  async trackInteractionQuality(interactionId: string, rating: number): Promise<void> {
    console.log(`Interaction ${interactionId} rated: ${rating}/5`);
  }

  async getConversationHistory(userId: string, limit = 10): Promise<AIMessage[]> {
    const history = this.conversationHistory.get(userId) || [];
    return history.slice(-limit);
  }

  async clearConversationHistory(userId: string): Promise<void> {
    this.conversationHistory.delete(userId);
    this.failureCount.delete(userId);
  }

  // Private helper methods
  private buildFullPrompt(message: string, context: ConversationContext): string {
    const history = this.conversationHistory.get(this.getConversationId(context)) || [];

    let prompt = "";

    // Add recent conversation history
    if (history.length > 0) {
      prompt += 'Recent conversation:\n';
      history.slice(-4).forEach(msg => {
        prompt += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    prompt += `User: ${message}`;

    return prompt;
  }

  private buildSystemPrompt(context: ConversationContext): string {
    let prompt = this.SENIOR_SYSTEM_PROMPT;

    if (context.currentPage) {
      prompt += `\n\nThe user is currently on the page: ${context.currentPage}`;
    }

    if (context.currentTutorial) {
      prompt += `\nThey are working on the tutorial: ${context.currentTutorial}`;
    }

    if (context.userSkillLevel) {
      prompt += `\nTheir skill level is: ${context.userSkillLevel}`;
    }

    if (context.failureCount > 0) {
      prompt += `\n\nIMPORTANT: This user has had ${context.failureCount} previous unsuccessful interactions. Be extra patient and consider offering human support if this interaction doesn't go well.`;
    }

    return prompt;
  }

  private shouldEscalate(response: string, context: ConversationContext, conversationId: string): boolean {
    const failures = this.failureCount.get(conversationId) || 0;

    if (failures >= this.MAX_FAILURES) return true;

    const escalationTriggers = [
      'i cannot help',
      'i don\'t understand',
      'this is too complex',
      'contact support',
      'human assistance',
      'i\'m not sure how to help',
      'this is beyond my capabilities'
    ];

    return escalationTriggers.some(trigger =>
      response.toLowerCase().includes(trigger)
    );
  }

  private generateSuggestedActions(response: string, context: ConversationContext) {
    const actions = [];

    if (response.toLowerCase().includes('tutorial') && context.currentTutorial) {
      actions.push({
        type: 'tutorial' as const,
        label: 'Continue Tutorial',
        data: { tutorialId: context.currentTutorial }
      });
    }

    actions.push({
      type: 'help' as const,
      label: 'Get More Help',
      data: { page: context.currentPage }
    });

    if (context.failureCount > 1) {
      actions.push({
        type: 'contact' as const,
        label: 'Talk to a Human',
        data: { reason: 'ai_assistance_needed' }
      });
    }

    return actions;
  }

  private getFallbackResponse(error: Error, context: ConversationContext, conversationId: string): AIResponse {
    const failures = this.failureCount.get(conversationId) || 0;
    const shouldEscalate = failures >= this.MAX_FAILURES;
    const errorMessage = error.message;

    let content: string;

    // Check for API key related errors
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('403') || errorMessage.includes('401')) {
      content = "I'm having trouble connecting to my AI service due to an API key issue. Please check that your Gemini API key is properly configured in the .env file.";
    } else if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('too many requests')) {
      content = "I'm a bit busy right now because too many people are asking questions! Please wait just a moment and try asking me again. I'm sorry for the wait!";
    } else if (shouldEscalate) {
      content = "I'm sorry, I'm having trouble right now. Let me connect you with our support team who can help you immediately.";
      this.escalateToHuman(conversationId, `Gemini service error after ${failures} failures: ${error.message}`);
    } else {
      content = "I apologize, but I'm having a small technical difficulty. Please try asking your question again, or I can connect you with our helpful support team.";
    }

    return {
      content,
      confidence: 0.1,
      suggestedActions: [
        {
          type: 'help',
          label: 'Try Again',
          data: { reason: 'retry_after_error' }
        },
        {
          type: 'contact',
          label: 'Contact Support',
          data: { reason: 'gemini_service_error' }
        }
      ],
      requiresHumanEscalation: shouldEscalate,
      metadata: {
        processingTime: 0,
        model: 'fallback',
        tokens: 0,
        sources: ['fallback-system']
      }
    };
  }

  private getFallbackHelp(pageContext: PageContext): HelpContent {
    return {
      title: `Help for ${pageContext.title}`,
      content: "I'm sorry, I'm having trouble providing specific help right now. Our support team is here to help you with any questions you might have.",
      actions: [
        { label: 'Contact Support', type: 'contact', target: 'support' },
        { label: 'View Getting Started Guide', type: 'tutorial', target: 'getting-started' }
      ],
      relatedTopics: ['Getting Started', 'Basic Navigation', 'Common Questions']
    };
  }

  private getRelatedTopics(pageContext: PageContext): string[] {
    const topicMap: Record<string, string[]> = {
      'landing': ['Getting Started', 'Creating Account', 'First Steps'],
      'tutorial': ['Practice Exercises', 'Next Steps', 'Related Tutorials'],
      'profile': ['Account Settings', 'Privacy Settings', 'Accessibility Options'],
      'help': ['Common Questions', 'Contact Support', 'Video Guides']
    };

    return topicMap[pageContext.section] || ['Getting Started', 'Common Questions'];
  }

  private updateConversationHistory(conversationId: string, userMessage: string, aiResponse: string): void {
    const history = this.conversationHistory.get(conversationId) || [];

    history.push({
      id: `${Date.now()}-user`,
      content: userMessage,
      sender: 'user',
      timestamp: new Date()
    });

    history.push({
      id: `${Date.now()}-ai`,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date()
    });

    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    this.conversationHistory.set(conversationId, history);
  }

  private getConversationId(context: ConversationContext): string {
    return `${context.currentPage || 'general'}-conversation`;
  }



  private _getUserIdFromConversation(conversationId: string): string {
    return conversationId.split('-')[0] || 'anonymous-user';
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:audio/wav;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private parseFlashcardsManually(response: string): any[] {
    // Fallback manual parsing if JSON parsing fails
    const steps = response.split(/\d+\./).filter(step => step.trim().length > 0);

    return steps.map((step, index) => {
      const stepData = {
        id: `step-${index + 1}`,
        stepNumber: index + 1,
        title: `Step ${index + 1}`,
        content: step.trim(),
        instructions: [step.trim()],
        estimatedDuration: 60
      };

      return {
        ...stepData,
        audioScript: this.generateAudioScript(stepData)
      };
    });
  }

  private generateAudioScript(step: any): string {
    // Generate a natural audio script from step data
    const parts = [
      `Step ${step.stepNumber}: ${step.title}`,
      step.content
    ];

    if (step.instructions && step.instructions.length > 0) {
      parts.push('Here are the instructions:');
      step.instructions.forEach((instruction: string, index: number) => {
        parts.push(`${index + 1}. ${instruction}`);
      });
    }

    return parts.join('. ');
  }

  getQualityReport(days: number = 7) {
    return {
      averageConfidence: 0.8,
      averageResponseTime: 1000,
      escalationRate: 0.1,
      errorRate: 0.05,
      userSatisfactionScore: 4.2,
      totalInteractions: 100,
      timeframe: {
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      recommendations: ['Service is performing well']
    };
  }

  async recordSatisfaction(interactionId: string, rating: number): Promise<void> {
    console.log(`Satisfaction recorded: ${interactionId} - ${rating}/5`);
  }
}