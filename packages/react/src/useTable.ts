import {
  type ColumnDef,
  createInitialState,
  type FilterValue,
  functionalUpdate,
  getOrderedColumns,
  getRowModel,
  getSelectionStatus,
  getSortDirection,
  getSortIndex,
  getVisibleColumns,
  moveColumn as moveColumnCore,
  type Row,
  type RowData,
  type RowModel,
  resizeColumn as resizeColumnCore,
  type SortRule,
  setColumnFilter as setColumnFilterCore,
  setColumnPinned as setColumnPinnedCore,
  type TableOptions,
  type TableState,
  toggleColumnVisibility as toggleColumnVisibilityCore,
  toggleRow,
  toggleRows,
  toggleSort as toggleSortCore,
  type Updater,
} from "@tablekit/core";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";

export interface CellContext<T extends RowData> {
  row: Row<T>;
  column: ReactColumnDef<T>;
  value: unknown;
  table: TableInstance<T>;
}

/** Core ColumnDef plus React renderers. */
export interface ReactColumnDef<T extends RowData = RowData> extends ColumnDef<T> {
  /** Custom cell renderer. Return a string for plain text. */
  cell?: (ctx: CellContext<T>) => ReactNode;
  /** Plain-text version of the cell, used for card labels, titles and screen-reader summaries. */
  text?: (ctx: CellContext<T>) => string;
  /** Display label for `select` filter options (e.g. "in_progress" → "In progress"). */
  optionLabel?: (value: string) => string;
  /** Input type for `range` filters. Default `number`. */
  rangeType?: "number" | "date";
  /** Row-actions column: rendered in the card header in stacked layout. */
  isActions?: boolean;
}

export interface UseTableOptions<T extends RowData> extends TableOptions<T> {
  columns: readonly ReactColumnDef<T>[];
  /** Uncontrolled starting state. */
  initialState?: Partial<TableState>;
  /** Controlled state. Any key you pass here is owned by you; the rest stays internal. */
  state?: Partial<TableState>;
  /** Called with the full next state on every change. */
  onStateChange?: (state: TableState) => void;
  /** Convenience: called with selected row ids whenever selection changes. */
  onSelectionChange?: (ids: string[]) => void;
}

export interface TableInstance<T extends RowData = RowData> {
  options: UseTableOptions<T>;
  state: TableState;
  rowModel: RowModel<T>;
  columns: readonly ReactColumnDef<T>[];
  /** Every column in display order (pinned first), `pinned` resolved from state. */
  orderedColumns: ReactColumnDef<T>[];
  visibleColumns: ReactColumnDef<T>[];
  getColumn(id: string): ReactColumnDef<T> | undefined;

  setState(updater: Updater<TableState>): void;
  // sorting
  toggleSort(columnId: string, multi?: boolean): void;
  setSorting(sorting: SortRule[]): void;
  getSortDirection(columnId: string): "asc" | "desc" | false;
  getSortIndex(columnId: string): number;
  // filtering
  setGlobalFilter(value: string): void;
  setColumnFilter(columnId: string, value: FilterValue | undefined): void;
  getColumnFilter(columnId: string): FilterValue | undefined;
  clearFilters(): void;
  hasActiveFilters: boolean;
  // pagination
  setPageIndex(index: number): void;
  setPageSize(size: number): void;
  // selection
  toggleRowSelected(rowId: string, value?: boolean): void;
  togglePageSelected(value: boolean): void;
  clearSelection(): void;
  pageSelection: "none" | "some" | "all";
  selectedRows: Row<T>[];
  // columns
  toggleColumnVisibility(columnId: string, value?: boolean): void;
  resizeColumn(columnId: string, width: number): void;
  /** Move a column to where `targetId` is now. Ignored across the pinned boundary. */
  moveColumn(columnId: string, targetId: string): void;
  setColumnPinned(columnId: string, pinned: boolean): void;
}

