import {
    AIService,
    AIResponse,
    ConversationContext,
    PageContext,
    HelpContent,
    AIMessage,
    FlashcardStep
} from '../../types/services';
import { FALLBACK_CONFIG, GLOBAL_SYSTEM_PROMPT } from './config';
import { parseAIJSONResponse } from './responseParser';

export class GroqService implements AIService {
    private apiKey: string;
    private model: string;
    private conversationHistory: Map<string, AIMessage[]> = new Map();

    constructor(apiKey?: string, model?: string) {
        this.apiKey = apiKey || FALLBACK_CONFIG.groqKey;
        this.model = model || FALLBACK_CONFIG.groqModel;
    }

    async sendMessage(message: string, context: ConversationContext): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            // Build facts context
            const factsPrefix = context.knownFacts && context.knownFacts.length > 0
                ? `KNOWN USER FACTS:\n${context.knownFacts.map(f => `- ${f}`).join('\n')}\n\n`
                : "";

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: GLOBAL_SYSTEM_PROMPT + '\n' + factsPrefix },
                        ...this.getHistoryForGroq(context),
                        { role: 'user', content: message }
                    ],
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const contentText = data.choices[0].message.content;

            // Parse JSON response using unified parser
            const parsed = parseAIJSONResponse(contentText);

            const processingTime = Date.now() - startTime;
            const conversationId = this.getConversationId(context);

            this.updateHistory(conversationId, message, parsed.display_text);

            return {
                content: parsed.display_text,
                confidence: 0.9,
                suggestedActions: [],
                requiresHumanEscalation: false,
                extractedFacts: parsed.new_facts,
                spokenText: parsed.spoken_text,
                flashcards: parsed.flashcards,
                metadata: {
                    processingTime,
                    model: this.model,
                    tokens: data.usage?.total_tokens || 0,
                    sources: ['Groq (Llama 3)']
                }
            };
        } catch (error) {
            console.error('Groq Service Error:', error);
            throw error;
        }
    }

    private getHistoryForGroq(context: ConversationContext): any[] {
        const history = this.conversationHistory.get(this.getConversationId(context)) || [];
        return history.slice(-6).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    }

    private updateHistory(conversationId: string, userMsg: string, aiMsg: string) {
        const history = this.conversationHistory.get(conversationId) || [];
        history.push({ id: `u-${Date.now()}`, content: userMsg, sender: 'user', timestamp: new Date() });
        history.push({ id: `a-${Date.now()}`, content: aiMsg, sender: 'ai', timestamp: new Date() });
        if (history.length > 20) history.shift();
        this.conversationHistory.set(conversationId, history);
    }

    private getConversationId(context: ConversationContext): string {
        return `${context.currentPage || 'general'}-conversation`;
    }

    // Mandatory interface implementations
    async escalateToHuman(): Promise<void> { }
    async getContextualHelp(): Promise<HelpContent> { return {} as any; }
    async trackInteractionQuality(): Promise<void> { }
    async getConversationHistory(): Promise<AIMessage[]> { return []; }
    async clearConversationHistory(): Promise<void> { }
}
