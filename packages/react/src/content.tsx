import {
  DEFAULT_AUTO_WIDTH,
  DEFAULT_PINNED_WIDTH,
  getColumnWidth,
  getPinnedOffsets,
  getRequiredWidth,
  type Row,
  type RowData,
} from "@tablekit/core";
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { type Labels, SELECT_WIDTH, useTableContext } from "./context";
import { AlertIcon, InboxIcon, SortAscIcon, SortDescIcon, SortNoneIcon } from "./icons";
import type { ReactColumnDef, TableInstance } from "./useTable";

const PINNED_FALLBACK = DEFAULT_PINNED_WIDTH;
const AUTO_WIDTH = DEFAULT_AUTO_WIDTH;
const INTERACTIVE =
  "button, a, input, select, textarea, label, [role='menuitem'], [role='separator']";

export interface ContentProps<T extends RowData> {
  loading?: boolean;
  /** Truthy shows the error state. Pass an Error or a message. */
  error?: unknown;
  onRetry?: () => void;
  /** Shown when there is no data at all (not when filters hide everything). */
  empty?: ReactNode | { title: string; description?: string };
  onRowClick?: (row: Row<T>) => void;
  /** Max height of the scroll area. Needed for the sticky header to stick inside the table. */
  maxHeight?: number | string;
  /** Number of skeleton rows while loading with no data. Default: page size (max 8). */
  skeletonRows?: number;
}

