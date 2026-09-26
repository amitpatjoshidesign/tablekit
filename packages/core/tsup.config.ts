import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", schema: "src/schema.ts" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
});
