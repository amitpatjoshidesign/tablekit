// dist/tablekit.css = component styles only. dist/styles.css = tokens + component styles (one import).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const tokens = readFileSync(require.resolve("@tablekit/tokens/tokens.css"), "utf8");
const component = readFileSync(resolve(root, "src/tablekit.css"), "utf8");
mkdirSync(resolve(root, "dist"), { recursive: true });
writeFileSync(resolve(root, "dist/tablekit.css"), component);
writeFileSync(resolve(root, "dist/styles.css"), `${tokens}\n${component}`);
console.log("react: wrote dist/tablekit.css, dist/styles.css");
