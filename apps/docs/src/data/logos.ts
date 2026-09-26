// Bank & payment brand marks from Simple Icons (https://simpleicons.org, CC0-1.0).
// Simple Icons ships each mark as a single SVG path plus the brand's official hex colour;
// we render that into a data: URL so it can feed an avatar column's `imageField`.
// Brand marks are trademarks of their owners: use them only to refer to that bank.
import {
  type SimpleIcon,
  siAxisbank,
  siBankofamerica,
  siBarclays,
  siChase,
  siDeutschebank,
  siHsbc,
  siIcicibank,
} from "simple-icons";

export interface Bank {
  name: string;
  slug: string;
  logo: string;
  /** The same mark for dark themes (feeds `avatar.imageDarkField`). */
  logoDark: string;
  /** Brand colour, e.g. for charts. */
  hex: string;
}

const toDataUrl = (icon: SimpleIcon, hex: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(icon.svg.replace("<svg ", `<svg fill="#${hex}" `))}`;

// ---- Dark variant: the brand colour, lightened only as much as it needs -------------------
const rgb = (hex: string) => [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const luminance = (c: number[]) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
/** The lightest dark-theme logo fill in the presets (Carbon layer-02); darker fills pass too. */
const DARK_FILL = rgb("393939");
/** WCAG 1.4.11: graphics need 3:1 against what's behind them. */
function forDark(hex: string): string {
  const base = rgb(hex);
  for (let t = 0; t <= 1; t += 0.05) {
    const c = base.map((v) => Math.round(v + (255 - v) * t));
    if (contrast(c, DARK_FILL) >= 3) return c.map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  return "ffffff";
}

const bank = (icon: SimpleIcon, name = icon.title): Bank => ({
  name,
  slug: icon.slug,
  logo: toDataUrl(icon, icon.hex),
  logoDark: toDataUrl(icon, forDark(icon.hex)),
  hex: `#${icon.hex}`,
});

// Only banks whose Simple Icons entry is the compact symbol mark (not a wordmark), so it reads at
// text size. HDFC Bank and Paytm are left out on purpose: their open-library marks are wrong at
// small sizes (HDFC's official mark is multi-colour; Paytm only ships its wordmark). Supply their
// official assets through `imageField` instead.
export const banks: Bank[] = [
  bank(siIcicibank),
  bank(siAxisbank),
  bank(siHsbc),
  bank(siBarclays),
  bank(siDeutschebank),
  bank(siChase, "JPMorgan Chase"),
  bank(siBankofamerica),
];
