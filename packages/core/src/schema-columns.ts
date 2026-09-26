/**
 * Turn a declarative TableSchema into ColumnDefs — without pulling zod into the bundle.
 * `resolveSchema` applies the same defaults as the zod schema (a test keeps them in sync).
 */
import { toDate } from "./format";
import type { ColumnSchemaType, TableSchemaInput, TableSchemaType } from "./schema";
import type { Align, ColumnDef, FilterKind, RowData } from "./types";

export function getByPath(row: unknown, path: string): unknown {
  if (row === null || row === undefined) return undefined;
  if (!path.includes(".")) return (row as Record<string, unknown>)[path];
  let cur: unknown = row;
  for (const key of path.split(".")) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** Replace `{field}` placeholders with (URL-encoded) row values. */
export function fillTemplate(template: string, row: unknown): string {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) =>
    encodeURIComponent(String(getByPath(row, key.trim()) ?? "")),
  );
}

export function resolveSchema(input: TableSchemaInput): TableSchemaType {
  const f = input.features ?? {};
  const a = input.appearance ?? {};
  return {
    ...input,
    version: 1,
    columns: input.columns.map((c) => ({ ...c, type: c.type ?? "text" })),
    features: {
      search: f.search ?? true,
      columnFilters: f.columnFilters ?? true,
      sorting: f.sorting ?? true,
      multiSort: f.multiSort ?? true,
      pagination: f.pagination ?? true,
      pageSize: f.pageSize ?? 10,
      pageSizeOptions: f.pageSizeOptions ?? [10, 25, 50, 100],
      selection: f.selection ?? "none",
      columnVisibility: f.columnVisibility ?? true,
      columnResize: f.columnResize ?? true,
      columnReorder: f.columnReorder ?? true,
      columnPinning: f.columnPinning ?? true,
      stickyHeader: f.stickyHeader ?? true,
    },
    appearance: {
      density: a.density ?? "default",
      variant: a.variant ?? "plain",
      responsive: a.responsive ?? "stack",
      stackBelow: a.stackBelow ?? 640,
    },
    initialState: input.initialState
      ? {
          ...input.initialState,
          sort: input.initialState.sort?.map((s) => ({ id: s.id, desc: s.desc ?? false })),
        }
      : undefined,
  } as TableSchemaType;
}

function defaultFilter(type: ColumnSchemaType["type"]): FilterKind | false {
  switch (type) {
    case "badge":
    case "boolean":
      return "select";
    case "number":
    case "currency":
    case "date":
      return "range";
    default:
      return false;
  }
}

function defaultAlign(type: ColumnSchemaType["type"]): Align {
  if (type === "number" || type === "currency") return "end";
  if (type === "boolean") return "center";
  if (type === "actions") return "end";
  return "start";
}

/** Width an actions column needs for its layout: icon buttons are 32px, text buttons ~7px/char. */
export function actionsWidth(c: ColumnSchemaType): number {
  const actions = c.actions ?? [];
  const pad = 16;
  const textButton = (label: string) => Math.ceil(label.length * 7.2) + 22;
  if (c.type === "button") {
    // Button cells keep normal cell padding (2 × 16px) around a 1px-bordered button.
    const label = c.button?.label ?? c.header;
    return 34 + textButton(label) + (c.button?.icon ? 20 : 0);
  }
  if (c.actionsDisplay === "inline")
    return pad + actions.length * 32 + Math.max(0, actions.length - 1) * 2;
  return 56;
}

const dateSort = (a: unknown, b: unknown) =>
  (toDate(a)?.getTime() ?? 0) - (toDate(b)?.getTime() ?? 0);

export function schemaToColumns<T extends RowData = RowData>(
  schema: TableSchemaType,
): ColumnDef<T>[] {
  const featureSort = schema.features.sorting;
  const featureFilter = schema.features.columnFilters;
  const featureResize = schema.features.columnResize;

  return schema.columns.map((c): ColumnDef<T> => {
    const isActions = c.type === "actions";
    const isButton = c.type === "button";
    return {
      id: c.id ?? c.field,
      header: c.header,
      accessor: (row: T) => getByPath(row, c.field),
      sortable: featureSort && !isActions && !isButton && c.sortable !== false,
      sortFn: c.type === "date" ? dateSort : undefined,
      filter:
        featureFilter && !isActions && !isButton ? (c.filter ?? defaultFilter(c.type)) : false,
      searchable: !isActions && !isButton && c.searchable !== false,
      hideable: !isActions && c.hideable !== false,
      resizable: featureResize && !isActions,
      width: c.width ?? (isActions || isButton ? actionsWidth(c) : undefined),
      minWidth: c.minWidth,
      maxWidth: c.maxWidth,
      pinned: c.pinned,
      // Row actions stay where they are declared (normally last) and never pin.
      pinnable: schema.features.columnPinning && !isActions,
      reorderable: schema.features.columnReorder && !isActions,
      priority: c.priority,
      align: c.align ?? defaultAlign(c.type),
      meta: { schema: c, kind: c.type },
    };
  });
}
