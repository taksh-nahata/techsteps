# Copilot / AI Agent Instructions for TechSteps

This file gives concise, actionable guidance to AI coding agents working in this repository.

Overview
- Project: React + Vite single-page app focused on senior-friendly learning with AI avatar features.
- Main entry: src/main.tsx — app providers (Auth, User, Accessibility, ErrorRecovery) are initialized here.
- Routing and feature boundaries: src/App.tsx organizes routes and wraps pages with `ProtectedRoute`/`PublicRoute`.

Key architectural notes (why)
- Context-first design: app-wide concerns use React Contexts under `src/contexts/` (Auth, User, Accessibility, Onboarding, TranslationAnimation). Modify through contexts, not ad-hoc prop drilling.
- i18n is centralized: `src/i18n.ts` configures `i18next` with HTTP backend loading JSON from `public/locales/<lng>/translation.json`. Translation keys are referenced across code (e.g. `titleKey`, `descriptionKey`) instead of literal strings.
- Services layer: lightweight service modules under `src/services/` (e.g. `firebase.ts`, `learningService.ts`, `pwaService`) encapsulate external integrations or mock implementations. Prefer updating services instead of scattering API logic.
- PWA + SW: service worker is registered in `src/App.tsx` and the built SW lives in `public/sw.js`.
- Build splitting: `vite.config.ts` declares manualChunks; keep chunk names consistent when adding large deps.

Conventions & patterns
- Translations: add or update JSON under `public/locales/<lang>/translation.json`. Use the same key shape used by `learningService.ts` (e.g. `learningPaths.fundamentals.title`). See `src/i18n.ts` for detection and missing-key reporting logic.
- Context updates: use provided context hooks like `useAuth()`, `useUser()`, `useTranslationAnimation()` found in `src/contexts` and `src/hooks` rather than directly calling services from components.
- Error handling: wrap higher-level changes in `ErrorRecoveryBoundary` or use `ErrorRecoveryProvider` settings from `src/components/error-recovery`.
- Performance: features that affect startup should honor `usePerformanceOptimization` options (see usage in `src/App.tsx`) and avoid blocking the UI for senior users.

Tests & developer workflows
- Dev server: `npm install` then `npm run dev` (Vite). See `package.json` scripts.
- Unit tests: `npm run test` (Vitest). Accessibility/contrast scripts: `npm run test:a11y`, `npm run test:contrast`.
- E2E keyboard test: `npm run test:keyboard` (Playwright runs `tests/keyboard-navigation.spec.ts`).
- Lighthouse CI: `npm run lighthouse` runs `lhci autorun`.

Integration points & secrets
- Firebase config is in `src/services/firebase.ts` (currently contains keys). Treat these as sensitive — do not hardcode new secrets; prefer using env vars and update `vite.config.ts` define block or use `.env` files.
- AI/Avatar integrations live under `src/services/ai/` and `src/hooks/useAIAssistant.ts`. Check these before adding new AI endpoints.

What an agent should do first
1. Run `npm ci` and `npm run dev` locally to validate builds before code changes (ask for permission to run commands if required).
2. Inspect `src/contexts` and `src/services` when making feature or bug fixes — they determine side-effect and data flow boundaries.
3. When touching translations, update `public/locales/*/translation.json` and run the app to validate `i18n` loading; missing keys are reported in dev via `translationReporting` in `src/i18n.ts`.

Examples (search targets)
- App entry/providers: src/main.tsx
- Routing & guards: src/App.tsx and src/components/routing/ProtectedRoute.tsx
- i18n config/RTL handling: src/i18n.ts
- Firebase setup: src/services/firebase.ts
- Mocked domain logic: src/services/learningService.ts
- Tests: tests/keyboard-navigation.spec.ts and vitest config at vitest.config.ts

When editing files
- Preserve existing chunk names in `vite.config.ts` when introducing large libs.
- Keep `react-i18next` suspense disabled (see `src/i18n.ts -> react.useSuspense: false`) to match senior-friendly UX choices.
- Avoid enabling network-heavy features by default; follow feature flags or provider options used in `usePerformanceOptimization`.

Questions? If anything's unclear, ask the repo owner for runtime checks (dev server, Playwright run) before major refactors.
