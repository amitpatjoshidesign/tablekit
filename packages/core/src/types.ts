/** Any object can be a row. */
export type RowData = object;

export type Align = "start" | "center" | "end";

export type FilterKind = "text" | "select" | "range";

export interface RangeFilterValue {
  min?: number | string | null;
  max?: number | string | null;
}

export type FilterValue = string | string[] | RangeFilterValue;

export interface ColumnDef<T extends RowData = RowData> {
  /** Unique, stable id. Used as the state key for sorting, filters, visibility and sizing. */
  id: string;
  /** Visible header label. Falls back to `id`. */
  header?: string;
  /** Property name on the row, or a function that derives the cell value. Defaults to `id`. */
  accessor?: keyof T | ((row: T) => unknown);
  /** Default `true`. */
  sortable?: boolean;
  /** Custom comparator. Return <0, 0, >0. Receives the raw accessor values. */
  sortFn?: (a: unknown, b: unknown, rowA: T, rowB: T) => number;
  /** Which filter UI the column offers. `false`/undefined = not column-filterable. */
  filter?: FilterKind | false;
  /** Custom column filter predicate. */
  filterFn?: (value: unknown, filterValue: FilterValue, row: T) => boolean;
  /** Include this column in the global search. Default `true`. */
  searchable?: boolean;
  /** Can the user hide this column from the column menu. Default `true`. */
  hideable?: boolean;
  /** Can the user resize this column. Default `true`. */
  resizable?: boolean;
  /** Initial width in px. */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Pin to the start edge (sticky while scrolling horizontally). Initial value; users can change it. */
  pinned?: boolean;
  /** Can the user pin or unpin this column from the column menu. Default `true`. */
  pinnable?: boolean;
  /** Can the user move this column from the column menu. Default `true`. */
  reorderable?: boolean;
  /** Lower number = more important. Used by `responsive="priority"` to drop columns on narrow screens. */
  priority?: number;
  align?: Align;
  /** Free-form data for renderers (e.g. schema column config). */
  meta?: Record<string, unknown>;
}

export interface SortRule {
  id: string;
  desc: boolean;
}

export interface ColumnFilter {
  id: string;
  value: FilterValue;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export type SelectionMode = "none" | "single" | "multi";

export interface TableState {
  sorting: SortRule[];
  globalFilter: string;
  columnFilters: ColumnFilter[];
  pagination: PaginationState;
  /** Keyed by row id. */
  rowSelection: Record<string, boolean>;
  /** Keyed by column id. `false` = hidden. Missing = visible. */
  columnVisibility: Record<string, boolean>;
  /** Keyed by column id, width in px. */
  columnSizing: Record<string, number>;
  /** Column ids in display order. Empty = declaration order; ids not listed go at the end. */
  columnOrder: string[];
  /** Keyed by column id. Overrides `ColumnDef.pinned`; missing = use the definition. */
  columnPinning: Record<string, boolean>;
}

export type Updater<S> = S | ((prev: S) => S);

export interface TableOptions<T extends RowData = RowData> {
  data: readonly T[];
  columns: readonly ColumnDef<T>[];
  /** Stable row id. Defaults to `row.id` when present, otherwise the row index. */
  getRowId?: (row: T, index: number) => string;
  selectionMode?: SelectionMode;
  /** Set when the server sorts. Rows are passed through untouched. */
  manualSorting?: boolean;
  /** Set when the server filters. */
  manualFiltering?: boolean;
  /** Set when the server paginates. `data` is treated as the current page. */
  manualPagination?: boolean;
  /** Total rows on the server. Required for `manualPagination` page counts. */
  rowCount?: number;
  /** Allow sorting by more than one column (shift+click). Default `true`. */
  enableMultiSort?: boolean;
  /** Pagination on/off. When off, all rows are returned on one page. Default `true`. */
  enablePagination?: boolean;
}

export interface Row<T extends RowData = RowData> {
  id: string;
  index: number;
  original: T;
  /** Raw value for a column id. */
  getValue: (columnId: string) => unknown;
}

export interface RowModel<T extends RowData = RowData> {
  /** Rows on the current page, after filter + sort. */
  rows: Row<T>[];
  /** All rows after filtering + sorting (every page). */
  filteredRows: Row<T>[];
  /** All rows, untouched. */
  allRows: Row<T>[];
  pageCount: number;
  /** Total rows after filtering (or `rowCount` in manual mode). */
  totalRows: number;
}
