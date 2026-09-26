// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// GitHub Pages on a custom domain: SITE + BASE are set in CI (see .github/workflows/pages.yml).
export default defineConfig({
  site: process.env.SITE ?? "https://tablekit.amitpatjoshi.com",
  base: process.env.BASE ?? "/",
  trailingSlash: "ignore",
  integrations: [mdx(), react()],
  // The dev-only toolbar overlaps the bottom of pages in the preview; not needed here.
  devToolbar: { enabled: false },
  markdown: {
    // Token colors come from CSS variables mapped to the site palette (site.css).
    shikiConfig: { theme: "css-variables", wrap: true },
  },
});
