import { describe, expect, it } from "vitest";
import {
  type ColumnDef,
  createInitialState,
  createTable,
  fitColumnsToWidth,
  getFacetValues,
  getPageItems,
  getPageRange,
  getPinnedOffsets,
  getRequiredWidth,
  getRowModel,
  getSelectionStatus,
  getVisibleColumns,
  moveColumn,
  resizeColumn,
  resolveColumnOrder,
  setColumnFilter,
  setColumnPinned,
  toggleRow,
  toggleRows,
  toggleSort,
} from "./index";

type Person = { id: number; name: string; age: number | null; role: string; joined: string };

const data: Person[] = [
  { id: 1, name: "Ada", age: 36, role: "admin", joined: "2024-01-10" },
  { id: 2, name: "bob", age: 25, role: "editor", joined: "2023-06-01" },
  { id: 3, name: "Cleo", age: null, role: "viewer", joined: "2025-02-20" },
  { id: 4, name: "Dev 10", age: 41, role: "editor", joined: "2022-11-05" },
  { id: 5, name: "Dev 9", age: 25, role: "admin", joined: "2024-09-15" },
];

const columns: ColumnDef<Person>[] = [
  { id: "name", header: "Name", pinned: true, width: 200 },
  { id: "age", header: "Age", filter: "range" },
  { id: "role", header: "Role", filter: "select" },
  { id: "joined", header: "Joined" },
];

const opts = { data, columns };
const state = (s: Partial<ReturnType<typeof createInitialState>> = {}) => createInitialState(s);

describe("sorting", () => {
  it("sorts case-insensitively with natural numbers", () => {
    const m = getRowModel(opts, state({ sorting: [{ id: "name", desc: false }] }));
    expect(m.rows.map((r) => r.original.name)).toEqual(["Ada", "bob", "Cleo", "Dev 9", "Dev 10"]);
  });

  it("keeps nulls last in both directions", () => {
    const asc = getRowModel(opts, state({ sorting: [{ id: "age", desc: false }] }));
    const desc = getRowModel(opts, state({ sorting: [{ id: "age", desc: true }] }));
    expect(asc.rows.at(-1)?.original.name).toBe("Cleo");
    expect(desc.rows.at(-1)?.original.name).toBe("Cleo");
    expect(desc.rows[0]?.original.age).toBe(41);
  });

  it("multi-sorts and is stable", () => {
    const m = getRowModel(
      opts,
      state({
        sorting: [
          { id: "age", desc: false },
          { id: "name", desc: true },
        ],
      }),
    );
    expect(m.rows.slice(0, 2).map((r) => r.original.name)).toEqual(["Dev 9", "bob"]);
  });

  it("toggles none → asc → desc → none", () => {
    let s = toggleSort([], "name");
    expect(s).toEqual([{ id: "name", desc: false }]);
    s = toggleSort(s, "name");
    expect(s).toEqual([{ id: "name", desc: true }]);
    expect(toggleSort(s, "name")).toEqual([]);
    expect(toggleSort(s, "age", true)).toHaveLength(2);
    expect(toggleSort(s, "age", false)).toEqual([{ id: "age", desc: false }]);
  });
});

describe("filtering", () => {
  it("global search across searchable columns", () => {
    const m = getRowModel(opts, state({ globalFilter: "dev" }));
    expect(m.totalRows).toBe(2);
  });

  it("select + range filters combine", () => {
    let filters = setColumnFilter([], "role", ["editor", "admin"]);
    filters = setColumnFilter(filters, "age", { min: 30 });
    const m = getRowModel(opts, state({ columnFilters: filters }));
    expect(m.rows.map((r) => r.id)).toEqual(["1", "4"]);
  });

  it("clears inactive filters", () => {
    const f = setColumnFilter([{ id: "role", value: ["x"] }], "role", []);
    expect(f).toEqual([]);
  });

  it("builds facet values", () => {
    const m = getRowModel(opts, state());
    expect(getFacetValues(m.allRows, "role")).toEqual(["admin", "editor", "viewer"]);
  });
});

