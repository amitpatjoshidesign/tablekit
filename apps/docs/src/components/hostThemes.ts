// Sample host design-system variables so the docs can demo each preset for real.
// In your app these come from shadcn / Material / Carbon themselves — you only import the preset.
import carbon from "@tablekit/tokens/presets/carbon.css?raw";
import material3 from "@tablekit/tokens/presets/material3.css?raw";
import shadcn from "@tablekit/tokens/presets/shadcn.css?raw";

export type PresetId = "site" | "default" | "shadcn" | "material3" | "carbon";

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "site", label: "This site" },
  { id: "default", label: "tablekit" },
  { id: "shadcn", label: "shadcn/ui" },
  { id: "material3", label: "Material 3" },
  { id: "carbon", label: "Carbon" },
];

const host = {
  shadcn: {
    light: `--background: oklch(1 0 0); --foreground: oklch(0.141 0.005 285.823); --muted: oklch(0.967 0.001 286.375); --muted-foreground: oklch(0.552 0.016 285.938); --border: oklch(0.92 0.004 286.32); --primary: oklch(0.21 0.006 285.885); --primary-foreground: oklch(0.985 0 0); --ring: oklch(0.705 0.015 286.067); --destructive: oklch(0.577 0.245 27.325); --secondary: oklch(0.967 0.001 286.375); --secondary-foreground: oklch(0.21 0.006 285.885); --popover: oklch(1 0 0); --radius: 0.625rem;`,
    dark: `--background: oklch(0.141 0.005 285.823); --foreground: oklch(0.985 0 0); --muted: oklch(0.274 0.006 286.033); --muted-foreground: oklch(0.705 0.015 286.067); --border: oklch(1 0 0 / 10%); --primary: oklch(0.92 0.004 286.32); --primary-foreground: oklch(0.21 0.006 285.885); --ring: oklch(0.552 0.016 285.938); --destructive: oklch(0.704 0.191 22.216); --secondary: oklch(0.274 0.006 286.033); --secondary-foreground: oklch(0.985 0 0); --popover: oklch(0.21 0.006 285.885);`,
  },
  material3: {
    light: `--md-sys-color-surface: #fef7ff; --md-sys-color-on-surface: #1d1b20; --md-sys-color-surface-container: #f3edf7; --md-sys-color-surface-container-low: #f7f2fa; --md-sys-color-surface-container-lowest: #ffffff; --md-sys-color-surface-container-high: #ece6f0; --md-sys-color-surface-container-highest: #e6e0e9; --md-sys-color-on-surface-variant: #49454f; --md-sys-color-outline-variant: #cac4d0; --md-sys-color-outline: #79747e; --md-sys-color-primary: #6750a4; --md-sys-color-on-primary: #ffffff; --md-sys-color-secondary: #625b71; --md-sys-color-secondary-container: #e8def8; --md-sys-color-error: #b3261e; --md-sys-color-error-container: #f9dedc; --md-sys-color-on-error-container: #410e0b; --md-sys-color-primary-container: #eaddff; --md-sys-color-on-primary-container: #21005d; --md-sys-color-tertiary-container: #ffd8e4; --md-sys-color-on-tertiary-container: #31111d;`,
    dark: `--md-sys-color-surface: #141218; --md-sys-color-on-surface: #e6e0e9; --md-sys-color-surface-container: #211f26; --md-sys-color-surface-container-low: #1d1b20; --md-sys-color-surface-container-lowest: #0f0d13; --md-sys-color-surface-container-high: #2b2930; --md-sys-color-surface-container-highest: #36343b; --md-sys-color-on-surface-variant: #cac4d0; --md-sys-color-outline-variant: #49454f; --md-sys-color-outline: #938f99; --md-sys-color-primary: #d0bcff; --md-sys-color-on-primary: #381e72; --md-sys-color-secondary: #ccc2dc; --md-sys-color-secondary-container: #4a4458; --md-sys-color-error: #f2b8b5; --md-sys-color-error-container: #8c1d18; --md-sys-color-on-error-container: #f9dedc; --md-sys-color-primary-container: #4f378b; --md-sys-color-on-primary-container: #eaddff; --md-sys-color-tertiary-container: #633b48; --md-sys-color-on-tertiary-container: #ffd8e4;`,
  },
  carbon: {
    light: `--cds-layer-01: #f4f4f4; --cds-layer-02: #ffffff; --cds-layer-accent-01: #e0e0e0; --cds-layer-hover-01: #e8e8e8; --cds-layer-selected-01: #e0e0e0; --cds-text-primary: #161616; --cds-text-secondary: #525252; --cds-border-subtle-01: #c6c6c6; --cds-border-strong-01: #8d8d8d; --cds-interactive: #0f62fe; --cds-button-primary-hover: #0050e6; --cds-text-on-color: #ffffff; --cds-focus: #0f62fe; --cds-support-error: #da1e28; --cds-support-warning: #f1c21b; --cds-skeleton-background: #e8e8e8; --cds-tag-background-gray: #e0e0e0; --cds-tag-color-gray: #161616; --cds-tag-background-blue: #d0e2ff; --cds-tag-color-blue: #0043ce; --cds-tag-background-green: #a7f0ba; --cds-tag-color-green: #0e6027; --cds-tag-background-red: #ffd7d9; --cds-tag-color-red: #a2191f; --cds-tag-background-purple: #e8daff; --cds-tag-color-purple: #6929c4;`,
    dark: `--cds-layer-01: #262626; --cds-layer-02: #393939; --cds-layer-accent-01: #393939; --cds-layer-hover-01: #333333; --cds-layer-selected-01: #393939; --cds-text-primary: #f4f4f4; --cds-text-secondary: #c6c6c6; --cds-border-subtle-01: #393939; --cds-border-strong-01: #6f6f6f; --cds-interactive: #4589ff; --cds-button-primary-hover: #0050e6; --cds-text-on-color: #ffffff; --cds-focus: #ffffff; --cds-support-error: #fa4d56; --cds-support-warning: #f1c21b; --cds-skeleton-background: #292929; --cds-tag-background-gray: #525252; --cds-tag-color-gray: #f4f4f4; --cds-tag-background-blue: #0043ce; --cds-tag-color-blue: #d0e2ff; --cds-tag-background-green: #0e6027; --cds-tag-color-green: #a7f0ba; --cds-tag-background-red: #a2191f; --cds-tag-color-red: #ffd7d9; --cds-tag-background-purple: #6929c4; --cds-tag-color-purple: #e8daff;`,
  },
} as const;

