import type { PaginationState } from "./types";
import { clamp } from "./utils";

export const DEFAULT_PAGE_SIZE = 10;

export function getPageCount(totalRows: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(totalRows / pageSize));
}

export function clampPagination(state: PaginationState, totalRows: number): PaginationState {
  const pageCount = getPageCount(totalRows, state.pageSize);
  const pageIndex = clamp(state.pageIndex, 0, pageCount - 1);
  return pageIndex === state.pageIndex ? state : { ...state, pageIndex };
}

export function paginate<R>(rows: R[], state: PaginationState): R[] {
  const start = state.pageIndex * state.pageSize;
  return rows.slice(start, start + state.pageSize);
}

/** 1-based "Showing X–Y of Z" numbers. */
export function getPageRange(
  state: PaginationState,
  totalRows: number,
): { from: number; to: number; total: number } {
  if (totalRows === 0) return { from: 0, to: 0, total: 0 };
  const from = state.pageIndex * state.pageSize + 1;
  const to = Math.min(totalRows, from + state.pageSize - 1);
  return { from, to, total: totalRows };
}

/**
 * Compact page list with ellipses, e.g. [1, "…", 4, 5, 6, "…", 12].
 * Pages are 1-based for display.
 */
export function getPageItems(pageIndex: number, pageCount: number, siblings = 1): (number | "…")[] {
  const current = pageIndex + 1;
  const total = pageCount;
  const window = siblings * 2 + 5;
  if (total <= window) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(current - siblings, 2);
  const right = Math.min(current + siblings, total - 1);
  const items: (number | "…")[] = [1];
  if (left > 2) items.push("…");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < total - 1) items.push("…");
  items.push(total);
  return items;
}
