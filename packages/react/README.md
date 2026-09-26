# @tablekit/react

An accessible, token-driven React data table. **Schema mode** is for agents and fast prototyping; **composable mode** is for custom product surfaces.

```sh
npm install @tablekit/react
```

```tsx
import { DataTable } from "@tablekit/react";
import "@tablekit/react/styles.css";

<DataTable schema={{ title: "Users", columns: [{ field: "name", header: "Name" }] }} data={users} />
```

- `styles.css` includes the tokens and component styles. Use `tablekit.css` if you load the tokens yourself.
- Design-system presets: `@tablekit/tokens/presets/{shadcn,material3,carbon,radix}.css`.
- Rules for AI agents: [AGENTS.md](./AGENTS.md) · Docs: https://amitpatjoshidesign.github.io/tablekit/
