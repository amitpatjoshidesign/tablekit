// Builds a shadcn-compatible registry into apps/docs/public/r/.
//   tablekit.json      → copies the full source into components/tablekit/ (no npm deps besides zod)
//   tablekit-npm.json  → a thin wrapper around the published @tablekit/react package
//   registry.json      → index of items
// Spec: https://ui.shadcn.com/docs/registry
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "./site.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "apps/docs/public/r");
mkdirSync(out, { recursive: true });

const read = (p) => readFileSync(resolve(root, p), "utf8");
const srcFiles = (dir) =>
  readdirSync(resolve(root, dir)).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f));

const TARGET = "components/tablekit";
const files = [];

// core → components/tablekit/core/*
for (const f of srcFiles("packages/core/src")) {
  files.push({
    path: `registry/tablekit/core/${f}`,
    type: "registry:lib",
    target: `${TARGET}/core/${f}`,
    content: read(`packages/core/src/${f}`),
  });
}

// react → components/tablekit/*
for (const f of srcFiles("packages/react/src")) {
  let content = read(`packages/react/src/${f}`)
    .replaceAll('from "@tablekit/core/schema"', 'from "./core/schema"')
    .replaceAll('from "@tablekit/core"', 'from "./core"');
  if (f === "index.ts") {
    content = `"use client";\nimport "./tablekit.css";\n${content}\nexport { parseTableSchema, toJSONSchema, TableSchema } from "./core/schema";\n`;
  } else if (f.endsWith(".tsx") || f === "useTable.ts" || f === "hooks.ts") {
    content = `"use client";\n${content}`;
  }
  files.push({
    path: `registry/tablekit/${f}`,
    type: f.endsWith(".tsx") ? "registry:component" : "registry:lib",
    target: `${TARGET}/${f}`,
    content,
  });
}

// CSS: tokens + shadcn preset + component styles, one file.
const css = [
  read("packages/tokens/dist/tokens.css"),
  read("packages/tokens/dist/presets/shadcn.css"),
  read("packages/react/src/tablekit.css"),
].join("\n");
files.push({
  path: "registry/tablekit/tablekit.css",
  type: "registry:file",
  target: `${TARGET}/tablekit.css`,
  content: css,
});
files.push({
  path: "registry/tablekit/AGENTS.md",
  type: "registry:file",
  target: `${TARGET}/AGENTS.md`,
  content: read("packages/react/AGENTS.md")
    .replaceAll("@tablekit/react", "@/components/tablekit")
    .replaceAll("@tablekit/core/schema", "@/components/tablekit"),
});

const meta = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  author: "tablekit contributors",
  docs: `Docs for agents: ${SITE_URL}/llms.txt — rules: components/tablekit/AGENTS.md`,
  categories: ["table", "data-table", "data"],
};

const sourceItem = {
  ...meta,
  name: "tablekit",
  type: "registry:block",
  title: "tablekit data table",
  description:
    "Accessible, token-driven data table: sorting, filtering, pagination, selection, column resize/visibility, responsive cards, and a declarative JSON schema for agents. Themed via your shadcn CSS variables.",
  dependencies: ["zod@^4.1.0", "lucide-react@^1.48.0"],
  files,
};

const npmItem = {
  ...meta,
  name: "tablekit-npm",
  type: "registry:component",
  title: "tablekit data table (npm)",
  description:
    "Thin wrapper around the published @tablekit/react package with the shadcn preset applied.",
  dependencies: ["@tablekit/react", "@tablekit/tokens"],
  files: [
    {
      path: "registry/tablekit-npm/data-table.tsx",
      type: "registry:component",
      target: "components/data-table.tsx",
      content: `"use client";
// tablekit — https://github.com/amitpatjoshidesign/tablekit
// Rules for agents: node_modules/@tablekit/react/AGENTS.md
import "@tablekit/react/styles.css";
import "@tablekit/tokens/presets/shadcn.css";

export * from "@tablekit/react";
export { parseTableSchema } from "@tablekit/core/schema";
`,
    },
  ],
};

writeFileSync(join(out, "tablekit.json"), JSON.stringify(sourceItem, null, 2));
writeFileSync(join(out, "tablekit-npm.json"), JSON.stringify(npmItem, null, 2));

const index = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "tablekit",
  homepage: SITE_URL,
  items: [sourceItem, npmItem].map(({ files: f, ...rest }) => ({
    ...rest,
    files: f.map(({ content, ...x }) => x),
  })),
};
writeFileSync(join(out, "registry.json"), JSON.stringify(index, null, 2));
writeFileSync(resolve(root, "registry/registry.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(
  `registry: ${files.length} files → apps/docs/public/r/{tablekit,tablekit-npm,registry}.json`,
);
