# @tablekit/tokens

Design tokens for tablekit.

- `tokens.css`: CSS custom properties (`--tk-*`) with zero-specificity defaults, light and dark themes (`prefers-color-scheme`, `data-tk-theme`, `data-theme`, `.dark`).
- `tokens.json`: W3C DTCG format with sets `primitives`, `base`, `light` and `dark`, plus `$themes`. Import it into Tokens Studio for Figma or Style Dictionary.
- `presets/*.css`: map tablekit tokens onto **shadcn/ui**, **Material 3**, **IBM Carbon** or **Radix Themes** variables.

The single source of truth is `src/tokens.mjs`. Run `npm run build` to regenerate `dist/`.
