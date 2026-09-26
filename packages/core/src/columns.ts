import type { ColumnDef, RowData } from "./types";
import { clamp } from "./utils";

export const DEFAULT_MIN_WIDTH = 64;
export const DEFAULT_MAX_WIDTH = 800;

export function isColumnVisible(visibility: Record<string, boolean>, columnId: string): boolean {
  return visibility[columnId] !== false;
}

export function isColumnPinned<T extends RowData>(
  column: ColumnDef<T>,
  pinning: Record<string, boolean> = {},
): boolean {
  return pinning[column.id] ?? column.pinned === true;
}

/**
 * Every column in display order, with `pinned` resolved from state: pinned columns first,
 * then the rest, each group in `order` (ids missing from `order` keep declaration order at the end).
 */
export function getOrderedColumns<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  order: readonly string[] = [],
  pinning: Record<string, boolean> = {},
): ColumnDef<T>[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  const sorted = columns
    .map((c, i) => ({ c, r: rank.get(c.id) ?? order.length + i }))
    .sort((a, b) => a.r - b.r)
    .map(({ c }) => {
      const pinned = isColumnPinned(c, pinning);
      return pinned === (c.pinned === true) ? c : { ...c, pinned };
    });
  return [...sorted.filter((c) => c.pinned), ...sorted.filter((c) => !c.pinned)];
}

export function getVisibleColumns<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  visibility: Record<string, boolean>,
  order?: readonly string[],
  pinning?: Record<string, boolean>,
): ColumnDef<T>[] {
  return getOrderedColumns(columns, order, pinning).filter((c) =>
    isColumnVisible(visibility, c.id),
  );
}

/** Full column order as ids (resolves an empty or partial `order`). */
export function resolveColumnOrder<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  order: readonly string[] = [],
  pinning: Record<string, boolean> = {},
): string[] {
  return getOrderedColumns(columns, order, pinning).map((c) => c.id);
}

/**
 * Move `columnId` to where `targetId` is now. Both must be in the same group (pinned or not);
 * otherwise the order is returned unchanged. Returns a full id list.
 */
export function moveColumn<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  order: readonly string[],
  pinning: Record<string, boolean>,
  columnId: string,
  targetId: string,
): string[] {
  const ordered = getOrderedColumns(columns, order, pinning);
  const ids = ordered.map((c) => c.id);
  const from = ids.indexOf(columnId);
  const to = ids.indexOf(targetId);
  if (from < 0 || to < 0 || from === to) return ids;
  if (ordered[from]?.pinned !== ordered[to]?.pinned) return ids;
  ids.splice(from, 1);
  ids.splice(to, 0, columnId);
  return ids;
}

/**
 * Pin or unpin a column. It lands at the boundary between the groups: the end of the
 * pinned group when pinned, the start of the unpinned group when unpinned.
 */
export function setColumnPinned<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  order: readonly string[],
  pinning: Record<string, boolean>,
  columnId: string,
  pinned: boolean,
): { columnOrder: string[]; columnPinning: Record<string, boolean> } {
  const nextPinning = { ...pinning, [columnId]: pinned };
  const ordered = getOrderedColumns(columns, order, pinning).filter((c) => c.id !== columnId);
  const boundary = ordered.filter((c) => c.pinned).length;
  const ids = ordered.map((c) => c.id);
  ids.splice(boundary, 0, columnId);
  return { columnOrder: ids, columnPinning: nextPinning };
}

export function toggleColumnVisibility(
  visibility: Record<string, boolean>,
  columnId: string,
  value?: boolean,
): Record<string, boolean> {
  const next = value ?? !isColumnVisible(visibility, columnId);
  return { ...visibility, [columnId]: next };
}

export function getColumnWidth<T extends RowData>(
  column: ColumnDef<T>,
  sizing: Record<string, number>,
): number | undefined {
  return sizing[column.id] ?? column.width;
}

export function resizeColumn<T extends RowData>(
  sizing: Record<string, number>,
  column: ColumnDef<T>,
  width: number,
): Record<string, number> {
  const w = clamp(
    Math.round(width),
    column.minWidth ?? DEFAULT_MIN_WIDTH,
    column.maxWidth ?? DEFAULT_MAX_WIDTH,
  );
  return { ...sizing, [column.id]: w };
}

/**
 * Left offsets (px) for pinned columns so each can be `position: sticky; left: <offset>`.
 * `leading` is extra width before the first column (e.g. the selection checkbox).
 */
export function getPinnedOffsets<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  sizing: Record<string, number>,
  leading = 0,
  fallbackWidth = 160,
): Record<string, number> {
  const offsets: Record<string, number> = {};
  let left = leading;
  for (const c of columns) {
    if (!c.pinned) break;
    offsets[c.id] = left;
    left += getColumnWidth(c, sizing) ?? fallbackWidth;
  }
  return offsets;
}

/** Columns to show at a given priority cutoff. Columns without a priority always show. */
export function getColumnsForPriority<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  maxPriority: number,
): ColumnDef<T>[] {
  return columns.filter((c) => c.pinned || c.priority === undefined || c.priority <= maxPriority);
}

/** Width a column without an explicit width is assumed to need. */
export const DEFAULT_AUTO_WIDTH = 120;
/** Width assumed for a pinned column without an explicit width. */
export const DEFAULT_PINNED_WIDTH = 200;

/** Minimum width (px) the columns need side by side, plus `leading` (e.g. the selection column). */
export function getRequiredWidth<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  sizing: Record<string, number>,
  leading = 0,
): number {
  return columns.reduce(
    (sum, c) =>
      sum + (getColumnWidth(c, sizing) ?? (c.pinned ? DEFAULT_PINNED_WIDTH : DEFAULT_AUTO_WIDTH)),
    leading,
  );
}

/**
 * Responsive "priority" mode: keep as many columns as fit in `width`. Drops the least
 * important priority level (5, then 4, …) until the rest fit. Columns without a priority,
 * and pinned columns, always stay; if even they don't fit, the table scrolls.
 */
export function fitColumnsToWidth<T extends RowData>(
  columns: readonly ColumnDef<T>[],
  sizing: Record<string, number>,
  width: number,
  leading = 0,
): ColumnDef<T>[] {
  for (let max = 5; max >= 1; max--) {
    const kept = getColumnsForPriority(columns, max);
    if (getRequiredWidth(kept, sizing, leading) <= width) return kept;
  }
  return getColumnsForPriority(columns, 0);
}
