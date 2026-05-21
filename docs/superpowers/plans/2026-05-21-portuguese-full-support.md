# Portuguese Full Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full Portuguese support across Ground Codes codebooks, Earth/Moon/Mars labels, API, web UI, docs, runtime pins, and deployment smoke checks.

**Architecture:** Follow the existing Spanish/French/German language-extension pattern. Portuguese uses API language key `portuguese`, web locale `pt`, ASCII-normalized URL/codebook labels, and native Portuguese UI copy.

**Tech Stack:** TypeScript, Bun, Node test runner, pnpm workspaces, generated JSON region/codebook assets, LevelDB/KDBush embedded geoint indexes, Next.js web i18n.

---

### Task 1: RED Coverage

**Files:**

- Modify: `packages/ground-codes/test/multilingual-codebook-review.test.ts`
- Modify: `packages/ground-codes/test/celestial-body.test.ts`
- Modify: `packages/ground-codes/test/region-3-dataset.test.ts`
- Modify: `apps/api-ground-codes/src/app.test.ts`
- Create: `apps/web/lib/i18n/portuguese-locale.test.ts`

- [ ] Add tests that require a 5,000-entry Portuguese codebook with URL-safe ASCII words, blocked sensitive terms absent, and common concrete terms present.
- [ ] Add tests that require Portuguese Earth, Moon, Mars, and Mars fallback labels.
- [ ] Add tests that require Portuguese Earth region datasets and region-3 marine labels.
- [ ] Add API tests requiring `portuguese` docs, encode, decode/search, and region search.
- [ ] Add web locale tests requiring native Portuguese UI accents and no URL-only transliteration in UI copy.
- [ ] Run the focused tests and confirm they fail because Portuguese support is missing.

### Task 2: Core Data Generation

**Files:**

- Create: `scripts/generate-portuguese-support.mjs`
- Create: `packages/codebook/codebook-dist/portuguese.json`
- Create: `packages/geoint/region-dist/region-2-portuguese.json`
- Create: `packages/geoint/region-dist/region-3-portuguese.json`
- Create: `packages/geoint/region-dist/region-2-moon-portuguese.json`
- Create: `packages/geoint/region-dist/region-2-mars-portuguese.json`
- Create: `packages/geoint/region-dist/region-3-mars-portuguese.json`
- Create: `packages/geoint/region-db/region-2-portuguese`
- Create: `packages/geoint/region-db/region-3-portuguese`
- Create: `packages/geoint/region-db/region-2-moon-portuguese`
- Create: `packages/geoint/region-db/region-2-mars-portuguese`
- Create: `packages/geoint/region-db/region-3-mars-portuguese`

- [ ] Generate an ASCII-normalized Portuguese codebook from reviewed concrete nouns and low-risk compounds.
- [ ] Generate Portuguese Earth labels with curated city overrides such as `Seul`, `Toquio`, `Pequim`, `Lisboa`, `Sao Paulo`, and `Rio de Janeiro`.
- [ ] Generate Portuguese region-3 labels with marine terms such as `Mar`, `Oceano`, `Baia`, `Golfo`, `Canal`, `Estreito`, `Bacia`, and `Fossa`.
- [ ] Generate Moon and Mars labels with overrides such as `Mar da Tranquilidade`, `Oceano das Tempestades`, and `Monte Olimpo`.
- [ ] Rebuild embedded geoint DB/index files for all Portuguese region datasets.

### Task 3: Runtime Integration

**Files:**

- Modify: `packages/ground-codes/src/wordset.ts`
- Modify: `packages/ground-codes/src/region.ts`
- Modify: `apps/api-ground-codes/src/endpoints/v1/language.ts`
- Modify: `apps/api-ground-codes/src/endpoints/v1/search.ts`
- Modify: `apps/api-ground-codes/src/endpoints/docs.ts`
- Modify: `apps/web/i18n.ts`
- Modify: `apps/web/lib/i18n/ground-code-language.ts`
- Modify: `apps/web/components/google-map/hooks/use-language.ts`
- Modify: `apps/web/components/google-map/map-controls.tsx`
- Modify: `apps/web/components/google-map/place-details/types.ts`
- Create: `apps/web/messages/pt/index.json`
- Create: `apps/web/messages/pt/placeTypes.json`

- [ ] Add `portuguese` to `SupportedLanguage`, wordset loading, region loading, API validation/docs, and search language fallback.
- [ ] Add `pt` to web locales and map it to `portuguese` for Ground Codes.
- [ ] Add Portuguese UI strings and place type labels with native accents.

### Task 4: Policy, Docs, and QA Scripts

**Files:**

- Modify: `scripts/codebook-policy-audit.mjs`
- Modify: `scripts/codebook-policy-audit.test.mjs`
- Modify: `scripts/codebook-type-inventory.mjs`
- Modify: `scripts/url-label-report.mjs`
- Modify: `scripts/production-smoke.mjs`
- Modify: `packages/codebook/CODEBOOK_GUIDE.md`
- Modify: `packages/codebook/README.md`
- Modify: `packages/geoint/README.md`
- Modify: `packages/ground-codes/README.md`
- Modify: `apps/api-ground-codes/README.md`
- Modify: `README.md`

- [ ] Add Portuguese to codebook counts, policy audit, compound saturation checks, and URL-label reports.
- [ ] Update language support docs and smoke tests.

### Task 5: Verify, Pin, Push, and Monitor

- [ ] Run focused RED/GREEN tests, full package tests, lint, type checks, and builds.
- [ ] Commit and push Portuguese full support.
- [ ] Tag the runtime commit and update API git dependency pins.
- [ ] Commit and push runtime pin updates.
- [ ] Monitor GitHub Actions and production smoke.
- [ ] Run public API canaries for Portuguese Earth, Moon, and Mars.
