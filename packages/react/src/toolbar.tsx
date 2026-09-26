import {
  type FilterValue,
  getFacetValues,
  isFilterActive,
  type RangeFilterValue,
  type RowData,
} from "@tablekit/core";
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type Density, useTableContext } from "./context";
import { useDebounced } from "./hooks";
import {
  CloseIcon,
  ColumnsIcon,
  DensityComfortableIcon,
  DensityCompactIcon,
  DensityDefaultIcon,
  FilterIcon,
  GripIcon,
  PinIcon,
  SearchIcon,
} from "./icons";
import { Popover } from "./popover";
import type { ReactColumnDef } from "./useTable";

export function Toolbar({
  title,
  description,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="tk-toolbar">
      {(title || description) && (
        <div className="tk-toolbar-heading">
          {title && <h2 className="tk-title">{title}</h2>}
          {description && <p className="tk-description">{description}</p>}
        </div>
      )}
      {children && <div className="tk-toolbar-controls">{children}</div>}
    </div>
  );
}

export function Search({
  placeholder,
  debounce = 150,
}: {
  placeholder?: string;
  debounce?: number;
}) {
  const { table, labels, announce } = useTableContext();
  const [value, setValue] = useState(table.state.globalFilter);
  const debounced = useDebounced(value, debounce);
  const first = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only react to the debounced text
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    table.setGlobalFilter(debounced);
  }, [debounced]);

  // Sync when cleared from outside (e.g. "Clear filters").
  // biome-ignore lint/correctness/useExhaustiveDependencies: external reset only
  useEffect(() => {
    if (table.state.globalFilter === "" && value !== "" && debounced === value) setValue("");
  }, [table.state.globalFilter]);

  const total = table.rowModel.totalRows;
  const lastAnnounced = useRef<number | null>(null);
  useEffect(() => {
    if (!table.state.globalFilter) return;
    if (lastAnnounced.current !== total) announce(labels.results(total));
    lastAnnounced.current = total;
  }, [total, table.state.globalFilter, announce, labels]);

  return (
    <div className="tk-search">
      <SearchIcon />
      <input
        type="search"
        className="tk-input"
        aria-label={labels.search}
        placeholder={placeholder ?? labels.searchPlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            setValue("");
          }
        }}
      />
    </div>
  );
}

function optionLabel<T extends RowData>(column: ReactColumnDef<T>, value: string): string {
  return column.optionLabel ? column.optionLabel(value) : value;
}

function RangeInputs<T extends RowData>({ column }: { column: ReactColumnDef<T> }) {
  const { table, labels } = useTableContext<T>();
  const current = (table.getColumnFilter(column.id) as RangeFilterValue | undefined) ?? {};
  const type = column.rangeType === "date" ? "date" : "number";
  const id = useId();
  const update = (patch: RangeFilterValue) => {
    const next = { ...current, ...patch };
    table.setColumnFilter(column.id, next);
  };
  return (
    <div className="tk-range">
      <label htmlFor={`${id}-min`} className="tk-field">
        <span>{labels.min}</span>
        <input
          id={`${id}-min`}
          className="tk-input"
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={(current.min as string | number | undefined) ?? ""}
          onChange={(e) => update({ min: e.target.value === "" ? null : e.target.value })}
        />
      </label>
      <span aria-hidden="true" className="tk-range-sep">
        –
      </span>
      <label htmlFor={`${id}-max`} className="tk-field">
        <span>{labels.max}</span>
        <input
          id={`${id}-max`}
          className="tk-input"
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={(current.max as string | number | undefined) ?? ""}
          onChange={(e) => update({ max: e.target.value === "" ? null : e.target.value })}
        />
      </label>
    </div>
  );
}

function SelectOptions<T extends RowData>({ column }: { column: ReactColumnDef<T> }) {
  const { table } = useTableContext<T>();
  const values = useMemo(
    () => getFacetValues(table.rowModel.allRows, column.id),
    [table.rowModel.allRows, column.id],
  );
  const selected = (table.getColumnFilter(column.id) as string[] | undefined) ?? [];
  const toggle = (v: string) =>
    table.setColumnFilter(
      column.id,
      selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v],
    );
  return (
    <div className="tk-options">
      {values.map((v) => (
        <label key={v} className="tk-option">
          <input
            type="checkbox"
            className="tk-checkbox"
            checked={selected.includes(v)}
            onChange={() => toggle(v)}
          />
          <span>{optionLabel(column, v)}</span>
        </label>
      ))}
    </div>
  );
}

