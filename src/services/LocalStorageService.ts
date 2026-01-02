import { Message } from './MemoryService';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string; // ISO
}

const CONVERSATIONS_KEY = (userId: string) => `conversations_${userId}`;
const CHAT_HISTORY_KEY = (userId: string) => `chatHistory_${userId}`;

export const LocalStorageService = {
  saveChatHistory: (userId: string, messages: Message[]) => {
    try {
      const serializedMessages = JSON.stringify(messages);
      localStorage.setItem(CHAT_HISTORY_KEY(userId), serializedMessages);
    } catch (error) {
      console.error('Error saving chat history to local storage:', error);
    }
  },

  getChatHistory: (userId: string): Message[] | null => {
    try {
      const serializedMessages = localStorage.getItem(CHAT_HISTORY_KEY(userId));
      if (serializedMessages === null) {
        return null;
      }
      const parsed = JSON.parse(serializedMessages) as Message[];
      return parsed.map(m => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp as any) : new Date()
      }));
    } catch (error) {
      console.error('Error getting chat history from local storage:', error);
      return null;
    }
  },

  // Conversations API (short-term saved sessions)
  saveConversations: (userId: string, conversations: Conversation[]) => {
    try {
      const serialized = JSON.stringify(conversations);
      localStorage.setItem(CONVERSATIONS_KEY(userId), serialized);
    } catch (e) {
      console.error('Error saving conversations:', e);
    }
  },

  getConversations: (userId: string): Conversation[] => {
    try {
      const raw = localStorage.getItem(CONVERSATIONS_KEY(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Conversation[];
      return parsed.map(c => ({
        ...c,
        createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString()
      }));
    } catch (e) {
      console.error('Error reading conversations:', e);
      return [];
    }
  },

  saveConversation: (userId: string, conversation: Conversation) => {
    try {
      const existing = LocalStorageService.getConversations(userId);
      existing.unshift(conversation);
      LocalStorageService.saveConversations(userId, existing);
      // cleanup older than retention
      LocalStorageService.cleanupOldConversations(userId);
    } catch (e) {
      console.error('Error saving conversation:', e);
    }
  },

  cleanupOldConversations: (userId: string, retentionDays = 14) => {
    try {
      const existing = LocalStorageService.getConversations(userId);
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      const filtered = existing.filter(c => {
        const created = new Date(c.createdAt).getTime();
        return created >= cutoff;
      });
      LocalStorageService.saveConversations(userId, filtered);
    } catch (e) {
      console.error('Error cleaning up conversations:', e);
    }
  }
};
