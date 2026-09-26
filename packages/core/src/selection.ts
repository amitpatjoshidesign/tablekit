import type { Row, RowData, SelectionMode } from "./types";

export type RowSelection = Record<string, boolean>;

export function toggleRow(
  selection: RowSelection,
  rowId: string,
  mode: SelectionMode,
  value?: boolean,
): RowSelection {
  if (mode === "none") return selection;
  const next = value ?? !selection[rowId];
  if (mode === "single") return next ? { [rowId]: true } : {};
  const copy = { ...selection };
  if (next) copy[rowId] = true;
  else delete copy[rowId];
  return copy;
}

/** Select or clear every row in `rows` (usually the current page), keeping other selections. */
export function toggleRows<T extends RowData>(
  selection: RowSelection,
  rows: readonly Row<T>[],
  value: boolean,
): RowSelection {
  const copy = { ...selection };
  for (const row of rows) {
    if (value) copy[row.id] = true;
    else delete copy[row.id];
  }
  return copy;
}

export function getSelectionStatus<T extends RowData>(
  selection: RowSelection,
  rows: readonly Row<T>[],
): "none" | "some" | "all" {
  if (rows.length === 0) return "none";
  let count = 0;
  for (const row of rows) if (selection[row.id]) count++;
  if (count === 0) return "none";
  return count === rows.length ? "all" : "some";
}

export function getSelectedIds(selection: RowSelection): string[] {
  return Object.keys(selection).filter((id) => selection[id]);
}

export function getSelectedRows<T extends RowData>(
  selection: RowSelection,
  rows: readonly Row<T>[],
): Row<T>[] {
  return rows.filter((r) => selection[r.id]);
}
