import { fitColumnsToWidth, type RowData } from "@tablekit/core";
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useElementWidth } from "./hooks";
import type { ReactColumnDef, TableInstance } from "./useTable";

export type Density = "compact" | "default" | "comfortable";
export type Variant = "plain" | "zebra" | "bordered";
export type Responsive = "stack" | "scroll" | "priority";
export type Layout = "table" | "stack";

export const defaultLabels = {
  search: "Search",
  searchPlaceholder: "Search…",
  filters: "Filters",
  columns: "Columns",
  toggleColumns: "Show or hide columns",
  columnSettings: "Show, hide, pin or reorder columns",
  pinnedColumns: "Pinned",
  otherColumns: "Columns",
  pinColumn: (col: string) => `Pin ${col}`,
  moveColumn: (col: string) => `Move ${col}`,
  moveColumnHint: "Drag, or press the up and down arrow keys, to move.",
  columnMoved: (col: string, pos: number, total: number) =>
    `${col} moved to position ${pos} of ${total}`,
  columnPinned: (col: string) => `${col} pinned`,
  columnUnpinned: (col: string) => `${col} unpinned`,
  clearFilters: "Clear filters",
  clearAll: "Clear all",
  removeFilter: (name: string) => `Remove ${name} filter`,
  selectAll: "Select all rows on this page",
  selectRow: (label: string) => `Select ${label}`,
  selected: (n: number) => `${n} selected`,
  clearSelection: "Clear selection",
  rowsPerPage: "Rows per page",
  range: (from: number, to: number, total: number) =>
    total === 0 ? "0 results" : `${from}–${to} of ${total}`,
  previousPage: "Previous page",
  nextPage: "Next page",
  page: (n: number) => `Page ${n}`,
  pageOf: (n: number, total: number) => `Page ${n} of ${total}`,
  pagination: "Pagination",
  noResults: "No results",
  noResultsDescription: "Try a different search, or clear the filters.",
  emptyTitle: "Nothing here yet",
  emptyDescription: "When there’s data, it will show up here.",
  errorTitle: "Couldn’t load data",
  retry: "Try again",
  loading: "Loading…",
  sortedAsc: (col: string) => `Sorted by ${col}, ascending`,
  sortedDesc: (col: string) => `Sorted by ${col}, descending`,
  sortCleared: "Sorting cleared",
  sortBy: "Sort by",
  noSort: "Default order",
  resizeColumn: (col: string) => `Resize ${col} column`,
  rowActions: "Row actions",
  min: "Min",
  max: "Max",
  any: "Any",
  density: "Density",
  densityCompact: "Compact",
  densityDefault: "Default",
  densityComfortable: "Comfortable",
  results: (n: number) => `${n} ${n === 1 ? "result" : "results"}`,
  yes: "Yes",
  no: "No",
};

export type Labels = typeof defaultLabels;

export interface TableContextValue<T extends RowData = RowData> {
  table: TableInstance<T>;
  density: Density;
  setDensity: (d: Density) => void;
  variant: Variant;
  layout: Layout;
  /** Columns to render right now (visibility + responsive priority applied). */
  columns: ReactColumnDef<T>[];
  stickyHeader: boolean;
  labels: Labels;
  label: string;
  announce: (message: string) => void;
}

// biome-ignore lint/suspicious/noExplicitAny: context is shared across row types
const TableContext = createContext<TableContextValue<any> | null>(null);

export function useTableContext<T extends RowData = RowData>(): TableContextValue<T> {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error("tablekit: <Table.*> parts must be rendered inside <Table.Root>.");
  return ctx as TableContextValue<T>;
}

/** Selection checkbox column width (px). Shared with content.tsx. */
export const SELECT_WIDTH = 44;

export interface RootProps<T extends RowData> {
  table: TableInstance<T>;
  /** Accessible name for the table. Required unless you render a visible title and pass it here. */
  "aria-label": string;
  density?: Density;
  /** Uncontrolled starting density when `density` isn't passed. */
  defaultDensity?: Density;
  onDensityChange?: (d: Density) => void;
  variant?: Variant;
  /** Narrow-container behavior. Default `stack`. */
  responsive?: Responsive;
  /** Container width (px) below which `stack` switches to cards. Default 640. */
  stackBelow?: number;
  stickyHeader?: boolean;
  /** Force a theme for this table only. Omit to follow the page. */
  theme?: "light" | "dark";
  labels?: Partial<Labels>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function Root<T extends RowData>({
  table,
  "aria-label": label,
  density: densityProp,
  defaultDensity = "default",
  onDensityChange,
  variant = "plain",
  responsive = "stack",
  stackBelow = 640,
  stickyHeader = true,
  theme,
  labels: labelOverrides,
  className,
  style,
  children,
}: RootProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const [densityState, setDensityState] = useState<Density>(defaultDensity);
  const density = densityProp ?? densityState;
  const setDensity = useCallback(
    (d: Density) => {
      setDensityState(d);
      onDensityChange?.(d);
    },
    [onDensityChange],
  );

  const [message, setMessage] = useState("");
  const announce = useCallback((m: string) => {
    // Clear first so repeating the same message is still announced.
    setMessage("");
    requestAnimationFrame(() => setMessage(m));
  }, []);

  const layout: Layout =
    responsive === "stack" && width !== undefined && width < stackBelow ? "stack" : "table";

  const columns = useMemo(() => {
    if (responsive !== "priority" || width === undefined) return table.visibleColumns;
    // Keep every column that fits; drop the least important ones only as needed.
    const leading = (table.options.selectionMode ?? "none") !== "none" ? SELECT_WIDTH : 0;
    return fitColumnsToWidth(table.visibleColumns, table.state.columnSizing, width - 2, leading);
  }, [
    responsive,
    width,
    table.visibleColumns,
    table.state.columnSizing,
    table.options.selectionMode,
  ]);

  const labels = useMemo(() => ({ ...defaultLabels, ...labelOverrides }), [labelOverrides]);

  const value = useMemo<TableContextValue<T>>(
    () => ({
      table,
      density,
      setDensity,
      variant,
      layout,
      columns,
      stickyHeader,
      labels,
      label,
      announce,
    }),
    [table, density, setDensity, variant, layout, columns, stickyHeader, labels, label, announce],
  );

  return (
    <TableContext.Provider value={value}>
      <div
        ref={ref}
        className={`tk-root${className ? ` ${className}` : ""}`}
        style={style}
        data-density={density}
        data-variant={variant}
        data-layout={layout}
        data-tk-theme={theme}
      >
        {children}
        <div className="tk-sr-only" aria-live="polite" aria-atomic="true">
          {message}
        </div>
      </div>
    </TableContext.Provider>
  );
}
