// Generates, into apps/docs/public/:
//   llms.txt        short index (https://llmstxt.org)
//   llms-full.txt   every docs page as plain markdown + AGENTS.md + recipes + JSON Schema
//   schema/v1.json  the TableSchema as JSON Schema
// Also validates every recipe schema (fails the build on drift).
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { recipes } from "../apps/docs/src/data/recipes.ts";
import { parseTableSchema, toJSONSchema } from "../packages/core/src/schema.ts";
import { SITE_URL } from "./site.mjs";

const root = resolve(fileURLToPath(import.meta.url), "../..");
const docsDir = resolve(root, "apps/docs/src/content/docs");
const pub = resolve(root, "apps/docs/public");
mkdirSync(resolve(pub, "schema"), { recursive: true });

// 1) Validate recipes -------------------------------------------------------
let failed = false;
for (const r of recipes) {
  const res = parseTableSchema(r.schema);
  if (!res.success) {
    failed = true;
    console.error(`recipe "${r.id}" is invalid:\n  ${res.errors.join("\n  ")}`);
  }
}
if (failed) process.exit(1);

// 2) JSON Schema ----------------------------------------------------------------
const jsonSchema = {
  $id: `${SITE_URL}/schema/v1.json`,
  title: "tablekit TableSchema v1",
  description: "Declarative config for <DataTable schema={…} /> from @tablekit/react.",
  ...toJSONSchema(),
};
writeFileSync(resolve(pub, "schema/v1.json"), `${JSON.stringify(jsonSchema, null, 2)}\n`);

// 3) Docs → markdown ------------------------------------------------------------
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(f) ? [p] : [];
  });

const ORDER = [
  "getting-started/introduction",
  "getting-started/install",
  "guides/schema",
  "guides/composable",
  "guides/theming",
  "guides/responsive",
  "guides/accessibility",
  "guides/server-data",
  "agents/overview",
];

function toMarkdown(src) {
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/);
  const title = fm?.[1].match(/^title:\s*(.+)$/m)?.[1] ?? "";
  const description = fm?.[1].match(/^description:\s*(.+)$/m)?.[1] ?? "";
  let body = fm ? src.slice(fm[0].length) : src;
  body = body
    .replace(/^import .*$/gm, "")
    .replace(/^<(Demo|Playground|Recipes)[^>]*\/>$/gm, "")
    .replace(/^<\/?(Tabs|CardGrid|div)[^>]*>$/gm, "")
    .replace(/^<TabItem label="([^"]+)">$/gm, "### $1")
    .replace(/^<\/TabItem>$/gm, "")
    .replace(/<Card title="([^"]+)"[^>]*>/g, "**$1.** ")
    .replace(/<\/Card>/g, "")
    .replace(/<kbd>(.*?)<\/kbd>/g, "`$1`")
    .replace(/\]\((\.\.\/)+([^)]*)\)/g, (_, __, p) => `](${SITE_URL}/${p})`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, description, body };
}

const pages = walk(docsDir)
  .map((p) => ({
    slug: relative(docsDir, p).replace(/\.mdx?$/, ""),
    ...toMarkdown(readFileSync(p, "utf8")),
  }))
  .filter((p) => ORDER.includes(p.slug))
  .sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));

// 4) llms.txt ------------------------------------------------------------------------
const llms = `# tablekit

> Accessible, token-driven React data table for design systems and AI coding agents. Prefer schema mode: \`<DataTable schema={…} data={…} />\` from \`@tablekit/react\`, where the whole table is one strict JSON object (columns with types text/number/currency/date/badge/avatar/link/boolean/actions). Validate with \`parseTableSchema\` from \`@tablekit/core/schema\`. Colors come only from semantic badge tones and \`--tk-*\` CSS tokens; presets exist for shadcn/ui, Material 3, Carbon, Radix.

Install: \`npm i @tablekit/react\` and \`import "@tablekit/react/styles.css"\`, or \`npx shadcn@latest add ${SITE_URL}/r/tablekit.json\`.

## Docs

${pages.map((p) => `- [${p.title}](${SITE_URL}/${p.slug}/): ${p.description}`).join("\n")}

## Machine-readable

- [llms-full.txt](${SITE_URL}/llms-full.txt): all docs, agent rules, recipes and the JSON Schema in one file
- [TableSchema JSON Schema](${SITE_URL}/schema/v1.json): validate or constrain generated configs
- [shadcn registry item](${SITE_URL}/r/tablekit.json): source install
- [Registry index](${SITE_URL}/r/registry.json)

## Optional

- [Prompt recipes](${SITE_URL}/agents/recipes/): ${recipes.length} copy-paste prompts with expected schemas
- [Playground](${SITE_URL}/playground/): live schema editor
`;

// 5) llms-full.txt ---------------------------------------------------------------
const agents = readFileSync(resolve(root, "packages/react/AGENTS.md"), "utf8");
const full = [
  llms,
  "\n---\n\n# Agent rules (AGENTS.md)\n",
  agents.replace(/^# .*\n/, ""),
  ...pages.map((p) => `\n---\n\n# ${p.title}\n\n> ${p.description}\n\n${p.body}\n`),
  "\n---\n\n# Recipes\n\nEach recipe is a prompt and the schema a correct answer contains.\n",
  ...recipes.map(
    (r) =>
      `\n## ${r.title}\n\nPrompt: ${r.prompt.replace("{{LLMS_URL}}", `${SITE_URL}/llms.txt`)}\n\n\`\`\`json\n${JSON.stringify(r.schema, null, 2)}\n\`\`\`\n`,
  ),
  "\n---\n\n# TableSchema (JSON Schema)\n\n```json\n",
  JSON.stringify(jsonSchema, null, 2),
  "\n```\n",
].join("");

writeFileSync(resolve(pub, "llms.txt"), llms);
writeFileSync(resolve(pub, "llms-full.txt"), full);
writeFileSync(resolve(root, "llms.txt"), llms);
console.log(
  `llms: ${recipes.length} recipes valid · llms.txt ${llms.length}B · llms-full.txt ${(full.length / 1024).toFixed(0)}KB · schema/v1.json`,
);
