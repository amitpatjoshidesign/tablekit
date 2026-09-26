/**
 * Single source of truth for tablekit tokens.
 * `scripts/build.mjs` turns this into dist/tokens.css (CSS vars) and dist/tokens.json (W3C DTCG).
 *
 * Semantic values may reference primitives with `{group.step}` — same alias syntax as DTCG.
 */

export const primitives = {
  neutral: {
    0: "#ffffff",
    25: "#fbfbfc",
    50: "#f6f7f9",
    100: "#eef0f3",
    200: "#e2e5ea",
    300: "#cdd2da",
    400: "#9aa2b1",
    500: "#6b7385",
    600: "#4f5667",
    700: "#3a4050",
    800: "#262a35",
    850: "#1d2029",
    900: "#16181f",
    950: "#0f1116",
  },
  blue: {
    50: "#f2f5fe",
    100: "#e6ebfd",
    200: "#cdd6fb",
    400: "#7d90ec",
    500: "#4a67e0",
    600: "#3451d1",
    700: "#2a41a8",
    900: "#1a2766",
    950: "#141c45",
  },
};

/** Color tokens that change between light and dark. */
export const color = {
  light: {
    surface: "{neutral.0}",
    "surface-raised": "{neutral.0}",
    "header-bg": "{neutral.50}",
    "row-hover": "{neutral.25}",
    "row-stripe": "{neutral.25}",
    "row-selected": "{blue.50}",
    text: "{neutral.900}",
    "text-muted": "{neutral.500}",
    "text-header": "{neutral.600}",
    border: "{neutral.200}",
    "border-strong": "{neutral.300}",
    accent: "{blue.600}",
    "accent-hover": "{blue.700}",
    "accent-contrast": "{neutral.0}",
    focus: "{blue.500}",
    danger: "#b42323",
    overlay: "rgba(15, 17, 22, 0.08)",
    skeleton: "{neutral.100}",
    /** Behind inline brand logos: none, the mark sits on the row. */
    "logo-bg": "transparent",
  },
  dark: {
    surface: "{neutral.900}",
    "surface-raised": "{neutral.850}",
    "header-bg": "#1b1e26",
    "row-hover": "#1f222b",
    "row-stripe": "#191b23",
    "row-selected": "{blue.950}",
    text: "#eceef2",
    "text-muted": "{neutral.400}",
    "text-header": "#c3c8d2",
    border: "#2a2e3a",
    "border-strong": "{neutral.700}",
    accent: "{blue.400}",
    "accent-hover": "{blue.200}",
    "accent-contrast": "{neutral.950}",
    focus: "{blue.400}",
    danger: "#f59b9b",
    overlay: "rgba(0, 0, 0, 0.4)",
    skeleton: "{neutral.800}",
    /** Behind inline brand logos: none. Give dark marks a light variant via avatar.imageDarkField. */
    "logo-bg": "transparent",
    /** Circle behind logo avatars (logo: "circle"). Light themes derive it from text + surface. */
    "logo-fill": "{neutral.800}",
  },
};

/** Badge tones: background + foreground pairs, all ≥ 4.5:1 contrast. */
export const tone = {
  light: {
    neutral: ["{neutral.100}", "{neutral.700}"],
    info: ["#e3effd", "#1d5fae"],
    success: ["#e3f5ea", "#1c7a45"],
    warning: ["#fcf1dc", "#8a5a00"],
    danger: ["#fde8e8", "#b42323"],
    accent: ["{blue.100}", "{blue.700}"],
  },
  dark: {
    neutral: ["{neutral.800}", "#c3c8d2"],
    info: ["#132a45", "#8cbcf5"],
    success: ["#11321f", "#7fd6a1"],
    warning: ["#36280b", "#f0c46b"],
    danger: ["#3d1717", "#f59b9b"],
    accent: ["{blue.950}", "{blue.200}"],
  },
};

/** Theme-independent tokens. */
export const base = {
  font: {
    family: {
      $type: "fontFamily",
      // Inter (github.com/rsms/inter), then system fallbacks.
      $value:
        "'Inter Variable', InterVariable, Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
    "family-mono": {
      $type: "fontFamily",
      $value: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    },
    /**
     * Inter's number features for every figure in the table:
     * tnum = tabular (equal-width) digits so columns line up,
     * zero = slashed zero (0 vs O), ss01 = open digits (alternate 1, 3, 4, 6, 9).
     */
    "feature-numeric": { $value: '"tnum" 1, "zero" 1, "ss01" 1' },
    size: { $type: "dimension", $value: "14px" },
    "size-sm": { $type: "dimension", $value: "12px" },
    "weight-regular": { $type: "fontWeight", $value: 400 },
    "weight-medium": { $type: "fontWeight", $value: 500 },
    "weight-semibold": { $type: "fontWeight", $value: 600 },
    "line-height": { $type: "number", $value: 1.43 },
  },
  /** Ring drawn around image avatars; each person gets one of 8 pastels by name. */
  avatar: {
    "ring-width": { $type: "dimension", $value: "2px" },
    "ring-1": { $type: "color", $value: "#ffc98b" },
    "ring-2": { $type: "color", $value: "#e9d3a0" },
    "ring-3": { $type: "color", $value: "#ff8f8f" },
    "ring-4": { $type: "color", $value: "#f8c3d9" },
    "ring-5": { $type: "color", $value: "#f2c4bd" },
    "ring-6": { $type: "color", $value: "#b7d5c4" },
    "ring-7": { $type: "color", $value: "#bddbb6" },
    "ring-8": { $type: "color", $value: "#ffe3b0" },
  },
  radius: {
    sm: { $type: "dimension", $value: "4px" },
    md: { $type: "dimension", $value: "8px" },
    lg: { $type: "dimension", $value: "12px" },
    pill: { $type: "dimension", $value: "999px" },
  },
  space: {
    "cell-x": { $type: "dimension", $value: "16px" },
    "cell-y-compact": { $type: "dimension", $value: "6px" },
    "cell-y-default": { $type: "dimension", $value: "10px" },
    "cell-y-comfortable": { $type: "dimension", $value: "14px" },
    "cell-x-compact": { $type: "dimension", $value: "12px" },
    "toolbar-gap": { $type: "dimension", $value: "8px" },
    "touch-target": { $type: "dimension", $value: "44px" },
  },
  shadow: {
    popover: {
      $type: "shadow",
      $value: [
        { color: "#0f11161a", offsetX: "0px", offsetY: "8px", blur: "24px", spread: "-4px" },
        { color: "#0f11160f", offsetX: "0px", offsetY: "2px", blur: "6px", spread: "0px" },
      ],
    },
  },
  motion: {
    duration: { $type: "duration", $value: "140ms" },
    easing: { $type: "cubicBezier", $value: [0.2, 0, 0, 1] },
  },
};
