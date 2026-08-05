import seedGuides from '../data/guides.json';
import { TroubleshootingGuide } from '../types/guides';
import { normalizeGuide } from './guideUtils';

const STORAGE_KEY = 'techsteps_active_guides';

type Listener = () => void;

class GuideLibraryService {
  private guides: TroubleshootingGuide[] = [];
  private listeners = new Set<Listener>();
  private loaded = false;

  private load() {
    if (this.loaded) return;
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      // Migrate legacy editor storage
      if (!raw) {
        const legacy = localStorage.getItem('techsteps_guides');
        if (legacy) {
          raw = legacy;
          localStorage.removeItem('techsteps_guides');
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw) as TroubleshootingGuide[];
        this.guides = parsed.map((g) => normalizeGuide(g));
      } else {
        const seed = (seedGuides as TroubleshootingGuide[]).map((g) => normalizeGuide(g));
        this.guides = seed;
        this.persist();
      }
    } catch {
      this.guides = (seedGuides as TroubleshootingGuide[]).map((g) => normalizeGuide(g));
    }
    this.loaded = true;
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.guides));
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getAll(): TroubleshootingGuide[] {
    this.load();
    return [...this.guides];
  }

  getById(id: string): TroubleshootingGuide | undefined {
    this.load();
    return this.guides.find((g) => g.id === id);
  }

  save(guide: TroubleshootingGuide): TroubleshootingGuide {
    this.load();
    const normalized = normalizeGuide({
      ...guide,
      meta: { ...guide.meta, updated: new Date().toISOString() },
    });
    const idx = this.guides.findIndex((g) => g.id === normalized.id);
    if (idx >= 0) this.guides[idx] = normalized;
    else this.guides.unshift(normalized);
    this.persist();
    return normalized;
  }

  delete(id: string) {
    this.load();
    this.guides = this.guides.filter((g) => g.id !== id);
    this.persist();
  }

  /** Replace entire library (import) */
  replaceAll(guides: TroubleshootingGuide[]) {
    this.guides = guides.map((g) => normalizeGuide(g));
    this.persist();
  }

  exportJson(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  downloadExport(filename = 'guides.json') {
    const blob = new Blob([this.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Merge seed from bundled guides.json without wiping custom entries */
  mergeSeedFromFile() {
    this.load();
    const seed = (seedGuides as TroubleshootingGuide[]).map((g) => normalizeGuide(g));
    const byId = new Map(this.guides.map((g) => [g.id, g]));
    seed.forEach((g) => {
      if (!byId.has(g.id)) byId.set(g.id, g);
    });
    this.guides = Array.from(byId.values());
    this.persist();
  }

  refresh() {
    this.loaded = false;
    this.load();
    this.notify();
  }
}

export const guideLibraryService = new GuideLibraryService();