function renderCell<T extends RowData>(
  table: TableInstance<T>,
  column: ReactColumnDef<T>,
  row: Row<T>,
): ReactNode {
  const value = row.getValue(column.id);
  if (column.cell) return column.cell({ row, column, value, table });
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

function cellText<T extends RowData>(
  table: TableInstance<T>,
  column: ReactColumnDef<T> | undefined,
  row: Row<T>,
): string {
  if (!column) return row.id;
  const value = row.getValue(column.id);
  if (column.text) return column.text({ row, column, value, table });
  const rendered = renderCell(table, column, row);
  return typeof rendered === "string" ? rendered : String(value ?? row.id);
}

function Checkbox({
  checked,
  indeterminate = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="tk-checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

// ---- States ---------------------------------------------------------------

function StatePanel({
  icon,
  title,
  description,
  action,
  role,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <div className="tk-state" role={role}>
      <div className="tk-state-icon">{icon}</div>
      <p className="tk-state-title">{title}</p>
      {description && <p className="tk-state-description">{description}</p>}
      {action}
    </div>
  );
}

function useStateContent<T extends RowData>(props: ContentProps<T>): ReactNode | null {
  const { table, labels } = useTableContext<T>();
  if (props.error) {
    const message =
      props.error instanceof Error
        ? props.error.message
        : typeof props.error === "string"
          ? props.error
          : undefined;
    return (
      <StatePanel
        role="alert"
        icon={<AlertIcon />}
        title={labels.errorTitle}
        description={message}
        action={
          props.onRetry && (
            <button type="button" className="tk-button" onClick={props.onRetry}>
              {labels.retry}
            </button>
          )
        }
      />
    );
  }
  if (props.loading || table.rowModel.rows.length > 0) return null;
  if (table.hasActiveFilters) {
    return (
      <StatePanel
        role="status"
        icon={<InboxIcon />}
        title={labels.noResults}
        description={labels.noResultsDescription}
        action={
          <button type="button" className="tk-button" onClick={table.clearFilters}>
            {labels.clearFilters}
          </button>
        }
      />
    );
  }
  const empty = props.empty;
  if (empty && typeof empty === "object" && "title" in empty) {
    return (
      <StatePanel
        role="status"
        icon={<InboxIcon />}
        title={empty.title}
        description={empty.description}
      />
    );
  }
  if (empty) return <div className="tk-state">{empty}</div>;
  return (
    <StatePanel
      role="status"
      icon={<InboxIcon />}
      title={labels.emptyTitle}
      description={labels.emptyDescription}
    />
  );
}

// ---- Header ---------------------------------------------------------------

function sortAnnouncement(labels: Labels, name: string, dir: "asc" | "desc" | false) {
  if (dir === "asc") return labels.sortedAsc(name);
  if (dir === "desc") return labels.sortedDesc(name);
  return labels.sortCleared;
}

function ResizeHandle<T extends RowData>({ column }: { column: ReactColumnDef<T> }) {
  const { table, labels } = useTableContext<T>();
  const start = useRef<{ x: number; w: number } | null>(null);
  const name = column.header ?? column.id;
  const width = getColumnWidth(column, table.state.columnSizing);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const th = e.currentTarget.closest("th");
    if (!th) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, w: th.getBoundingClientRect().width };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    table.resizeColumn(column.id, start.current.w + (e.clientX - start.current.x));
  };
  const onPointerUp = () => {
    start.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const th = e.currentTarget.closest("th");
    const current = width ?? th?.getBoundingClientRect().width ?? AUTO_WIDTH;
    const step = e.shiftKey ? 48 : 16;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      table.resizeColumn(column.id, current + (e.key === "ArrowRight" ? step : -step));
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a focusable, adjustable separator is the ARIA pattern for splitters
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={labels.resizeColumn(name)}
      aria-valuenow={Math.round(width ?? AUTO_WIDTH)}
      aria-valuemin={column.minWidth ?? 64}
      aria-valuemax={column.maxWidth ?? 800}
      tabIndex={0}
      className="tk-resize"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onDoubleClick={() =>
        table.setState((s) => {
          const { [column.id]: _, ...rest } = s.columnSizing;
          return { ...s, columnSizing: rest };
        })
      }
    />
  );
}

function HeaderCell<T extends RowData>({
  column,
  pinnedLeft,
}: {
  column: ReactColumnDef<T>;
  pinnedLeft?: number;
}) {
  const { table, labels, announce } = useTableContext<T>();
  const name = column.header ?? column.id;
  const dir = table.getSortDirection(column.id);
  const index = table.getSortIndex(column.id);
  const sortable = column.sortable !== false;
  const style: CSSProperties | undefined =
    pinnedLeft !== undefined ? { left: pinnedLeft } : undefined;

  return (
    <th
      scope="col"
      className="tk-th"
      data-align={column.align}
      data-pinned={pinnedLeft !== undefined || undefined}
      data-sorted={dir || undefined}
      data-actions={column.isActions || undefined}
      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
      style={style}
    >
      {sortable ? (
        <button
          type="button"
          className="tk-sort"
          onClick={(e) => {
            table.toggleSort(column.id, e.shiftKey);
            // Predict the next direction for the announcement.
            const next = dir === false ? "asc" : dir === "asc" ? "desc" : false;
            announce(sortAnnouncement(labels, name, next));
          }}
        >
          <span className="tk-th-label">{name}</span>
          <span className="tk-sort-icon" data-dir={dir || "none"}>
            {dir === "asc" ? <SortAscIcon /> : dir === "desc" ? <SortDescIcon /> : <SortNoneIcon />}
          </span>
          {index > 0 && (
            <span className="tk-sort-index" aria-hidden="true">
              {index}
            </span>
          )}
        </button>
      ) : column.isActions ? (
        <span className="tk-sr-only">{name}</span>
      ) : (
        <span className="tk-th-label">{name}</span>
      )}
      {column.resizable !== false && <ResizeHandle column={column} />}
    </th>
  );
}

// ---- Grid (table layout) ----------------------------------------------------

function useGridKeyboard() {
  return (e: KeyboardEvent<HTMLTableElement>) => {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key) || e.defaultPrevented) return;
    const target = e.target as HTMLElement;
    if (target.closest(".tk-popover")) return;
    // Let inputs and separators keep their own arrow-key behavior.
    if (target.matches("input:not([type='checkbox']), select, textarea, [role='separator']"))
      return;
    const cell = target.closest<HTMLElement>("[data-r]");
    if (!cell) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    let nr = r;
    let nc = c;
    if (e.key === "ArrowUp") nr--;
    if (e.key === "ArrowDown") nr++;
    if (e.key === "ArrowLeft") nc--;
    if (e.key === "ArrowRight") nc++;
    if (e.key === "Home") nc = 0;
    if (e.key === "End") nc = Number.MAX_SAFE_INTEGER;
    const table = e.currentTarget;
    const rowCells = (row: number) => [...table.querySelectorAll<HTMLElement>(`[data-r="${row}"]`)];
    const cells = rowCells(nr);
    if (cells.length === 0) return;
    const next = cells[Math.min(Math.max(nc, 0), cells.length - 1)];
    if (!next || next === cell) return;
    e.preventDefault();
    const inner = next.querySelector<HTMLElement>(INTERACTIVE);
    (inner ?? next).focus();
  };
}