describe("pagination", () => {
  it("pages and clamps out-of-range page index", () => {
    const m = getRowModel(opts, state({ pagination: { pageIndex: 9, pageSize: 2 } }));
    expect(m.pageCount).toBe(3);
    expect(m.rows.map((r) => r.id)).toEqual(["5"]);
  });

  it("manual pagination passes rows through and uses rowCount", () => {
    const m = getRowModel(
      { ...opts, manualPagination: true, rowCount: 500 },
      state({ pagination: { pageIndex: 3, pageSize: 5 } }),
    );
    expect(m.rows).toHaveLength(5);
    expect(m.pageCount).toBe(100);
  });

  it("range + compact page items", () => {
    expect(getPageRange({ pageIndex: 1, pageSize: 10 }, 25)).toEqual({
      from: 11,
      to: 20,
      total: 25,
    });
    expect(getPageItems(0, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(5, 20)).toEqual([1, "…", 5, 6, 7, "…", 20]);
  });
});

describe("selection", () => {
  it("single mode replaces", () => {
    let s = toggleRow({}, "1", "single");
    s = toggleRow(s, "2", "single");
    expect(s).toEqual({ "2": true });
  });

  it("page select-all and status", () => {
    const m = getRowModel(opts, state({ pagination: { pageIndex: 0, pageSize: 2 } }));
    const s = toggleRows({ "5": true }, m.rows, true);
    expect(getSelectionStatus(s, m.rows)).toBe("all");
    expect(getSelectionStatus({ "1": true }, m.rows)).toBe("some");
    expect(toggleRows(s, m.rows, false)).toEqual({ "5": true });
  });
});

describe("columns", () => {
  it("pinned first, hidden removed", () => {
    const cols = getVisibleColumns([...columns].reverse(), { age: false });
    expect(cols.map((c) => c.id)).toEqual(["name", "joined", "role"]);
  });

  it("resize clamps to min/max", () => {
    const col = { id: "x", minWidth: 80, maxWidth: 300 };
    expect(resizeColumn({}, col, 10)).toEqual({ x: 80 });
    expect(resizeColumn({}, col, 9999)).toEqual({ x: 300 });
  });

  it("required width uses explicit, pinned and auto widths", () => {
    // name: pinned 200, age/role/joined: auto 120 each, + 44 leading
    expect(getRequiredWidth(columns, {}, 44)).toBe(200 + 3 * 120 + 44);
    expect(getRequiredWidth(columns, { age: 60 }, 0)).toBe(200 + 60 + 2 * 120);
  });

  it("fits columns to width by dropping the least important priority first", () => {
    const cols = [
      { id: "a", width: 200 },
      { id: "b", width: 200, priority: 2 },
      { id: "c", width: 200, priority: 4 },
      { id: "d", width: 200, priority: 5 },
    ];
    const ids = (w: number) => fitColumnsToWidth(cols, {}, w).map((c) => c.id);
    expect(ids(800)).toEqual(["a", "b", "c", "d"]);
    expect(ids(799)).toEqual(["a", "b", "c"]);
    expect(ids(400)).toEqual(["a", "b"]);
    expect(ids(100)).toEqual(["a"]); // never below the un-prioritized columns
  });

  it("applies column order, keeping pinned columns first", () => {
    const cols = getVisibleColumns(columns, {}, ["joined", "role", "name", "age"]);
    expect(cols.map((c) => c.id)).toEqual(["name", "joined", "role", "age"]);
    // Ids missing from the order keep declaration order at the end.
    expect(resolveColumnOrder(columns, ["role"])).toEqual(["name", "role", "age", "joined"]);
  });

  it("pinning state overrides the definition", () => {
    const cols = getVisibleColumns(columns, {}, [], { name: false, role: true });
    expect(cols.map((c) => [c.id, !!c.pinned])).toEqual([
      ["role", true],
      ["name", false],
      ["age", false],
      ["joined", false],
    ]);
  });

  it("moves a column within its group only", () => {
    expect(moveColumn(columns, [], {}, "joined", "age")).toEqual(["name", "joined", "age", "role"]);
    expect(moveColumn(columns, [], {}, "age", "joined")).toEqual(["name", "role", "joined", "age"]);
    // Across the pinned boundary: unchanged.
    expect(moveColumn(columns, [], {}, "age", "name")).toEqual(["name", "age", "role", "joined"]);
  });

  it("pinning lands a column at the end of the pinned group; unpinning at the start of the rest", () => {
    const pinned = setColumnPinned(columns, [], {}, "role", true);
    expect(pinned.columnOrder).toEqual(["name", "role", "age", "joined"]);
    expect(pinned.columnPinning).toEqual({ role: true });
    const unpinned = setColumnPinned(
      columns,
      pinned.columnOrder,
      pinned.columnPinning,
      "name",
      false,
    );
    expect(
      getVisibleColumns(columns, {}, unpinned.columnOrder, unpinned.columnPinning).map((c) => c.id),
    ).toEqual(["role", "name", "age", "joined"]);
  });

  it("pinned offsets include leading width", () => {
    expect(getPinnedOffsets(columns, {}, 40)).toEqual({ name: 40 });
  });
});

describe("createTable store", () => {
  it("notifies and recomputes", () => {
    const t = createTable(opts);
    let calls = 0;
    t.subscribe(() => calls++);
    t.setState((s) => ({ ...s, globalFilter: "ada" }));
    expect(calls).toBe(1);
    expect(t.getRowModel().rows).toHaveLength(1);
  });
});
