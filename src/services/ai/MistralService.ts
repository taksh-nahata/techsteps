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

export class MistralService implements AIService {
    private apiKey: string;
    private model: string;
    private conversationHistory: Map<string, AIMessage[]> = new Map();

    constructor(apiKey?: string, model?: string) {
        this.apiKey = apiKey || FALLBACK_CONFIG.mistralKey;
        this.model = model || FALLBACK_CONFIG.mistralModel;
        if (!this.apiKey) {
            console.warn('MistralService initialized without an API key. Set VITE_MISTRAL_API_KEY in your env to enable AI features.');
        }
    }

    // Simple raw message to Mistral without JSON parsing (used for follow-up question generation)
    async sendRawMessage(message: string, systemPrompt: string, options?: { maxTokens?: number }): Promise<string> {
        try {
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    max_tokens: options?.maxTokens || 500
                })
            });

            if (!response.ok) {
                let errBody: any = null;
                try {
                    errBody = await response.json();
                } catch (jsonErr) {
                    try {
                        errBody = await response.text();
                    } catch (txtErr) {
                        errBody = response.statusText;
                    }
                }
                const statusMsg = `Status ${response.status} ${response.statusText}`;
                const detail = typeof errBody === 'string' ? errBody : JSON.stringify(errBody);
                throw new Error(`Mistral API Error: ${statusMsg} - ${detail}`);
            }

            const data = await response.json();
            const contentText = data?.choices?.[0]?.message?.content;
            if (!contentText) {
                throw new Error('Mistral API returned unexpected response shape');
            }
            return contentText;
        } catch (error) {
            console.error('Mistral sendRawMessage Error:', error);
            throw error;
        }
    }

    async sendMessage(message: string, context: ConversationContext): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            // Build facts context
            let factsPrefix = context.knownFacts && context.knownFacts.length > 0
                ? `KNOWN USER FACTS:\n${context.knownFacts.map(f => `- ${f}`).join('\n')}\n\n`
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

            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: GLOBAL_SYSTEM_PROMPT + '\n' + factsPrefix },
                        ...this.getHistoryForMistral(context),
                        { role: 'user', content: message }
                    ]
                })
            });

            if (!response.ok) {
                // Try to parse JSON error, but fallback to text if the response isn't JSON
                let errBody: any = null;
                try {
                    errBody = await response.json();
                } catch (jsonErr) {
                    try {
                        errBody = await response.text();
                    } catch (txtErr) {
                        errBody = response.statusText;
                    }
                }

                const statusMsg = `Status ${response.status} ${response.statusText}`;
                const detail = typeof errBody === 'string' ? errBody : JSON.stringify(errBody);
                throw new Error(`Mistral API Error: ${statusMsg} - ${detail}`);
            }

            const data = await response.json();
            // Be defensive about response shape
            let contentText: string | undefined;
            try {
                contentText = data?.choices?.[0]?.message?.content || data?.output?.[0]?.content || data?.content || (typeof data === 'string' ? data : undefined);
            } catch (e) {
                contentText = undefined;
            }
            if (!contentText) {
                throw new Error('Mistral API returned an unexpected response shape: ' + JSON.stringify(data).slice(0, 200));
            }

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
                    model: this.model,
                    tokens: data.usage?.total_tokens || data?.usage?.total_tokens || 0,
                    sources: ['Mistral AI'].concat(performedSearchResults.length ? ['WebSearch(DuckDuckGo)'] : [])
                }
            };
        } catch (error) {
            console.error('Mistral Service Error:', error);
            throw error;
        }
    }

    // New: detect whether a new incoming message changes topic compared to previous messages.
    async detectTopicChange(prevMessages: string[], newMessage: string): Promise<boolean> {
        try {
            const prompt = `
You are a topic-detection assistant. Given the previous conversation messages and a new user message, answer ONLY "YES" or "NO" (uppercase) indicating whether the new message starts a new topic or thread compared to the previous messages.

Previous messages:
${prevMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}

New message:
${newMessage}

Answer with a single word: YES or NO.
`;
            const raw = await this.sendRawMessage(prompt, GLOBAL_SYSTEM_PROMPT, { maxTokens: 30 });
            if (!raw) return false;
            const normalized = raw.trim().toUpperCase();
            if (normalized.startsWith('YES')) return true;
            if (normalized.startsWith('NO')) return false;
            if (/YES/i.test(raw)) return true;
            if (/NO/i.test(raw)) return false;
            return false;
        } catch (e) {
            console.warn('detectTopicChange failed defensively:', e);
            return false;
        }
    }

    // New: translate array of texts to target language and return array of translated strings.
    async translateTexts(texts: string[], targetLang: string): Promise<string[]> {
        try {
            const instruction = `
Translate the following JSON array of strings into ${targetLang}. Respond with a JSON array of translated strings only (no extra commentary).

Input:
${JSON.stringify(texts)}
`;
            const raw = await this.sendRawMessage(instruction, GLOBAL_SYSTEM_PROMPT, { maxTokens: 1000 });
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
    async getContextualHelp(): Promise<HelpContent> { return {} as any; }
    async trackInteractionQuality(): Promise<void> { }
    async getConversationHistory(): Promise<AIMessage[]> { return []; }
    async clearConversationHistory(): Promise<void> { }
}