function TextFilterInput<T extends RowData>({ column }: { column: ReactColumnDef<T> }) {
  const { table } = useTableContext<T>();
  return (
    <input
      className="tk-input"
      aria-label={column.header ?? column.id}
      value={(table.getColumnFilter(column.id) as string | undefined) ?? ""}
      onChange={(e) => table.setColumnFilter(column.id, e.target.value)}
    />
  );
}

/** Popover with one section per filterable column. */
export function Filters() {
  const { table, labels } = useTableContext();
  const filterable = table.columns.filter((c) => c.filter);
  if (filterable.length === 0) return null;
  const count = table.state.columnFilters.length;

  return (
    <Popover
      label={labels.filters}
      align="end"
      className="tk-filters-panel"
      trigger={(p) => (
        <button type="button" className="tk-button" data-active={count > 0 || undefined} {...p}>
          <FilterIcon />
          <span>{labels.filters}</span>
          {count > 0 && <span className="tk-count">{count}</span>}
        </button>
      )}
    >
      <div className="tk-popover-body">
        {filterable.map((c) => {
          const name = c.header ?? c.id;
          return (
            <fieldset key={c.id} className="tk-filter-section">
              <legend>{name}</legend>
              {c.filter === "select" && <SelectOptions column={c} />}
              {c.filter === "range" && <RangeInputs column={c} />}
              {c.filter === "text" && <TextFilterInput column={c} />}
            </fieldset>
          );
        })}
      </div>
      <div className="tk-popover-footer">
        <button
          type="button"
          className="tk-button tk-button-ghost"
          disabled={count === 0}
          onClick={() => table.setState((s) => ({ ...s, columnFilters: [] }))}
        >
          {labels.clearAll}
        </button>
      </div>
    </Popover>
  );
}

function describeFilter<T extends RowData>(
  column: ReactColumnDef<T>,
  value: FilterValue,
  labels: ReturnType<typeof useTableContext>["labels"],
): string {
  if (typeof value === "string") return `“${value}”`;
  if (Array.isArray(value)) return value.map((v) => optionLabel(column, v)).join(", ");
  const { min, max } = value;
  if (min != null && min !== "" && max != null && max !== "") return `${min} – ${max}`;
  if (min != null && min !== "") return `≥ ${min}`;
  if (max != null && max !== "") return `≤ ${max}`;
  return labels.any;
}

/** Removable chips for active column filters. Renders nothing when none are active. */
export function FilterChips() {
  const { table, labels } = useTableContext();
  const active = table.state.columnFilters.filter((f) => isFilterActive(f.value));
  if (active.length === 0) return null;
  return (
    <ul className="tk-chips" aria-label={labels.filters}>
      {active.map((f) => {
        const column = table.getColumn(f.id);
        if (!column) return null;
        const name = column.header ?? column.id;
        return (
          <li key={f.id} className="tk-chip">
            <span className="tk-chip-name">{name}:</span>
            <span className="tk-chip-value">{describeFilter(column, f.value, labels)}</span>
            <button
              type="button"
              className="tk-icon-button tk-chip-remove"
              aria-label={labels.removeFilter(name)}
              onClick={() => table.setColumnFilter(f.id, undefined)}
            >
              <CloseIcon />
            </button>
          </li>
        );
      })}
      <li>
        <button type="button" className="tk-link-button" onClick={() => table.clearFilters()}>
          {labels.clearFilters}
        </button>
      </li>
    </ul>
  );
}

export interface ColumnToggleProps {
  /** Show visibility checkboxes. Default `true`; per column, `hideable: false` opts out. */
  hide?: boolean;
  /** Show drag handles to reorder columns. Default `true`; per column, `reorderable: false` opts out. */
  reorder?: boolean;
  /** Show pin toggles. Default `true`; per column, `pinnable: false` opts out. */
  pin?: boolean;
}

/**
 * Column menu: show/hide, pin, and reorder. Pinned columns are listed first in their own group,
 * mirroring the table. Reorder by dragging the handle (pointer or touch) or with the arrow keys
 * on the handle (Alt+Arrow also works from the checkbox). Moves never cross the pinned boundary;
 * pinning or unpinning is how a column changes group.
 */