export function useTable<T extends RowData>(options: UseTableOptions<T>): TableInstance<T> {
  const [internal, setInternal] = useState<TableState>(() =>
    createInitialState(options.initialState),
  );
  const state = useMemo<TableState>(
    () => (options.state ? { ...internal, ...options.state } : internal),
    [internal, options.state],
  );

  // Keep latest values for stable callbacks.
  const latest = useRef({ state, options });
  latest.current = { state, options };

  const setState = useCallback((updater: Updater<TableState>) => {
    const { state: prev, options: o } = latest.current;
    const next = functionalUpdate(updater, prev);
    latest.current.state = next;
    setInternal(next);
    o.onStateChange?.(next);
    if (o.onSelectionChange && next.rowSelection !== prev.rowSelection) {
      o.onSelectionChange(Object.keys(next.rowSelection).filter((k) => next.rowSelection[k]));
    }
  }, []);

  const { data, columns } = options;
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute only on inputs that change rows
  const rowModel = useMemo(
    () => getRowModel(options, state),
    [
      data,
      columns,
      state.sorting,
      state.globalFilter,
      state.columnFilters,
      state.pagination,
      options.manualSorting,
      options.manualFiltering,
      options.manualPagination,
      options.rowCount,
      options.enablePagination,
      options.getRowId,
    ],
  );

  const orderedColumns = useMemo(
    () => getOrderedColumns(columns, state.columnOrder, state.columnPinning) as ReactColumnDef<T>[],
    [columns, state.columnOrder, state.columnPinning],
  );
  const visibleColumns = useMemo(
    () => getVisibleColumns(orderedColumns, state.columnVisibility) as ReactColumnDef<T>[],
    [orderedColumns, state.columnVisibility],
  );

  const selectionMode = options.selectionMode ?? "none";

  return useMemo<TableInstance<T>>(() => {
    const byId = new Map(columns.map((c) => [c.id, c]));
    const resetPage = (s: TableState): TableState["pagination"] => ({
      ...s.pagination,
      pageIndex: 0,
    });
    return {
      options,
      state,
      rowModel,
      columns,
      orderedColumns,
      visibleColumns,
      getColumn: (id) => byId.get(id),
      setState,

      toggleSort: (id, multi) =>
        setState((s) => ({
          ...s,
          sorting: toggleSortCore(s.sorting, id, multi && options.enableMultiSort !== false),
        })),
      setSorting: (sorting) => setState((s) => ({ ...s, sorting })),
      getSortDirection: (id) => getSortDirection(state.sorting, id),
      getSortIndex: (id) => (state.sorting.length > 1 ? getSortIndex(state.sorting, id) : 0),

      setGlobalFilter: (value) =>
        setState((s) => ({ ...s, globalFilter: value, pagination: resetPage(s) })),
      setColumnFilter: (id, value) =>
        setState((s) => ({
          ...s,
          columnFilters: setColumnFilterCore(s.columnFilters, id, value),
          pagination: resetPage(s),
        })),
      getColumnFilter: (id) => state.columnFilters.find((f) => f.id === id)?.value,
      clearFilters: () =>
        setState((s) => ({ ...s, globalFilter: "", columnFilters: [], pagination: resetPage(s) })),
      hasActiveFilters: state.globalFilter.trim() !== "" || state.columnFilters.length > 0,

      setPageIndex: (pageIndex) =>
        setState((s) => ({ ...s, pagination: { ...s.pagination, pageIndex } })),
      setPageSize: (pageSize) =>
        setState((s) => ({ ...s, pagination: { pageIndex: 0, pageSize } })),

      toggleRowSelected: (id, value) =>
        setState((s) => ({
          ...s,
          rowSelection: toggleRow(s.rowSelection, id, selectionMode, value),
        })),
      togglePageSelected: (value) =>
        setState((s) => ({ ...s, rowSelection: toggleRows(s.rowSelection, rowModel.rows, value) })),
      clearSelection: () => setState((s) => ({ ...s, rowSelection: {} })),
      pageSelection: getSelectionStatus(state.rowSelection, rowModel.rows),
      selectedRows: rowModel.allRows.filter((r) => state.rowSelection[r.id]),

      toggleColumnVisibility: (id, value) =>
        setState((s) => ({
          ...s,
          columnVisibility: toggleColumnVisibilityCore(s.columnVisibility, id, value),
        })),
      resizeColumn: (id, width) => {
        const column = byId.get(id);
        if (column)
          setState((s) => ({
            ...s,
            columnSizing: resizeColumnCore(s.columnSizing, column, width),
          }));
      },
      moveColumn: (id, targetId) =>
        setState((s) => ({
          ...s,
          columnOrder: moveColumnCore(columns, s.columnOrder, s.columnPinning, id, targetId),
        })),
      setColumnPinned: (id, pinned) =>
        setState((s) => ({
          ...s,
          ...setColumnPinnedCore(columns, s.columnOrder, s.columnPinning, id, pinned),
        })),
    };
  }, [options, state, rowModel, columns, orderedColumns, visibleColumns, setState, selectionMode]);
}
