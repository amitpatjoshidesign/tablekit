// Writes dist/tablekit.schema.json from the zod schema (single source of truth).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toJSONSchema } from "../src/schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../dist/tablekit.schema.json");
const json = {
  $id: "https://tablekit.amitpatjoshi.com/schema/v1.json",
  title: "tablekit TableSchema v1",
  description: "Declarative table config for <DataTable schema={...} />. See llms.txt for usage.",
  ...toJSONSchema(),
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(json, null, 2)}\n`);
console.log(`wrote ${out}`);
