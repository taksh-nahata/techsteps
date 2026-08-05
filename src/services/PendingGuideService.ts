import { MemoryService } from './MemoryService';
import { normalizeGuide } from './guideUtils';
import { TroubleshootingGuide } from '../types/guides';

/** Loads pending guides without parsing the 11MB discovery batch on every page load. */
export const PendingGuideService = {
  async loadFromFirestore(): Promise<TroubleshootingGuide[]> {
    try {
      const data = await MemoryService.getFirebasePendingGuides();
      return data.map((g) => normalizeGuide(g));
    } catch {
      return [];
    }
  },

  async loadSampleBatch(): Promise<TroubleshootingGuide[]> {
    try {
      const res = await fetch('/data/pending_sample.json?t=' + Date.now());
      if (!res.ok) return [];
      const data = (await res.json()) as TroubleshootingGuide[];
      return data.map((g) => normalizeGuide(g));
    } catch {
      return [];
    }
  },

  async importFromFile(file: File): Promise<TroubleshootingGuide[]> {
    const text = await file.text();
    const data = JSON.parse(text) as TroubleshootingGuide[] | TroubleshootingGuide;
    const list = Array.isArray(data) ? data : [data];
    return list.map((g) => normalizeGuide(g));
  },
};
