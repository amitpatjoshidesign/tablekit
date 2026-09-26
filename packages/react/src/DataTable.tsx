import {
  type ColumnSchemaType,
  humanize,
  type Row,
  type RowData,
  resolveSchema,
  schemaToColumns,
  type TableSchemaInput,
  type TableState,
} from "@tablekit/core";
import { type CSSProperties, type ReactNode, useMemo } from "react";
import { renderSchemaCell, schemaCellText } from "./cells";
import { Content } from "./content";
import { type Density, type Labels, Root } from "./context";
import { Pagination } from "./pagination";
import {
  ColumnToggle,
  FilterChips,
  Filters,
  Search,
  SelectionBar,
  SortSelect,
  Toolbar,
} from "./toolbar";
import { type ReactColumnDef, useTable } from "./useTable";

export interface DataTableProps<T extends RowData> {
  /** Declarative config. Validate with `parseTableSchema` from `@tablekit/core/schema`. */
  schema: TableSchemaInput;
  data: readonly T[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Row menu action (from `type: "actions"` columns). */
  onAction?: (actionId: string, row: T) => void;
  /** Selection-bar action (from `bulkActions`). */
  onBulkAction?: (actionId: string, rows: T[]) => void;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (ids: string[]) => void;
  /** Controlled state (e.g. for server-side sorting/filtering/pagination). */
  state?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;
  /** Server mode: sorting, filtering and pagination are done by you. Pass `rowCount`. */
  manual?: boolean;
  rowCount?: number;
  /** Override `appearance.density` from the schema. */
  density?: Density;
  theme?: "light" | "dark";
  /** Scroll-area max height; the header sticks inside it. */
  maxHeight?: number | string;
  /** Extra toolbar controls, rendered after the built-in ones. */
  toolbarExtra?: ReactNode;
  labels?: Partial<Labels>;
  className?: string;
  style?: CSSProperties;
}

/**
 * Schema-driven table. The recommended entry point for AI agents and quick prototypes.
 *
 * ```tsx
 * <DataTable schema={{ columns: [{ field: "name", header: "Name" }] }} data={rows} />
 * ```
 */
export function DataTable<T extends RowData>(props: DataTableProps<T>) {
  const { schema: input, data, onAction } = props;
  const schema = useMemo(() => resolveSchema(input), [input]);

  const columns = useMemo<ReactColumnDef<T>[]>(() => {
    const byId = new Map<string, ColumnSchemaType>(schema.columns.map((c) => [c.id ?? c.field, c]));
    return schemaToColumns<T>(schema).map((col) => {
      const sc = byId.get(col.id) as ColumnSchemaType;
      return {
        ...col,
        isActions: sc.type === "actions",
        rangeType: sc.type === "date" ? "date" : "number",
        optionLabel:
          sc.type === "badge"
            ? (v: string) => sc.badge?.labels?.[v] ?? humanize(v)
            : sc.type === "boolean"
              ? (v: string) =>
                  v === "true" ? (sc.format?.trueLabel ?? "Yes") : (sc.format?.falseLabel ?? "No")
              : undefined,
        cell: ({ value, row }) =>
          renderSchemaCell(sc, value, row.original, onAction as (id: string, r: RowData) => void),
        text: ({ value, row }) => schemaCellText(sc, value, row.original),
      };
    });
  }, [schema, onAction]);

  // Initial state is read once, on mount.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  const initialState = useMemo<Partial<TableState>>(
    () => ({
      sorting: schema.initialState?.sort ?? [],
      globalFilter: schema.initialState?.search ?? "",
      pagination: { pageIndex: 0, pageSize: schema.features.pageSize },
      columnVisibility: Object.fromEntries(
        schema.columns.filter((c) => c.hidden).map((c) => [c.id ?? c.field, false]),
      ),
    }),
    [],
  );

  const rowIdField = schema.rowId;
  const getRowId = useMemo(
    () =>
      rowIdField
        ? (row: T, i: number) => String((row as Record<string, unknown>)[rowIdField] ?? i)
        : undefined,
    [rowIdField],
  );

  const table = useTable<T>({
    data,
    columns,
    getRowId,
    initialState,
    state: props.state,
    onStateChange: props.onStateChange,
    onSelectionChange: props.onSelectionChange,
    selectionMode: schema.features.selection,
    enableMultiSort: schema.features.multiSort,
    enablePagination: schema.features.pagination,
    manualSorting: props.manual,
    manualFiltering: props.manual,
    manualPagination: props.manual,
    rowCount: props.rowCount,
  });

  const f = schema.features;
  const a = schema.appearance;
  const hasToolbar =
    schema.title ||
    f.search ||
    f.columnFilters ||
    f.columnVisibility ||
    f.columnReorder ||
    f.columnPinning ||
    props.toolbarExtra;

  return (
    <Root
      table={table}
      aria-label={schema.title ?? "Data table"}
      density={props.density ?? a.density}
      variant={a.variant}
      responsive={a.responsive}
      stackBelow={a.stackBelow}
      stickyHeader={f.stickyHeader}
      theme={props.theme}
      labels={props.labels}
      className={props.className}
      style={props.style}
    >
      {hasToolbar && (
        <Toolbar title={schema.title} description={schema.description}>
          {f.search && <Search />}
          <SortSelect />
          {f.columnFilters && <Filters />}
          {(f.columnVisibility || f.columnReorder || f.columnPinning) && (
            <ColumnToggle
              hide={f.columnVisibility}
              reorder={f.columnReorder}
              pin={f.columnPinning}
            />
          )}
          {props.toolbarExtra}
        </Toolbar>
      )}
      <FilterChips />
      {f.selection === "multi" && (
        <SelectionBar>
          {schema.bulkActions?.map((action) => (
            <button
              key={action.id}
              type="button"
              className="tk-button"
              data-tone={action.tone}
              onClick={() =>
                props.onBulkAction?.(
                  action.id,
                  table.selectedRows.map((r: Row<T>) => r.original),
                )
              }
            >
              {action.label}
            </button>
          ))}
        </SelectionBar>
      )}
      <Content
        loading={props.loading}
        error={props.error}
        onRetry={props.onRetry}
        empty={schema.emptyState}
        maxHeight={props.maxHeight}
        onRowClick={
          props.onRowClick ? (row: Row<T>) => props.onRowClick?.(row.original) : undefined
        }
      />
      {f.pagination && <Pagination pageSizeOptions={f.pageSizeOptions} />}
    </Root>
  );
}
