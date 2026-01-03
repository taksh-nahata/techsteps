/**
 * ImageLibraryService
 * 
 * Catalogs and retrieves images based on their captions.
 * Allows AI to reuse existing images when generating new flashcards.
 */

import guidesData from '../data/guides.json';
import { TroubleshootingGuide } from '../types/guides';

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
    private initialized = false;

    constructor() {
        this.buildImageCache();
    }

    /**
     * Build the image cache from all guides
     */
    private buildImageCache() {
        const guides = guidesData as TroubleshootingGuide[];
        this.imageCache = [];

        for (const guide of guides) {
            if (!guide.steps) continue;

            for (const step of guide.steps) {
                if (step.image && step.imageCaption) {
                    this.imageCache.push({
                        imageUrl: step.image,
                        caption: step.imageCaption,
                        guideId: guide.id,
                        guideTitle: guide.title,
                        stepId: step.id,
                        stepTitle: step.title,
                        keywords: this.extractKeywords(step.imageCaption, guide.keywords)
                    });
                }
            }
        }

        this.initialized = true;
        console.log(`📸 ImageLibrary: Cataloged ${this.imageCache.length} images with captions`);
    }

    /**
     * Extract keywords from caption and combine with guide keywords
     */
    private extractKeywords(caption: string, guideKeywords: string[]): string[] {
        // Simple keyword extraction: split by spaces, filter short words
        const captionWords = caption.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);

        const combined = new Set([...captionWords, ...guideKeywords.map(k => k.toLowerCase())]);
        return Array.from(combined);
    }

    /**
     * Calculate similarity between two keyword sets
     */
    private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
        const set1 = new Set(keywords1.map(k => k.toLowerCase()));
        const set2 = new Set(keywords2.map(k => k.toLowerCase()));

        let matches = 0;
        set1.forEach(word => {
            if (set2.has(word)) matches++;
        });

        const unionSize = set1.size + set2.size - matches;
        return unionSize > 0 ? matches / unionSize : 0;
    }

    /**
     * Find images that match a query or context
     */
    findMatchingImages(query: string, limit: number = 5): CatalogedImage[] {
        if (!this.initialized) this.buildImageCache();

        const queryKeywords = query.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);

        const scored = this.imageCache.map(img => ({
            image: img,
            score: this.calculateSimilarity(queryKeywords, img.keywords)
        }));

        return scored
            .filter(item => item.score > 0.1)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.image);
    }

    /**
     * Find image by exact caption match
     */
    findByCaption(caption: string): CatalogedImage | null {
        const normalized = caption.toLowerCase().trim();
        return this.imageCache.find(img =>
            img.caption.toLowerCase().trim() === normalized
        ) || null;
    }

    /**
     * Get images for a specific topic/category
     */
    getImagesByCategory(category: string): CatalogedImage[] {
        const guides = guidesData as TroubleshootingGuide[];
        const categoryGuideIds = guides
            .filter(g => g.category.toLowerCase() === category.toLowerCase())
            .map(g => g.id);

        return this.imageCache.filter(img => categoryGuideIds.includes(img.guideId));
    }

    /**
     * Suggest images for new flashcard steps based on step content
     */
    suggestImagesForStep(stepContent: string, stepTitle: string): CatalogedImage[] {
        const combined = `${stepTitle} ${stepContent}`;
        return this.findMatchingImages(combined, 3);
    }

    /**
     * Get all cataloged images
     */
    getAllImages(): CatalogedImage[] {
        return this.imageCache;
    }

    /**
     * Refresh cache (call after guides are updated)
     */
    refresh() {
        this.initialized = false;
        this.buildImageCache();
    }
}

// Singleton instance
export const imageLibraryService = new ImageLibraryService();
