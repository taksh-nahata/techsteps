# TechSteps Project Notes

## AI Configuration (IMPORTANT)

**Current AI Provider: Mistral ONLY**

As of January 2026, the project uses **Mistral AI exclusively** for chat and flashcard generation.

- Primary Service: `src/services/ai/MistralService.ts`
- API Key: `VITE_MISTRAL_API_KEY`
- Model: `mistral-small-latest`

GeminiService and GroqService exist as legacy/fallback code but are **not actively used**.

## Key Services

| Service | Purpose |
|---------|---------|
| `MistralService.ts` | Primary AI for chat |
| `GuideMatchingService.ts` | Finds existing guides before AI generates |
| `ImageLibraryService.ts` | Catalogs images with captions for AI reuse |

## Discovery Agent

- Script: `scripts/discovery-agent.ts`
- Runs hourly via GitHub Actions
- Requires: `VITE_MISTRAL_API_KEY`, `VITE_TAVILY_API_KEY`
- Output: `public/data/pending_guides.json`
