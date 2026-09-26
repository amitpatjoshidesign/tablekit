# @tablekit/core

Headless, framework-agnostic table logic: sorting, filtering, pagination, selection, columns and locale-aware formatters. It also defines the declarative **TableSchema** that `@tablekit/react`'s `<DataTable>` renders.

```ts
import { createTable, getRowModel, toggleSort } from "@tablekit/core";
import { parseTableSchema } from "@tablekit/core/schema"; // zod-based; main entry has no deps
```

- `getRowModel(options, state)` runs the whole pipeline (filter → sort → paginate) as one pure function.
- `createTable(options)` is a tiny subscribable store for non-React adapters.
- The JSON Schema is at `@tablekit/core/tablekit.schema.json`.

Docs: https://amitpatjoshidesign.github.io/tablekit/ · Rules for agents: [AGENTS.md](./AGENTS.md)
