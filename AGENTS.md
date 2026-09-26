# AGENTS.md — working in the tablekit repo

This file is for agents (and humans) **contributing to** tablekit. If you're **using** tablekit in an app, read `packages/react/AGENTS.md` instead.

## Layout

- `packages/core`: headless TypeScript. `src/table.ts` holds the `getRowModel` pipeline (filter → sort → paginate). Each feature lives in its own file. `src/schema.ts` is the zod `TableSchema`. `src/schema-columns.ts` maps a schema to ColumnDefs **without importing zod**.
- `packages/react`: `useTable.ts` (state), `context.tsx` (`Root`, labels, layout detection), `content.tsx` (table and cards views, states, keyboard nav), `toolbar.tsx`, `pagination.tsx`, `cells.tsx` (schema cell renderers), `DataTable.tsx`, `tablekit.css`.
- `packages/tokens`: `src/tokens.mjs` is the **single source** for tokens. `scripts/build.mjs` generates `dist/tokens.css` and `dist/tokens.json` (DTCG). Presets live in `src/presets/*.css`.
- `apps/docs`: Astro + MDX site whose design is ported from amitpatjoshi.com (westar palette, Inter, grey canvas, sidebar with a hopping section dot). Layouts are in `src/layouts`, styles in `src/styles/site.css`, behavior (sidebar dot and scroll-spy, search, mobile drawer, copy buttons, reveal, theme) in `src/scripts/site.ts`, and the single sidebar navigation in `src/data/site.ts`. Search reads a static index built by `src/pages/search-index.json.ts`. Pages are MDX in `src/content/docs`. The component gallery (`components/cells.mdx`, `components/parts.mdx`) renders every cell type and table part from `src/components/Specimens.tsx`; when you add a cell type or part, add a specimen there too. Live demos are React islands in `src/components`. Recipes are in `src/data/recipes.ts`.
- `scripts/`: `build-registry.mjs` (shadcn registry → `apps/docs/public/r`) and `build-llms.mjs` (`llms.txt`, `llms-full.txt`, JSON Schema; also validates the recipes).

## Commands

```sh
npm install
npm test            # vitest: core + react (includes axe-core checks)
npm run typecheck
npm run build       # tokens → core → react
npm run build:all   # + registry + llms + docs site
npm run dev         # docs site at http://localhost:4321/tablekit
npm run e2e         # Playwright (needs `npx playwright install chromium` once)
```

## Conventions

- Keep the core **pure** and free of DOM/React. `@tablekit/core`'s main entry must not import zod. Check with `grep zod packages/core/dist/index.js`.
- New schema keys: add them to `schema.ts` (zod, with `.describe()`), add a default in `resolveSchema`, and extend `schema.test.ts`. The "defaults match zod" test catches drift.
- Icons: Lucide only. Add new ones as named wrappers in `packages/react/src/icons.tsx`, never import `lucide-react` elsewhere, so the set can be swapped in one file. The docs site uses `lucide-static` through `apps/docs/src/components/icon.ts`, and Simple Icons for brand marks (`apps/docs/src/data/logos.ts`).
- Styling: component CSS must read **only** `--tk-*` tokens and stay wrapped in `:where()`. New tokens go in `packages/tokens/src/tokens.mjs` and every preset.
- Accessibility is a requirement: new UI needs a test in `react.test.tsx` that includes `expectNoAxeViolations`.
- Every user-facing string goes through `labels` (`defaultLabels` in `context.tsx`).
- Add a changeset (`npm run changeset`) for anything that affects published packages.
