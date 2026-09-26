import type { ColumnDef, Row, RowData, SortRule } from "./types";
import { toComparable } from "./utils";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** Default comparator. Nulls/empties always sort last, regardless of direction (handled in sortRows). */
export function compareValues(a: unknown, b: unknown): number {
  const ca = toComparable(a);
  const cb = toComparable(b);
  if (ca === cb) return 0;
  if (ca === null) return 1;
  if (cb === null) return -1;
  if (typeof ca === "number" && typeof cb === "number") return ca - cb;
  return collator.compare(String(ca), String(cb));
}

export function sortRows<T extends RowData>(
  rows: Row<T>[],
  sorting: readonly SortRule[],
  columns: readonly ColumnDef<T>[],
): Row<T>[] {
  if (sorting.length === 0) return rows;
  const byId = new Map(columns.map((c) => [c.id, c]));
  const rules = sorting.filter((r) => byId.has(r.id));
  if (rules.length === 0) return rows;

  // Array.prototype.sort is stable; fall back to original index for determinism.
  return [...rows].sort((ra, rb) => {
    for (const rule of rules) {
      const column = byId.get(rule.id) as ColumnDef<T>;
      const va = ra.getValue(rule.id);
      const vb = rb.getValue(rule.id);
      const aEmpty = toComparable(va) === null;
      const bEmpty = toComparable(vb) === null;
      // Keep empties at the bottom in both directions.
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
      const result = column.sortFn
        ? column.sortFn(va, vb, ra.original, rb.original)
        : compareValues(va, vb);
      if (result !== 0) return rule.desc ? -result : result;
    }
    return ra.index - rb.index;
  });
}

/**
 * Cycle a column's sort: none → asc → desc → none.
 * With `multi`, other rules are kept (shift+click); otherwise they're replaced.
 */
export function toggleSort(
  sorting: readonly SortRule[],
  columnId: string,
  multi = false,
): SortRule[] {
  const existing = sorting.find((r) => r.id === columnId);
  let next: SortRule | null;
  if (!existing) next = { id: columnId, desc: false };
  else if (!existing.desc) next = { id: columnId, desc: true };
  else next = null;

  if (!multi) return next ? [next] : [];
  const rest = sorting.filter((r) => r.id !== columnId);
  return next ? [...rest, next] : rest;
}

export function getSortDirection(
  sorting: readonly SortRule[],
  columnId: string,
): "asc" | "desc" | false {
  const rule = sorting.find((r) => r.id === columnId);
  if (!rule) return false;
  return rule.desc ? "desc" : "asc";
}

/** 1-based position in a multi-sort, or 0 if unsorted. */
export function getSortIndex(sorting: readonly SortRule[], columnId: string): number {
  return sorting.findIndex((r) => r.id === columnId) + 1;
}
