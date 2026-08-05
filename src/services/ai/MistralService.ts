import {
    AIService,
    AIResponse,
    ConversationContext,
    AIMessage,
    HelpContent,
    PageContext
} from '../../types/services';
import { FALLBACK_CONFIG, DEFAULT_GEMINI_CONFIG, GROQ_CONFIG, GLOBAL_SYSTEM_PROMPT } from './config';
import { parseAIJSONResponse } from './responseParser';
import { guideMatchingService } from '../GuideMatchingService';
import { imageLibraryService } from '../ImageLibraryService';
import { guideToFlashcardSteps } from '../guideUtils';
import { detectGuideDevice, GuideDeviceType } from '../../utils/deviceDetection';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class MistralService implements AIService {
    private apiKey: string;
    private model: string;
    private groqKey: string;
    private groqModel: string;
    private geminiKey: string;
    private geminiModel: string;
    private conversationHistory: Map<string, AIMessage[]> = new Map();

    constructor(apiKey?: string, model?: string) {
        this.groqKey = GROQ_CONFIG.apiKey;
        this.groqModel = GROQ_CONFIG.model;
        this.apiKey = apiKey || FALLBACK_CONFIG.mistralKey;
        this.model = model || FALLBACK_CONFIG.mistralModel;
        this.geminiKey = DEFAULT_GEMINI_CONFIG.apiKey;
        this.geminiModel = 'gemini-flash-latest';
        if (!this.groqKey && !this.apiKey && !this.geminiKey) {
            console.warn('No AI keys configured. Set VITE_GROQ_API_KEY (primary), or VITE_MISTRAL_API_KEY / VITE_GEMINI_API_KEY.');
        }
    }

    /** Groq — primary provider (OpenAI-compatible). */
    private async groqCompletion(
        messages: ChatMessage[],
        maxTokens = GROQ_CONFIG.maxTokens,
        jsonMode = false
    ): Promise<string> {
        if (!this.groqKey) throw new Error('No Groq API key; set VITE_GROQ_API_KEY.');

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.groqKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.groqModel,
                messages,
                max_tokens: maxTokens,
                temperature: GROQ_CONFIG.temperature,
                ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
            }),
        });

        if (!res.ok) {
            const detail = await res.text().catch(() => res.statusText);
            throw new Error(`Groq API Error: ${res.status} - ${detail}`);
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) throw new Error('Groq returned empty content');
        return text;
    }

    /** Provider chain: Groq → Mistral → Gemini. */
    private async chatCompletion(
        systemContent: string,
        history: Array<{ role: string; content: string }>,
        userMessage: string,
        maxTokens?: number,
        jsonMode = false
    ): Promise<{ text: string; provider: string; model: string }> {
        const messages: ChatMessage[] = [
            { role: 'system', content: systemContent },
            ...history.map((m) => ({
                role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
                content: m.content,
            })),
            { role: 'user', content: userMessage },
        ];

        if (this.groqKey) {
            try {
                const text = await this.groqCompletion(messages, maxTokens || GROQ_CONFIG.maxTokens, jsonMode);
                return { text, provider: 'Groq', model: this.groqModel };
            } catch (e) {
                console.warn('Groq failed, trying next provider:', e);
            }
        }

        if (this.apiKey) {
            try {
                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages,
                        max_tokens: maxTokens || 2048,
                    }),
                });
                if (!response.ok) throw new Error(`Mistral ${response.status}`);
                const data = await response.json();
                const text = data?.choices?.[0]?.message?.content;
                if (!text) throw new Error('Mistral empty response');
                return { text, provider: 'Mistral AI', model: this.model };
            } catch (e) {
                console.warn('Mistral failed, trying Gemini:', e);
            }
        }

        const text = await this.geminiCompletion(systemContent, history, userMessage, maxTokens);
        return { text, provider: 'Google Gemini', model: this.geminiModel };
    }

    /**
     * Google Gemini completion used as a fallback provider.
     * Maps the OpenAI-style {role, content} history into Gemini's contents format.
     */
    private async geminiCompletion(
        systemContent: string,
        history: Array<{ role: string; content: string }>,
        userMessage: string,
        maxTokens?: number
    ): Promise<string> {
        if (!this.geminiKey) {
            throw new Error('No Gemini API key configured for fallback (set VITE_GEMINI_API_KEY).');
        }

        const contents = [
            ...history.map(m => ({
                role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })),
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemContent }] },
                    contents,
                    generationConfig: maxTokens ? { maxOutputTokens: maxTokens } : undefined
                })
            }
        );

        if (!res.ok) {
            let errBody: any = null;
            try { errBody = await res.json(); } catch { errBody = await res.text().catch(() => res.statusText); }
            const detail = typeof errBody === 'string' ? errBody : JSON.stringify(errBody);
            throw new Error(`Gemini API Error: Status ${res.status} ${res.statusText} - ${detail}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
        if (!text) {
            throw new Error('Gemini API returned an unexpected response shape: ' + JSON.stringify(data).slice(0, 200));
        }
        return text;
    }

    // Simple raw message without JSON parsing (used for follow-up question generation).
    // Tries Mistral first, automatically falls back to Gemini on missing key / error.
    async sendRawMessage(message: string, systemPrompt: string, options?: { maxTokens?: number }): Promise<string> {
        const { text } = await this.chatCompletion(systemPrompt, [], message, options?.maxTokens || 500);
        return text;
    }

    async sendMessage(message: string, context: ConversationContext): Promise<AIResponse> {
        const startTime = Date.now();

        // ========== GUIDE MATCHING - Check for existing guides first ==========
        const existingMatch = guideMatchingService.findBestMatch(message, 0.5);
        if (existingMatch && existingMatch.score > 0.6) {
            console.log(`📚 [Mistral] Found matching guide: "${existingMatch.guide.title}" (${Math.round(existingMatch.score * 100)}% match)`);

            const device: GuideDeviceType =
              (context.guideDeviceType as GuideDeviceType) || detectGuideDevice();

            const flashcards = guideToFlashcardSteps(existingMatch.guide, device).map((card, index) => {
                const step = existingMatch.guide.steps[index];
                const suggestedImages = imageLibraryService.suggestImagesForStep(step.content, step.title);
                const imageUrl = step.image || (suggestedImages.length > 0 ? suggestedImages[0].imageUrl : undefined);

                return {
                    ...card,
                    image: imageUrl ?? card.image,
                    imageCaption: step.imageCaption ?? card.imageCaption,
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

        // ========== No match found - Generate with Mistral AI ==========
        try {
            // Build facts context
            let factsPrefix = context.knownFacts && context.knownFacts.length > 0
                ? `KNOWN USER FACTS:\n${context.knownFacts.map((f: string) => `- ${f}`).join('\n')}\n\n`
                : "";

            // Optional web search trigger: messages starting with "search: <query>" or containing "search the web for"
            let performedSearchResults: string[] = [];
            const searchPrefixMatch = message.trim().match(/^search:\s*(.+)$/i);
            if (searchPrefixMatch || /search the web for/i.test(message)) {
                const query = searchPrefixMatch ? searchPrefixMatch[1] : message.replace(/.*search the web for/i, '').trim();
                try {
                    performedSearchResults = await this.webSearch(query);
                    if (performedSearchResults.length > 0) {
                        factsPrefix = `WEB SEARCH RESULTS (top snippets):\n${performedSearchResults.map(r => `- ${r}`).join('\n')}\n\n` + factsPrefix;
                        message = `Please synthesize the following search results and answer the user's original question: ${query}`;
                    }
                } catch (err) {
                    console.warn('Web search failed:', err);
                }
            }

            const systemContent = GLOBAL_SYSTEM_PROMPT + '\n' + factsPrefix;
            const history = this.getHistoryForMistral(context);

            const { text: contentText, provider: usedProvider, model: usedModel } =
                await this.chatCompletion(systemContent, history, message, GROQ_CONFIG.maxTokens, true);
            const usedTokens = 0;

            // Parse JSON response using unified parser
            const parsed = parseAIJSONResponse(contentText);

            const processingTime = Date.now() - startTime;
            const conversationId = this.getConversationId(context);

            this.updateHistory(conversationId, message, parsed.display_text);

            return {
                content: parsed.display_text,
                confidence: 0.8,
                suggestedActions: [],
                requiresHumanEscalation: false,
                extractedFacts: parsed.new_facts,
                spokenText: parsed.spoken_text,
                flashcards: parsed.flashcards,
                metadata: {
                    processingTime,
                    model: usedModel,
                    tokens: usedTokens,
                    sources: [usedProvider].concat(performedSearchResults.length ? ['WebSearch(DuckDuckGo)'] : [])
                }
            };
        } catch (error) {
            console.error('Mistral Service Error:', error);
            throw error;
        }
    }

    // New: detect whether a new incoming message changes topic compared to previous messages.
    async detectTopicChange(_prevMessages: string[], _newMessage: string): Promise<boolean> {
        return false;
    }

    // New: translate array of texts to target language and return array of translated strings.
    async translateTexts(texts: string[], targetLang: string): Promise<string[]> {
        if (!targetLang || targetLang === 'en') return texts;
        try {
            const instruction = `Translate this JSON array into ${targetLang}. Return ONLY a JSON array of strings.\n${JSON.stringify(texts)}`;
            const raw = await this.sendRawMessage(instruction, 'You are a translator. Output JSON array only.', { maxTokens: 800 });
            const jsonStart = raw.indexOf('[');
            const jsonEnd = raw.lastIndexOf(']');
            if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
                const candidate = raw.slice(jsonStart, jsonEnd + 1);
                try {
                    const parsed = JSON.parse(candidate);
                    if (Array.isArray(parsed)) return parsed.map(String);
                } catch (e) {
                    // fallthrough
                }
            }
            const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length === texts.length) return lines;
            return texts;
        } catch (e) {
            console.warn('translateTexts error:', e);
            return texts;
        }
    }

    private getHistoryForMistral(context: ConversationContext): any[] {
        const history = this.conversationHistory.get(this.getConversationId(context)) || [];
        return history.slice(-4).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    }

    // Lightweight web search using DuckDuckGo Instant Answer API (no API key required)
    private async webSearch(query: string): Promise<string[]> {
        try {
            const encoded = encodeURIComponent(query);
            const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const json = await res.json();
            const snippets: string[] = [];
            if (json.AbstractText) snippets.push(json.AbstractText);
            if (Array.isArray(json.RelatedTopics)) {
                for (const item of json.RelatedTopics.slice(0, 5)) {
                    if (item.Text) snippets.push(item.Text);
                    else if (item.Topics && item.Topics[0] && item.Topics[0].Text) snippets.push(item.Topics[0].Text);
                }
            }
            return snippets.slice(0, 5).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
        } catch (e) {
            console.warn('DuckDuckGo search error', e);
            return [];
        }
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
    async getContextualHelp(_pageContext: PageContext): Promise<HelpContent> { return {} as HelpContent; }
    async trackInteractionQuality(): Promise<void> { }
    async getConversationHistory(): Promise<AIMessage[]> { return []; }
    async clearConversationHistory(): Promise<void> { }
}
