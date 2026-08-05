import { guideLibraryService } from './GuideLibraryService';
import { TroubleshootingGuide } from '../types/guides';

interface MatchResult {
  guide: TroubleshootingGuide;
  score: number;
  matchReason: string;
}

export class GuideMatchingService {
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateWordOverlap(query: string, text: string): number {
    const queryWords = new Set(this.normalize(query).split(' '));
    const textWords = new Set(this.normalize(text).split(' '));
    let matches = 0;
    queryWords.forEach((word) => {
      if (word.length > 2 && textWords.has(word)) matches++;
    });
    return queryWords.size > 0 ? matches / queryWords.size : 0;
  }

  private keywordScore(query: string, keywords: string[]): number {
    const normalizedQuery = this.normalize(query);
    let matches = 0;
    keywords.forEach((keyword) => {
      if (normalizedQuery.includes(this.normalize(keyword))) matches++;
    });
    return keywords.length > 0 ? matches / keywords.length : 0;
  }

  private get guides(): TroubleshootingGuide[] {
    return guideLibraryService.getAll();
  }

  findBestMatch(query: string, minScore = 0.4): MatchResult | null {
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
          matchReason: `${Math.round(totalScore * 100)}% match`,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results[0] ?? null;
  }

  findMatches(query: string, limit = 5, minScore = 0.3): MatchResult[] {
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
          matchReason: `${Math.round(totalScore * 100)}% match`,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  isDuplicate(title: string, keywords: string[]): boolean {
    return this.guides.some((guide) => {
      if (this.calculateWordOverlap(title, guide.title) > 0.7) return true;
      const common = keywords.filter((k) =>
        guide.keywords.some((gk) => this.normalize(gk) === this.normalize(k))
      );
      return common.length >= 3;
    });
  }

  getAllGuides(): TroubleshootingGuide[] {
    return this.guides;
  }

  getByCategory(category: string): TroubleshootingGuide[] {
    return this.guides.filter((g) => g.category.toLowerCase() === category.toLowerCase());
  }
}

export const guideMatchingService = new GuideMatchingService();
