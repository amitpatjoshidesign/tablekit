// Site structure: one sidebar holds all navigation. Ids match src/content/docs paths;
// "" is the home page.
export const REPO_URL = "https://github.com/amitpatjoshidesign/tablekit";

export const sidebar: { label?: string; items: string[] }[] = [
  { items: [""] },
  {
    label: "Start here",
    items: ["getting-started/introduction", "getting-started/install", "playground"],
  },
  {
    label: "Guides",
    items: [
      "guides/schema",
      "guides/composable",
      "guides/theming",
      "guides/responsive",
      "guides/accessibility",
      "guides/server-data",
    ],
  },
  { label: "Components", items: ["components/cells", "components/parts"] },
  { label: "For AI agents", items: ["agents/overview", "agents/recipes"] },
];

/** Reading order for "Next" links (docs only). */
export const order = sidebar.flatMap((g) => g.items).filter(Boolean);

/** Sidebar labels where the page title is long (or not a doc). */
export const shortLabels: Record<string, string> = {
  "": "Home",
  "guides/theming": "Theming",
  "guides/responsive": "Responsive",
  "guides/server-data": "Server data",
};
