// Zod-free, so the main @tablekit/core entry can export these without pulling in zod.
import type { TONES } from "./schema";

/**
 * Badge icons: a closed set of Lucide icon names, so generated schemas can't reference icons
 * that don't exist. The React package maps each name to its Lucide component.
 */
export const BADGE_ICONS = [
  "circle-check",
  "check",
  "circle-x",
  "x",
  "triangle-alert",
  "circle-alert",
  "info",
  "circle-dashed",
  "circle",
  "circle-dot",
  "circle-pause",
  "clock",
  "hourglass",
  "loader",
  "refresh-cw",
  "ban",
  "lock",
  "shield-check",
  "arrow-up",
  "arrow-down",
  "arrow-right",
  "undo-2",
  "send",
  "truck",
  "star",
  "zap",
  "sparkles",
  "eye",
] as const;

/** Icon each tone uses when `badge.indicator` is "icon" and no per-value icon is given. */
export const TONE_ICONS: Record<(typeof TONES)[number], BadgeIconName> = {
  neutral: "circle-dashed",
  info: "info",
  success: "circle-check",
  warning: "triangle-alert",
  danger: "circle-x",
  accent: "sparkles",
};

export type BadgeIconName = (typeof BADGE_ICONS)[number];

/** Icons for row / bulk actions: a closed set of Lucide names, mapped in @tablekit/react. */
export const ACTION_ICONS = [
  "eye",
  "pencil",
  "copy",
  "download",
  "upload",
  "share-2",
  "send",
  "external-link",
  "refresh-cw",
  "undo-2",
  "archive",
  "trash-2",
  "ban",
  "lock",
  "unlock",
  "check",
  "x",
  "user-plus",
  "mail",
  "receipt",
  "flag",
  "star",
] as const;

export type ActionIconName = (typeof ACTION_ICONS)[number];

/** How an actions column presents its actions. */
/** Multiple row actions go in a ⋯ menu or as icon buttons, never as a row of text buttons. */
export const ACTIONS_DISPLAYS = ["menu", "inline"] as const;
export type ActionsDisplay = (typeof ACTIONS_DISPLAYS)[number];
