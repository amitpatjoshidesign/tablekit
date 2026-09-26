# tablekit

**An accessible, token-driven table component for design systems and agentic coding.**

AI agents describe the table in JSON, engineers compose it from parts, and designers theme it with tokens. It's built for the web and adapts to mobile.

[Docs](https://amitpatjoshidesign.github.io/tablekit/) · [Playground](https://amitpatjoshidesign.github.io/tablekit/playground/) · [llms.txt](https://amitpatjoshidesign.github.io/tablekit/llms.txt) · [Prompt recipes](https://amitpatjoshidesign.github.io/tablekit/agents/recipes/)

```tsx
import { DataTable } from "@tablekit/react";
import "@tablekit/react/styles.css";

<DataTable
  data={orders}
  schema={{
    title: "Orders",
    columns: [
      { field: "id", header: "Order", type: "link", link: { hrefTemplate: "/orders/{id}" } },
      { field: "customer.name", header: "Customer", type: "avatar" },
      { field: "status", header: "Status", type: "badge", badge: { tones: { paid: "success", overdue: "danger" } } },
      { field: "total", header: "Total", type: "currency", format: { currency: "USD" } },
    ],
    features: { selection: "multi" },
  }}
/>
```

## Why

Most table libraries are either headless, so you build all the UI yourself, or come as a styled kit that fights your design system. Neither is written with AI agents in mind. tablekit is:

- **Agent-native.** It uses a strict JSON schema, so invented props fail validation. It ships `llms.txt` / `llms-full.txt`, an `AGENTS.md` inside the package, a shadcn registry that also works through the shadcn MCP server, a published JSON Schema you can use for structured output, and 11 tested prompt recipes.
- **Design-system friendly.** All styling reads `--tk-*` CSS variables, and the component CSS has zero specificity (`:where()`). One-line presets cover **shadcn/ui, Material 3, Carbon and Radix**. Tokens ship as **W3C DTCG JSON** for Tokens Studio and Style Dictionary.
- **Accessible.** A semantic table with `aria-sort`, arrow-key cell navigation, live announcements, a focus-managed menu, 44px touch targets, reduced motion and forced colors. axe-core runs in CI.
- **Responsive.** Container-query based. Narrow containers get stacked cards (`stack`), dropped columns (`priority`) or horizontal scroll (`scroll`).

## Packages

| Package | |
| --- | --- |
| [`@tablekit/core`](packages/core) | Headless, framework-agnostic logic plus the `TableSchema` (zod, at `/schema`) |
| [`@tablekit/react`](packages/react) | `<DataTable>` (schema mode) and `Table.*` parts with `useTable` (composable mode) |
| [`@tablekit/tokens`](packages/tokens) | `tokens.css`, `tokens.json` (DTCG) and design-system presets |

## Install

```sh
npm install @tablekit/react @fontsource-variable/inter   # the table is set in Inter
# or copy the source into your project with the shadcn CLI:
npx shadcn@latest add https://amitpatjoshidesign.github.io/tablekit/r/tablekit.json
```

## Features (v1)

Sorting (multi-sort) · global search · column filters (text, select, range) with chips · pagination · single/multi selection with bulk actions · row action menus · column menu to show/hide, pin and reorder (drag or keyboard) · column resize (pointer and keyboard) · pinned columns · sticky header · 3 densities · zebra and bordered variants · loading, empty, no-results and error states · stacked cards on mobile · priority column hiding · i18n labels · server-side mode.

Roadmap: virtualization, inline editing, grouping, row expansion, CSV export, a Figma library with Code Connect, and a React Native adapter.

## Embed it on your site

The docs site includes a chrome-free demo page:

```html
<iframe
  src="https://amitpatjoshidesign.github.io/tablekit/embed/?recipe=invoices&presets=1"
  title="tablekit demo" style="width:100%;height:720px;border:0" loading="lazy"></iframe>
```

`recipe` accepts any recipe id from the [prompt recipes](https://amitpatjoshidesign.github.io/tablekit/agents/recipes/) (e.g. `invoices`, `settlements`, `members`). `theme` accepts `light` or `dark`, and `presets=1` shows the preset switcher.

## Develop

```sh
npm install
npm run dev          # builds packages, then docs at http://localhost:4321/tablekit/
npm test             # unit + component + axe tests
npm run build:all    # packages, registry, llms.txt, docs
npm run e2e          # Playwright visual/a11y at 3 widths (run `npx playwright install chromium` once)
```

See [AGENTS.md](AGENTS.md) for the repo layout and conventions. Coding agents read it too.

## Before publishing: rename checklist

`tablekit`, the `@tablekit` npm scope and `amitpatjoshidesign.github.io/tablekit` are placeholders. If you change them:

1. Rename the npm scope in the `packages/*/package.json` files, the workspace dependencies and the imports (`grep -r "@tablekit/"`).
2. Update the URLs. `grep -rl "amitpatjoshidesign.github.io/tablekit" . --exclude-dir=node_modules` finds all of them. CI derives the URLs from the repo name via `SITE_URL`/`BASE`.
3. Add an `NPM_TOKEN` secret, and turn on GitHub Pages with the source set to **GitHub Actions**.

## Credits

- Type: [Inter](https://github.com/rsms/inter) by Rasmus Andersson (SIL Open Font License 1.1).
- Icons: [Lucide](https://lucide.dev) (ISC), via `lucide-react` in the component and `lucide-static` on the docs site.
- Bank logos (docs sample data only): [Simple Icons](https://simpleicons.org) (CC0-1.0). The marks are trademarks of their owners and appear only to identify those banks.
- Docs palette: [amitpatjoshi.com](https://amitpatjoshi.com).

## License

MIT
