import type { ColumnDef, ColumnFilter, FilterValue, RangeFilterValue, Row, RowData } from "./types";
import { toComparable } from "./utils";

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stringify).join(" ");
  if (typeof value === "object") return Object.values(value).map(stringify).join(" ");
  return String(value);
}

export function textFilter(value: unknown, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return stringify(value).toLowerCase().includes(q);
}

export function selectFilter(value: unknown, selected: readonly string[]): boolean {
  if (selected.length === 0) return true;
  if (Array.isArray(value)) return value.some((v) => selected.includes(String(v)));
  return selected.includes(String(value));
}

function toRangeNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  const asNumber = Number(v);
  if (!Number.isNaN(asNumber)) return asNumber;
  const asDate = Date.parse(String(v));
  return Number.isNaN(asDate) ? null : asDate;
}

export function rangeFilter(value: unknown, range: RangeFilterValue): boolean {
  const min = toRangeNumber(range.min);
  const max = toRangeNumber(range.max);
  if (min === null && max === null) return true;
  const n = toRangeNumber(value);
  if (n === null) return false;
  if (min !== null && n < min) return false;
  if (max !== null && n > max) return false;
  return true;
}

export function isFilterActive(value: FilterValue | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return toComparable(value.min) !== null || toComparable(value.max) !== null;
}

function matchesColumnFilter<T extends RowData>(
  row: Row<T>,
  column: ColumnDef<T>,
  filterValue: FilterValue,
): boolean {
  const value = row.getValue(column.id);
  if (column.filterFn) return column.filterFn(value, filterValue, row.original);
  if (typeof filterValue === "string") return textFilter(value, filterValue);
  if (Array.isArray(filterValue)) return selectFilter(value, filterValue);
  return rangeFilter(value, filterValue);
}

export function filterRows<T extends RowData>(
  rows: Row<T>[],
  columns: readonly ColumnDef<T>[],
  globalFilter: string,
  columnFilters: readonly ColumnFilter[],
): Row<T>[] {
  const active = columnFilters.filter((f) => isFilterActive(f.value));
  const query = globalFilter.trim();
  if (!query && active.length === 0) return rows;

  const byId = new Map(columns.map((c) => [c.id, c]));
  const searchable = columns.filter((c) => c.searchable !== false);

  return rows.filter((row) => {
    for (const f of active) {
      const column = byId.get(f.id);
      if (column && !matchesColumnFilter(row, column, f.value)) return false;
    }
    if (query) return searchable.some((c) => textFilter(row.getValue(c.id), query));
    return true;
  });
}

/** Set (or clear, when inactive) the filter for one column. */
export function setColumnFilter(
  filters: readonly ColumnFilter[],
  columnId: string,
  value: FilterValue | undefined,
): ColumnFilter[] {
  const rest = filters.filter((f) => f.id !== columnId);
  return value !== undefined && isFilterActive(value) ? [...rest, { id: columnId, value }] : rest;
}

/** Unique values for a column — use to build `select` filter options. */
export function getFacetValues<T extends RowData>(rows: Row<T>[], columnId: string): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const v = row.getValue(columnId);
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v)) for (const item of v) set.add(String(item));
    else set.add(String(v));
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
