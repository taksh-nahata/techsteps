import { FlashcardStep } from '../types/services';

export interface StoredGuide {
  id: string;
  messageId: string;
  title: string;
  steps: FlashcardStep[];
  createdAt: string;
}

const guidesKey = (userId: string) => `techsteps_guides_${userId}`;

function readAll(userId: string): Record<string, StoredGuide> {
  try {
    const raw = localStorage.getItem(guidesKey(userId));
    return raw ? (JSON.parse(raw) as Record<string, StoredGuide>) : {};
  } catch {
    return {};
  }
}

function writeAll(userId: string, guides: Record<string, StoredGuide>) {
  try {
    localStorage.setItem(guidesKey(userId), JSON.stringify(guides));
  } catch (e) {
    console.error('Failed to save guide:', e);
  }
}

export const GuideStorageService = {
  save(userId: string, guide: StoredGuide) {
    const all = readAll(userId);
    all[guide.id] = guide;
    writeAll(userId, all);
  },

  get(userId: string, guideId: string): StoredGuide | null {
    return readAll(userId)[guideId] ?? null;
  },

  getByMessageId(userId: string, messageId: string): StoredGuide | null {
    const all = readAll(userId);
    return Object.values(all).find((g) => g.messageId === messageId) ?? null;
  },

  remove(userId: string, guideId: string) {
    const all = readAll(userId);
    delete all[guideId];
    writeAll(userId, all);
  },
};
