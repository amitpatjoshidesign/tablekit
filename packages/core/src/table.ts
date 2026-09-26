import { filterRows } from "./filtering";
import { clampPagination, DEFAULT_PAGE_SIZE, getPageCount, paginate } from "./pagination";
import { sortRows } from "./sorting";
import type { RowData, RowModel, TableOptions, TableState, Updater } from "./types";
import { buildRows, functionalUpdate } from "./utils";

export function createInitialState(initial: Partial<TableState> = {}): TableState {
  return {
    sorting: [],
    globalFilter: "",
    columnFilters: [],
    pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE },
    rowSelection: {},
    columnVisibility: {},
    columnSizing: {},
    columnOrder: [],
    columnPinning: {},
    ...initial,
  };
}

/**
 * The whole pipeline as one pure function: rows → filter → sort → paginate.
 * Every adapter (React, Vue, vanilla) calls this.
 */
export function getRowModel<T extends RowData>(
  options: TableOptions<T>,
  state: TableState,
): RowModel<T> {
  const allRows = buildRows(options);
  const filtered = options.manualFiltering
    ? allRows
    : filterRows(allRows, options.columns, state.globalFilter, state.columnFilters);
  const sorted = options.manualSorting
    ? filtered
    : sortRows(filtered, state.sorting, options.columns);

  const paginationOn = options.enablePagination !== false;
  const totalRows = options.manualPagination ? (options.rowCount ?? sorted.length) : sorted.length;

  if (!paginationOn) {
    return { rows: sorted, filteredRows: sorted, allRows, pageCount: 1, totalRows };
  }

  const pageCount = getPageCount(totalRows, state.pagination.pageSize);
  const rows = options.manualPagination
    ? sorted
    : paginate(sorted, clampPagination(state.pagination, totalRows));

  return { rows, filteredRows: sorted, allRows, pageCount, totalRows };
}

export type Listener = (state: TableState) => void;

export interface TableStore<T extends RowData> {
  getState(): TableState;
  setState(updater: Updater<TableState>): void;
  getRowModel(): RowModel<T>;
  setOptions(options: TableOptions<T>): void;
  subscribe(listener: Listener): () => void;
}

/**
 * Framework-agnostic store. React users should prefer `useTable` from `@tablekit/react`.
 *
 * ```ts
 * const table = createTable({ data, columns });
 * table.subscribe(render);
 * table.setState((s) => ({ ...s, sorting: toggleSort(s.sorting, "name") }));
 * ```
 */
export function createTable<T extends RowData>(
  options: TableOptions<T>,
  initialState?: Partial<TableState>,
): TableStore<T> {
  let opts = options;
  let state = createInitialState(initialState);
  let cached: RowModel<T> | null = null;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState(updater) {
      state = functionalUpdate(updater, state);
      cached = null;
      for (const l of listeners) l(state);
    },
    getRowModel() {
      if (!cached) cached = getRowModel(opts, state);
      return cached;
    },
    setOptions(next) {
      opts = next;
      cached = null;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
