import type { ColumnDef, Row, RowData, TableOptions, Updater } from "./types";

export function functionalUpdate<S>(updater: Updater<S>, prev: S): S {
  return typeof updater === "function" ? (updater as (p: S) => S)(prev) : updater;
}

export function getColumnValue<T extends RowData>(row: T, column: ColumnDef<T>): unknown {
  const { accessor } = column;
  if (typeof accessor === "function") return accessor(row);
  const key = (accessor ?? column.id) as keyof T;
  return row[key];
}

export function defaultGetRowId<T extends RowData>(row: T, index: number): string {
  const id = (row as { id?: unknown }).id;
  return id === undefined || id === null ? String(index) : String(id);
}

export function buildRows<T extends RowData>(options: TableOptions<T>): Row<T>[] {
  const getRowId = options.getRowId ?? defaultGetRowId;
  const byId = new Map(options.columns.map((c) => [c.id, c]));
  return options.data.map((original, index) => {
    const cache = new Map<string, unknown>();
    return {
      id: getRowId(original, index),
      index,
      original,
      getValue(columnId: string) {
        if (cache.has(columnId)) return cache.get(columnId);
        const column = byId.get(columnId);
        const value = column
          ? getColumnValue(original, column)
          : (original as Record<string, unknown>)[columnId];
        cache.set(columnId, value);
        return value;
      },
    };
  });
}

/** Convert a value into something comparable: number, timestamp or lowercase string. */
export function toComparable(value: unknown): number | string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") return value;
  return String(value);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
