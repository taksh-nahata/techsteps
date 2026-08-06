import { guideLibraryService } from './GuideLibraryService';

export interface CatalogedImage {
  imageUrl: string;
  caption: string;
  guideId: string;
  guideTitle: string;
  stepId: string;
  stepTitle: string;
  keywords: string[];
}

export class ImageLibraryService {
  private imageCache: CatalogedImage[] = [];

  private buildImageCache() {
    const guides = guideLibraryService.getAll();
    this.imageCache = [];

    for (const guide of guides) {
      for (const step of guide.steps) {
        if (step.image && step.imageCaption) {
          this.imageCache.push({
            imageUrl: step.image,
            caption: step.imageCaption,
            guideId: guide.id,
            guideTitle: guide.title,
            stepId: step.id,
            stepTitle: step.title,
            keywords: this.extractKeywords(step.imageCaption, guide.keywords),
          });
        }
      }
    }
  }

  private extractKeywords(caption: string, guideKeywords: string[]): string[] {
    const captionWords = caption
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3);
    return Array.from(new Set([...captionWords, ...guideKeywords.map((k) => k.toLowerCase())]));
  }

  private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1.map((k) => k.toLowerCase()));
    const set2 = new Set(keywords2.map((k) => k.toLowerCase()));
    let matches = 0;
    set1.forEach((word) => {
      if (set2.has(word)) matches++;
    });
    const unionSize = set1.size + set2.size - matches;
    return unionSize > 0 ? matches / unionSize : 0;
  }

  findMatchingImages(query: string, limit = 5): CatalogedImage[] {
    this.buildImageCache();
    const queryKeywords = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3);

    return this.imageCache
      .map((img) => ({ image: img, score: this.calculateSimilarity(queryKeywords, img.keywords) }))
      // 0.1 Jaccard similarity is barely more than chance overlap -- it was letting
      // through images for a different device or a loosely-related step just
      // because a couple of generic words (like "settings" or "tap") matched.
      .filter((item) => item.score > 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.image);
  }

  findByCaption(caption: string): CatalogedImage | null {
    this.buildImageCache();
    const normalized = caption.toLowerCase().trim();
    return this.imageCache.find((img) => img.caption.toLowerCase().trim() === normalized) ?? null;
  }

  getImagesByCategory(category: string): CatalogedImage[] {
    this.buildImageCache();
    const ids = guideLibraryService
      .getAll()
      .filter((g) => g.category.toLowerCase() === category.toLowerCase())
      .map((g) => g.id);
    return this.imageCache.filter((img) => ids.includes(img.guideId));
  }

  suggestImagesForStep(stepContent: string, stepTitle: string): CatalogedImage[] {
    return this.findMatchingImages(`${stepTitle} ${stepContent}`, 3);
  }

  getAllImages(): CatalogedImage[] {
    this.buildImageCache();
    return this.imageCache;
  }

  refresh() {
    guideLibraryService.refresh();
    this.buildImageCache();
  }
}

export const imageLibraryService = new ImageLibraryService();

guideLibraryService.subscribe(() => imageLibraryService.refresh());
