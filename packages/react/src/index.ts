import { Content } from "./content";
import { Root } from "./context";
import { Pagination } from "./pagination";
import {
  ColumnToggle,
  DensityToggle,
  FilterChips,
  Filters,
  Search,
  SelectionBar,
  SortSelect,
  Toolbar,
} from "./toolbar";

/**
 * Composable parts. Use with `useTable`:
 *
 * ```tsx
 * const table = useTable({ data, columns });
 * <Table.Root table={table} aria-label="Orders">
 *   <Table.Toolbar title="Orders"><Table.Search /><Table.Filters /><Table.ColumnToggle /></Table.Toolbar>
 *   <Table.FilterChips />
 *   <Table.SelectionBar>…</Table.SelectionBar>
 *   <Table.Content />
 *   <Table.Pagination />
 * </Table.Root>
 * ```
 */
export const Table = {
  Root,
  Toolbar,
  Search,
  Filters,
  FilterChips,
  ColumnToggle,
  DensityToggle,
  SortSelect,
  SelectionBar,
  Content,
  Pagination,
};

export * from "@tablekit/core";
export {
  type ActionItem,
  Avatar,
  Badge,
  type BadgeProps,
  CellButton,
  type CellButtonProps,
  RowActions,
  RowActionsGroup,
  renderSchemaCell,
  schemaCellText,
} from "./cells";
export type { ContentProps } from "./content";
export {
  type Density,
  defaultLabels,
  type Labels,
  type Responsive,
  type RootProps,
  useTableContext,
  type Variant,
} from "./context";
export { DataTable, type DataTableProps } from "./DataTable";
export { Popover } from "./popover";
export type { ColumnToggleProps } from "./toolbar";
export {
  type CellContext,
  type ReactColumnDef,
  type TableInstance,
  type UseTableOptions,
  useTable,
} from "./useTable";