function GridView<T extends RowData>(props: ContentProps<T>) {
  const { table, columns, labels, label, stickyHeader } = useTableContext<T>();
  const selection = table.options.selectionMode ?? "none";
  const hasSelect = selection !== "none";
  const anyPinned = columns.some((c) => c.pinned);
  const offsets = anyPinned
    ? getPinnedOffsets(
        columns,
        table.state.columnSizing,
        hasSelect ? SELECT_WIDTH : 0,
        PINNED_FALLBACK,
      )
    : {};
  const state = useStateContent(props);
  const onKeyDown = useGridKeyboard();
  const [active, setActive] = useState<[number, number]>([0, 0]);

  const widths = columns.map((c) => {
    const w = getColumnWidth(c, table.state.columnSizing);
    return w ?? (c.pinned ? PINNED_FALLBACK : undefined);
  });
  const minWidth = getRequiredWidth(
    columns,
    table.state.columnSizing,
    hasSelect ? SELECT_WIDTH : 0,
  );

  const colCount = columns.length + (hasSelect ? 1 : 0);
  const skeletonCount = props.skeletonRows ?? Math.min(table.state.pagination.pageSize || 5, 8);
  const primary = columns.find((c) => !c.isActions);
  const showSkeleton = props.loading && table.rowModel.rows.length === 0 && !props.error;

  const onRowClick = (row: Row<T>) => (e: MouseEvent<HTMLTableRowElement>) => {
    if (!props.onRowClick) return;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    props.onRowClick(row);
  };

  return (
    <div
      className="tk-scroll"
      style={props.maxHeight !== undefined ? { maxHeight: props.maxHeight } : undefined}
    >
      <table
        className="tk-table"
        aria-label={label}
        aria-rowcount={table.rowModel.totalRows + 1}
        aria-busy={props.loading || undefined}
        data-sticky-header={stickyHeader || undefined}
        style={{ minWidth }}
        onKeyDown={onKeyDown}
      >
        <colgroup>
          {hasSelect && <col style={{ width: SELECT_WIDTH }} />}
          {columns.map((c, i) => (
            <col key={c.id} style={widths[i] !== undefined ? { width: widths[i] } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr className="tk-tr" aria-rowindex={1}>
            {hasSelect && (
              <th
                scope="col"
                className="tk-th tk-select-cell"
                data-pinned={anyPinned || undefined}
                style={anyPinned ? { left: 0 } : undefined}
              >
                {selection === "multi" ? (
                  <Checkbox
                    label={labels.selectAll}
                    checked={table.pageSelection === "all"}
                    indeterminate={table.pageSelection === "some"}
                    onChange={(v) => table.togglePageSelected(v)}
                  />
                ) : (
                  <span className="tk-sr-only">{labels.selectAll}</span>
                )}
              </th>
            )}
            {columns.map((c) => (
              <HeaderCell key={c.id} column={c} pinnedLeft={offsets[c.id]} />
            ))}
          </tr>
        </thead>
        <tbody>
          {showSkeleton &&
            Array.from({ length: skeletonCount }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
              // biome-ignore lint/a11y/noAriaHiddenOnFocusable: placeholder rows contain nothing focusable
              <tr key={i} className="tk-tr tk-skeleton-row" aria-hidden="true">
                {Array.from({ length: colCount }, (_, j) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder cells
                  <td key={j} className="tk-td">
                    <span
                      className="tk-skeleton"
                      style={{ width: `${45 + ((i * 7 + j * 13) % 45)}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          {state && (
            <tr className="tk-tr tk-state-row">
              <td className="tk-td" colSpan={colCount}>
                {state}
              </td>
            </tr>
          )}
          {!state &&
            table.rowModel.rows.map((row, r) => {
              const selected = !!table.state.rowSelection[row.id];
              const rowLabel = cellText(table, primary, row);
              return (
                <tr
                  key={row.id}
                  className="tk-tr"
                  data-selected={selected || undefined}
                  data-clickable={props.onRowClick ? true : undefined}
                  aria-rowindex={
                    table.state.pagination.pageIndex * table.state.pagination.pageSize + r + 2
                  }
                  onClick={onRowClick(row)}
                >
                  {hasSelect && (
                    <td
                      className="tk-td tk-select-cell"
                      data-pinned={anyPinned || undefined}
                      style={anyPinned ? { left: 0 } : undefined}
                      data-r={r}
                      data-c={0}
                    >
                      <Checkbox
                        label={labels.selectRow(rowLabel)}
                        checked={selected}
                        onChange={(v) => table.toggleRowSelected(row.id, v)}
                      />
                    </td>
                  )}
                  {columns.map((column, ci) => {
                    const c = ci + (hasSelect ? 1 : 0);
                    const isActive =
                      Math.min(active[0], table.rowModel.rows.length - 1) === r &&
                      Math.min(active[1], colCount - 1) === c;
                    const pinnedLeft = offsets[column.id];
                    return (
                      <td
                        key={column.id}
                        className="tk-td"
                        data-align={column.align}
                        data-actions={column.isActions || undefined}
                        data-pinned={pinnedLeft !== undefined || undefined}
                        style={pinnedLeft !== undefined ? { left: pinnedLeft } : undefined}
                        data-r={r}
                        data-c={c}
                        tabIndex={isActive && !hasSelect ? 0 : -1}
                        onFocus={() => setActive([r, c])}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.target === e.currentTarget && props.onRowClick)
                            props.onRowClick(row);
                        }}
                      >
                        {renderCell(table, column, row)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Cards (stacked layout) -------------------------------------------------

function CardsView<T extends RowData>(props: ContentProps<T>) {
  const { table, columns, labels, label } = useTableContext<T>();
  const selection = table.options.selectionMode ?? "none";
  const state = useStateContent(props);
  const actions = columns.find((c) => c.isActions);
  const fields = columns.filter((c) => !c.isActions);
  const [primary, ...rest] = fields;

  if (props.loading && table.rowModel.rows.length === 0 && !props.error) {
    return (
      <ul className="tk-cards" aria-busy="true" aria-label={label}>
        {Array.from({ length: 3 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder
          <li key={i} className="tk-card" aria-hidden="true">
            <span className="tk-skeleton" style={{ width: "60%" }} />
            <span className="tk-skeleton" style={{ width: "40%" }} />
            <span className="tk-skeleton" style={{ width: "75%" }} />
          </li>
        ))}
      </ul>
    );
  }
  if (state) return <div className="tk-cards-state">{state}</div>;

  return (
    <ul className="tk-cards" aria-label={label}>
      {table.rowModel.rows.map((row) => {
        const selected = !!table.state.rowSelection[row.id];
        const title = cellText(table, primary, row);
        return (
          <li
            key={row.id}
            className="tk-card"
            data-selected={selected || undefined}
            data-clickable={props.onRowClick ? true : undefined}
          >
            <div className="tk-card-head">
              {selection !== "none" && (
                <Checkbox
                  label={labels.selectRow(title)}
                  checked={selected}
                  onChange={(v) => table.toggleRowSelected(row.id, v)}
                />
              )}
              <div className="tk-card-title">
                {primary &&
                  (props.onRowClick ? (
                    <button
                      type="button"
                      className="tk-card-open"
                      onClick={() => props.onRowClick?.(row)}
                    >
                      {renderCell(table, primary, row)}
                    </button>
                  ) : (
                    renderCell(table, primary, row)
                  ))}
              </div>
              {actions && <div className="tk-card-actions">{renderCell(table, actions, row)}</div>}
            </div>
            {rest.length > 0 && (
              <dl className="tk-card-fields">
                {rest.map((c) => (
                  <div key={c.id} className="tk-card-field">
                    <dt>{c.header ?? c.id}</dt>
                    <dd data-align={c.align}>{renderCell(table, c, row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Renders the table, or cards in the stacked layout, including loading/empty/error states. */
export function Content<T extends RowData>(props: ContentProps<T>) {
  const { layout } = useTableContext<T>();
  return (
    <div className="tk-content" data-loading={props.loading || undefined}>
      {props.loading && <div className="tk-progress" aria-hidden="true" />}
      {layout === "stack" ? <CardsView {...props} /> : <GridView {...props} />}
    </div>
  );
}
