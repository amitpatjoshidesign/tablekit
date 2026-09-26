# tablekit — rules for AI coding agents

You are using **tablekit**, an accessible, token-driven React table. Follow these rules.

Full docs for agents: https://tablekit.amitpatjoshi.com/llms-full.txt

## Default: schema mode

```tsx
import { DataTable } from "@tablekit/react";
import "@tablekit/react/styles.css"; // once, in the root layout

<DataTable
  data={rows}
  schema={{
    title: "Orders",                     // required for accessibility (or pass aria-label)
    columns: [
      { field: "id", header: "Order", type: "link", link: { hrefTemplate: "/orders/{id}" } },
      { field: "customer.name", header: "Customer", type: "avatar", avatar: { subtitleField: "customer.email" } },
      { field: "status", header: "Status", type: "badge", badge: { tones: { paid: "success", overdue: "danger" } } },
      { field: "total", header: "Total", type: "currency", format: { currency: "USD" } },
      { field: "created", header: "Created", type: "date", format: { dateStyle: "relative" } },
      { field: "actions", header: "Actions", type: "actions", actions: [{ id: "refund", label: "Refund", tone: "danger" }] },
    ],
    features: { selection: "multi" },
    bulkActions: [{ id: "export", label: "Export" }],
  }}
  onAction={(actionId, row) => {}}
  onBulkAction={(actionId, rows) => {}}
/>
```

## Rules

1. **Validate every schema** you write: `parseTableSchema(schema)` from `@tablekit/core/schema`. The schema is strict, so unknown keys are errors. Fix every error it reports.
2. Column `type` is one of: `text | number | currency | date | badge | avatar | link | boolean | actions | button`. Type-specific keys (`badge`, `avatar`, `link`, `actions`) are only valid on their own type.
3. **Colors:** use badge `tones` only: `neutral | info | success | warning | danger | accent`. Never put hex, rgb or Tailwind color classes on the table.
4. **Styling:** override `--tk-*` CSS variables, or import a preset (`@tablekit/tokens/presets/shadcn.css`, `material3.css`, `carbon.css`, `radix.css`). Don't add utility classes to table internals.
5. **Font:** the table is designed for Inter (`npm i @fontsource-variable/inter`, then `import "@fontsource-variable/inter"`). Numbers use Inter's `"tnum"`, `"zero"` and `"ss01"` via `--tk-font-feature-numeric`. Don't override `font-variant-numeric` in cells.
6. **Data stays raw:** numbers as numbers, dates as ISO strings or `Date`, enums as strings. `type` and `format` handle display.
7. **Server-side data:** `manual`, `rowCount`, `state` and `onStateChange`. Don't paginate on the client when the API paginates.
8. **Mobile:** set `priority` (1 = most important … 5) on secondary columns. `appearance.responsive` is `stack` (cards, the default), `priority` (drop columns) or `scroll`.
9. **Badge styles:** `badge.fill` (default true) and `badge.stroke` (default false). Outline badges = `fill: false, stroke: true`; tinted + bordered = `stroke: true`. Prefer `indicator: "icon"` with `icons` for statuses users scan (payments, deploys).
10. **Logos** (banks, merchants, payment providers): an avatar column with `avatar: { imageField, logo: "inline" }` (16px mark centred on the name's first line, no container) or `logo: "circle"` (mark in a neutral/accent circle). Use the brand's compact symbol mark, not its wordmark. Fills follow the theme (dark in dark mode), so give navy/black marks a light variant via `avatar.imageDarkField`.
11. **Actions:** several row actions → `type: "actions"` (⋯ menu, or `actionsDisplay: "inline"` icons). Never a row of text buttons. One clear call to action per row → a `type: "button"` column.
12. **Column layout:** the Columns menu lets users show/hide (`features.columnVisibility`), pin (`features.columnPinning`) and reorder (`features.columnReorder`) columns. All three are on by default. `column.pinned: true` sets the initial pin; pin the identifying column (name, ID), not numbers. To remember a user's layout, persist `state.columnOrder`, `state.columnPinning` and `state.columnVisibility` from `onStateChange`.
13. **Icons:** the table uses Lucide (`lucide-react`). Match it in custom cells rather than mixing icon sets.
14. Need custom cell markup? Switch to composable mode: `useTable` with `ReactColumnDef.cell` and `<Table.Root>` / `<Table.Toolbar>` / `<Table.Content>` / `<Table.Pagination>`.
15. Don't wrap `DataTable` in your own `<table>`, and don't re-implement sorting, filtering or pagination around it.

## Props cheat sheet

`schema`, `data`, `loading`, `error`, `onRetry`, `onAction`, `onBulkAction`, `onRowClick`, `onSelectionChange`, `state`, `onStateChange`, `manual`, `rowCount`, `density`, `theme` (`"light" | "dark"`), `maxHeight`, `toolbarExtra`, `labels` (i18n), `className`, `style`.