export function ColumnToggle({ hide = true, reorder = true, pin = true }: ColumnToggleProps = {}) {
  const { table, labels, announce } = useTableContext();
  const hintId = useId();
  const groupId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  // Moving a node in the DOM drops its focus; put it back after React reorders the list.
  const refocus = useRef<{ id: string; part: string } | null>(null);
  useLayoutEffect(() => {
    const r = refocus.current;
    if (!r) return;
    refocus.current = null;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-column-id="${CSS.escape(r.id)}"] [data-part="${r.part}"]`)
      ?.focus();
  });

  const canMove = (c: ReactColumnDef<RowData>) => reorder && c.reorderable !== false;
  const canPin = (c: ReactColumnDef<RowData>) => pin && c.pinnable !== false;
  const items = table.orderedColumns.filter(
    (c) => !c.isActions && ((hide && c.hideable !== false) || canMove(c) || canPin(c)),
  );
  if (items.length === 0) return null;
  const visibleCount = table.visibleColumns.length;
  const pinned = items.filter((c) => c.pinned);
  const rest = items.filter((c) => !c.pinned);
  const anyMovable = items.some(canMove);
  const anyPinnable = items.some(canPin);
  const name = (c: ReactColumnDef<RowData>) => c.header ?? c.id;

  const announcePosition = (id: string) => {
    const c = table.getColumn(id);
    if (!c) return;
    // Position as the user sees it in the list, computed from the next order.
    requestAnimationFrame(() => {
      const ids = [
        ...(listRef.current?.querySelectorAll<HTMLElement>("[data-column-id]") ?? []),
      ].map((el) => el.dataset.columnId);
      announce(labels.columnMoved(name(c), ids.indexOf(id) + 1, ids.length));
    });
  };

  const step = (c: ReactColumnDef<RowData>, delta: -1 | 1, part: string) => {
    const group = c.pinned ? pinned : rest;
    const target = group[group.findIndex((g) => g.id === c.id) + delta];
    if (!target || !canMove(target)) return;
    refocus.current = { id: c.id, part };
    table.moveColumn(c.id, target.id);
    announcePosition(c.id);
  };

  const onMoveKey =
    (c: ReactColumnDef<RowData>, part: string, needsAlt: boolean) => (e: KeyboardEvent) => {
      if (!canMove(c) || (needsAlt && !e.altKey)) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      step(c, e.key === "ArrowUp" ? -1 : 1, part);
    };

  const onPointerDown = (c: ReactColumnDef<RowData>) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(c.id);
  };
  const onPointerMove = (c: ReactColumnDef<RowData>) => (e: PointerEvent<HTMLButtonElement>) => {
    if (dragging !== c.id) return;
    const over = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-column-id]");
    const targetId = over?.dataset.columnId;
    if (!targetId || targetId === c.id || !listRef.current?.contains(over)) return;
    const target = table.getColumn(targetId);
    const targetPinned = items.find((i) => i.id === targetId)?.pinned;
    if (!target || !canMove(target) || targetPinned !== c.pinned) return;
    table.moveColumn(c.id, targetId);
  };
  const onPointerEnd = (c: ReactColumnDef<RowData>) => () => {
    if (dragging !== c.id) return;
    setDragging(null);
    announcePosition(c.id);
  };

  const togglePin = (c: ReactColumnDef<RowData>) => {
    const next = !c.pinned;
    refocus.current = { id: c.id, part: "pin" };
    table.setColumnPinned(c.id, next);
    announce(next ? labels.columnPinned(name(c)) : labels.columnUnpinned(name(c)));
  };

  const renderItem = (c: ReactColumnDef<RowData>) => {
    const visible = table.state.columnVisibility[c.id] !== false;
    const hideable = hide && c.hideable !== false;
    return (
      <li
        key={c.id}
        className="tk-column-item"
        data-column-id={c.id}
        data-dragging={dragging === c.id || undefined}
      >
        {anyMovable &&
          (canMove(c) ? (
            <button
              type="button"
              className="tk-icon-button tk-drag-handle"
              data-part="handle"
              aria-label={labels.moveColumn(name(c))}
              aria-describedby={hintId}
              onKeyDown={onMoveKey(c, "handle", false)}
              onPointerDown={onPointerDown(c)}
              onPointerMove={onPointerMove(c)}
              onPointerUp={onPointerEnd(c)}
              onPointerCancel={onPointerEnd(c)}
            >
              <GripIcon />
            </button>
          ) : (
            <span className="tk-drag-handle" aria-hidden="true" />
          ))}
        {hide ? (
          <label className="tk-option">
            <input
              type="checkbox"
              className="tk-checkbox"
              data-part="toggle"
              checked={visible}
              // Never allow hiding the last visible column.
              disabled={!hideable || (visible && visibleCount <= 1)}
              onChange={() => table.toggleColumnVisibility(c.id)}
              onKeyDown={onMoveKey(c, "toggle", true)}
            />
            <span>{name(c)}</span>
          </label>
        ) : (
          <span className="tk-option">{name(c)}</span>
        )}
        {anyPinnable && canPin(c) && (
          <button
            type="button"
            className="tk-icon-button tk-pin-toggle"
            data-part="pin"
            aria-label={labels.pinColumn(name(c))}
            aria-pressed={c.pinned === true}
            onClick={() => togglePin(c)}
          >
            <PinIcon />
          </button>
        )}
      </li>
    );
  };

  return (
    <Popover
      label={anyMovable || anyPinnable ? labels.columnSettings : labels.toggleColumns}
      align="end"
      trigger={(p) => (
        <button type="button" className="tk-button" {...p}>
          <ColumnsIcon />
          <span>{labels.columns}</span>
        </button>
      )}
    >
      <div
        className="tk-popover-body tk-column-menu"
        ref={listRef}
        data-dragging={dragging ? "" : undefined}
      >
        {pinned.length > 0 && (
          <>
            <p className="tk-column-group" id={`${groupId}-pinned`}>
              {labels.pinnedColumns}
            </p>
            <ul className="tk-column-list" aria-labelledby={`${groupId}-pinned`}>
              {pinned.map(renderItem)}
            </ul>
            <hr className="tk-menu-separator" />
            <p className="tk-column-group" id={`${groupId}-rest`}>
              {labels.otherColumns}
            </p>
          </>
        )}
        <ul
          className="tk-column-list"
          aria-labelledby={pinned.length > 0 ? `${groupId}-rest` : undefined}
        >
          {rest.map(renderItem)}
        </ul>
        {anyMovable && (
          <p id={hintId} className="tk-sr-only">
            {labels.moveColumnHint}
          </p>
        )}
      </div>
    </Popover>
  );
}

export function DensityToggle() {
  const { density, setDensity, labels } = useTableContext();
  const name = useId();
  const options: [Density, string][] = [
    ["compact", labels.densityCompact],
    ["default", labels.densityDefault],
    ["comfortable", labels.densityComfortable],
  ];
  return (
    <fieldset className="tk-segmented">
      <legend className="tk-sr-only">{labels.density}</legend>
      {options.map(([value, text]) => (
        <label key={value} className="tk-segment" data-checked={density === value || undefined}>
          <input
            type="radio"
            name={name}
            value={value}
            checked={density === value}
            onChange={() => setDensity(value)}
            className="tk-sr-only"
          />
          <DensityGlyph density={value} />
          <span className="tk-sr-only">{text}</span>
        </label>
      ))}
    </fieldset>
  );
}

function DensityGlyph({ density }: { density: Density }) {
  if (density === "compact") return <DensityCompactIcon />;
  if (density === "comfortable") return <DensityComfortableIcon />;
  return <DensityDefaultIcon />;
}

/** Sort control for the stacked (card) layout, where there are no column headers. */
export function SortSelect() {
  const { table, labels, layout, announce } = useTableContext();
  const sortable = table.columns.filter((c) => c.sortable !== false);
  const id = useId();
  if (layout !== "stack" || sortable.length === 0) return null;
  const current = table.state.sorting[0];
  const value = current ? `${current.id}:${current.desc ? "desc" : "asc"}` : "";
  return (
    <div className="tk-sort-select">
      <label htmlFor={id} className="tk-sr-only">
        {labels.sortBy}
      </label>
      <select
        id={id}
        className="tk-input tk-select"
        value={value}
        onChange={(e) => {
          const [colId, dir] = e.target.value.split(":");
          if (!colId) {
            table.setSorting([]);
            announce(labels.sortCleared);
            return;
          }
          table.setSorting([{ id: colId, desc: dir === "desc" }]);
          const name = table.getColumn(colId)?.header ?? colId;
          announce(dir === "desc" ? labels.sortedDesc(name) : labels.sortedAsc(name));
        }}
      >
        <option value="">{labels.noSort}</option>
        {sortable.map((c) => (
          <optgroup key={c.id} label={c.header ?? c.id}>
            <option value={`${c.id}:asc`}>{`${c.header ?? c.id} ↑`}</option>
            <option value={`${c.id}:desc`}>{`${c.header ?? c.id} ↓`}</option>
          </optgroup>
        ))}
      </select>
    </div>
  );
}

/** Appears when rows are selected. Put bulk-action buttons in `children`. */
export function SelectionBar({ children }: { children?: ReactNode }) {
  const { table, labels } = useTableContext();
  const n = table.selectedRows.length;
  if (n === 0) return null;
  return (
    <section className="tk-selection-bar" aria-label={labels.selected(n)}>
      <span className="tk-selection-count" aria-live="polite">
        {labels.selected(n)}
      </span>
      <div className="tk-selection-actions">{children}</div>
      <button type="button" className="tk-button tk-button-ghost" onClick={table.clearSelection}>
        {labels.clearSelection}
      </button>
    </section>
  );
}