const presetCss = { shadcn, material3, carbon };

/** Scope a :root preset to a wrapper so several presets can coexist on one page. */
function scope(css: string, id: string): string {
  return css.replace(/:root(,\s*\.radix-themes)?\s*\{/g, `[data-preset="${id}"] {`);
}

export const presetStyles =
  (Object.keys(host) as (keyof typeof host)[])
    .map(
      (id) => `
[data-preset="${id}"] { ${host[id].light} }
:root.dark [data-preset="${id}"] { ${host[id].dark} }
${scope(presetCss[id], id)}`,
    )
    .join("\n") +
  // "This site": the shadcn preset reading this page's own variables
  // (westar / moss palette from amitpatjoshi.com). No host sample needed.
  `\n${scope(shadcn, "site")}
/* The site's --border is meant for single rules on the page; as a table grid it reads heavy.
   Light: one step lighter in the westar scale (grid 500, controls 600). Dark: --muted and
   --border are one opaque mid-grey (#666461), so mix them well into the background. */
[data-preset="site"] {
  --tk-color-border: var(--color-westar-500);
  --tk-color-border-strong: var(--color-westar-600);
}
:root.dark [data-preset="site"] {
  --tk-color-header-bg: color-mix(in oklab, var(--muted) 22%, var(--background));
  --tk-color-border: color-mix(in oklab, var(--border) 32%, var(--background));
  --tk-color-border-strong: color-mix(in oklab, var(--border) 55%, var(--background));
}`;
