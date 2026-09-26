// Lucide icons for the docs site's Astro templates and vanilla scripts (lucide-static gives
// raw SVG strings). React islands use the table's own lucide-react icons.
import { ArrowRight, Check, Copy, Menu, Search } from "lucide-static";

/** Resize a Lucide SVG string and swap its class for ours. */
export function icon(svg: string, className: string, size = 16, strokeWidth = 1.75): string {
  return svg
    .replace(/class="[^"]*"/, `class="${className}" aria-hidden="true" focusable="false"`)
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(/stroke-width="2"/, `stroke-width="${strokeWidth}"`);
}

export const icons = {
  search: icon(Search, "search-icon"),
  menu: icon(Menu, "menu-icon", 18),
  copy: icon(Copy, "copy-icon"),
  check: icon(Check, "check-icon", 16, 2.25),
  arrowRight: icon(ArrowRight, "arrow-icon"),
};
