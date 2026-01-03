/**
 * GuideMatchingService
 * 
 * Searches the approved guides database to find existing solutions
 * that match a user's query. Used by AI to avoid regenerating
 * flashcards for problems we already have solutions for.
 */

import guidesData from '../data/guides.json';
import { TroubleshootingGuide } from '../types/guides';

interface MatchResult {
    guide: TroubleshootingGuide;
    score: number;
    matchReason: string;
}

export class GuideMatchingService {
    private guides: TroubleshootingGuide[];

    constructor() {
        this.guides = guidesData as TroubleshootingGuide[];
    }

    /**
     * Normalize text for comparison (lowercase, remove punctuation, trim)
     */
    private normalize(text: string): string {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Calculate word overlap score between two strings
     */
    private calculateWordOverlap(query: string, text: string): number {
        const queryWords = new Set(this.normalize(query).split(' '));
        const textWords = new Set(this.normalize(text).split(' '));

        let matches = 0;
        queryWords.forEach(word => {
            if (word.length > 2 && textWords.has(word)) {
                matches++;
            }
        });

        return queryWords.size > 0 ? matches / queryWords.size : 0;
    }

    /**
     * Check if query matches any keywords
     */
    private keywordScore(query: string, keywords: string[]): number {
        const normalizedQuery = this.normalize(query);
        let matches = 0;

        keywords.forEach(keyword => {
            if (normalizedQuery.includes(this.normalize(keyword))) {
                matches++;
            }
        });

        return keywords.length > 0 ? matches / keywords.length : 0;
    }

    /**
     * Find the best matching guide for a user query
     * @param query - User's question or problem description
     * @param minScore - Minimum score threshold (0-1), default 0.4 (40% match)
     * @returns Best match or null if no good match found
     */
    findBestMatch(query: string, minScore: number = 0.4): MatchResult | null {
        const results: MatchResult[] = [];

        for (const guide of this.guides) {
            // Calculate scores for different matching strategies
            const titleScore = this.calculateWordOverlap(query, guide.title) * 0.4;
            const descriptionScore = this.calculateWordOverlap(query, guide.problemDescription) * 0.3;
            const keywordScoreValue = this.keywordScore(query, guide.keywords) * 0.3;

            const totalScore = titleScore + descriptionScore + keywordScoreValue;

            if (totalScore >= minScore) {
                let matchReason = '';
                if (titleScore > 0.2) matchReason += 'title match, ';
                if (descriptionScore > 0.15) matchReason += 'description match, ';
                if (keywordScoreValue > 0.15) matchReason += 'keyword match, ';

                results.push({
                    guide,
                    score: totalScore,
                    matchReason: matchReason.slice(0, -2) || 'general match'
                });
            }
        }

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        return results.length > 0 ? results[0] : null;
    }

    /**
     * Find multiple matching guides (for suggestions)
     */
    findMatches(query: string, limit: number = 5, minScore: number = 0.3): MatchResult[] {
        const results: MatchResult[] = [];

        for (const guide of this.guides) {
            const titleScore = this.calculateWordOverlap(query, guide.title) * 0.4;
            const descriptionScore = this.calculateWordOverlap(query, guide.problemDescription) * 0.3;
            const keywordScoreValue = this.keywordScore(query, guide.keywords) * 0.3;

            const totalScore = titleScore + descriptionScore + keywordScoreValue;

            if (totalScore >= minScore) {
                results.push({
                    guide,
                    score: totalScore,
                    matchReason: `${Math.round(totalScore * 100)}% match`
                });
            }
        }

        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }

    /**
     * Check if a guide already exists (for duplicate detection)
     */
    isDuplicate(title: string, keywords: string[]): boolean {
        return this.guides.some(guide => {
            // Check title similarity
            const titleSimilarity = this.calculateWordOverlap(title, guide.title);
            if (titleSimilarity > 0.7) return true;

            // Check keyword overlap
            const commonKeywords = keywords.filter(k =>
                guide.keywords.some(gk => this.normalize(gk) === this.normalize(k))
            );
            if (commonKeywords.length >= 3) return true;

            return false;
        });
    }

    /**
     * Get all guides (for AI context building)
     */
    getAllGuides(): TroubleshootingGuide[] {
        return this.guides;
    }

    /**
     * Get guides by category
     */
    getByCategory(category: string): TroubleshootingGuide[] {
        return this.guides.filter(g => g.category.toLowerCase() === category.toLowerCase());
    }
}

// Singleton instance
export const guideMatchingService = new GuideMatchingService();
