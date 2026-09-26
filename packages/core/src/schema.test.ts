import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatNumber, humanize } from "./format";
import { parseTableSchema, TableSchema, type TableSchemaInput, toJSONSchema } from "./schema";
import { fillTemplate, getByPath, resolveSchema, schemaToColumns } from "./schema-columns";

const input: TableSchemaInput = {
  title: "Orders",
  columns: [
    { field: "id", header: "Order", type: "link", link: { hrefTemplate: "/orders/{id}" } },
    { field: "customer.name", header: "Customer", type: "avatar", pinned: true },
    { field: "status", header: "Status", type: "badge", badge: { tones: { paid: "success" } } },
    { field: "total", header: "Total", type: "currency", format: { currency: "EUR" } },
    { field: "created", header: "Created", type: "date" },
    {
      field: "menu",
      header: "Actions",
      type: "actions",
      actions: [{ id: "refund", label: "Refund" }],
    },
  ],
  features: { selection: "multi" },
  bulkActions: [{ id: "export", label: "Export" }],
};

describe("schema", () => {
  it("parses a valid schema", () => {
    const r = parseTableSchema(input);
    expect(r.success).toBe(true);
  });

  it("returns readable errors for agents", () => {
    const r = parseTableSchema({ columns: [{ field: "a", header: "A", type: "money" }] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors[0]).toMatch(/^columns\.0\.type:/);
  });

  it("rejects unknown props (no hallucinated keys)", () => {
    const r = parseTableSchema({ columns: [{ field: "a", header: "A", color: "red" }] });
    expect(r.success).toBe(false);
  });

  it("catches semantic mistakes", () => {
    const r = parseTableSchema({
      columns: [
        { field: "a", header: "A", badge: {} },
        { field: "a", header: "A2" },
      ],
      bulkActions: [{ id: "x", label: "X" }],
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors).toHaveLength(3);
  });

  it("resolveSchema defaults match zod defaults", () => {
    const viaZod = TableSchema.parse(input);
    const viaResolve = resolveSchema(input);
    expect(viaResolve.features).toEqual(viaZod.features);
    expect(viaResolve.appearance).toEqual(viaZod.appearance);
    expect(viaResolve.columns.map((c) => c.type)).toEqual(viaZod.columns.map((c) => c.type));
    const bare = { columns: [{ field: "a", header: "A" }] };
    expect(resolveSchema(bare).features).toEqual(TableSchema.parse(bare).features);
  });

  it("emits JSON Schema", () => {
    const js = toJSONSchema();
    expect(js.type).toBe("object");
    expect(JSON.stringify(js)).toContain("currency");
  });
});

describe("schemaToColumns", () => {
  const cols = schemaToColumns(resolveSchema(input));
  it("derives filters, alignment, sortability", () => {
    const byId = Object.fromEntries(cols.map((c) => [c.id, c]));
    expect(byId.status?.filter).toBe("select");
    expect(byId.total?.filter).toBe("range");
    expect(byId.total?.align).toBe("end");
    expect(byId.menu?.sortable).toBe(false);
    expect(byId.menu?.hideable).toBe(false);
  });
  it("reads dot paths", () => {
    const c = cols.find((c) => c.id === "customer.name");
    expect(typeof c?.accessor === "function" && c.accessor({ customer: { name: "Z" } })).toBe("Z");
  });
});

describe("helpers", () => {
  it("path + template", () => {
    expect(getByPath({ a: { b: 1 } }, "a.b")).toBe(1);
    expect(fillTemplate("/o/{id}?q={name}", { id: 7, name: "a b" })).toBe("/o/7?q=a%20b");
  });
  it("formats", () => {
    expect(formatCurrency(1234.5, { locale: "en-US", currency: "USD" })).toBe("$1,234.50");
    expect(formatNumber(0.25, { locale: "en-US", style: "percent" })).toBe("25%");
    expect(formatDate("2025-03-04T12:00:00Z", { locale: "en-US", dateStyle: "medium" })).toBe(
      "Mar 4, 2025",
    );
    expect(formatNumber(null)).toBe("");
    expect(humanize("in_progress")).toBe("In progress");
  });
});

describe("avatar.logo", () => {
  it("accepts inline/circle and rejects anything else", () => {
    const col = (logo: string) => ({
      columns: [{ field: "b", header: "Bank", type: "avatar", avatar: { logo } }],
    });
    expect(parseTableSchema(col("inline")).success).toBe(true);
    expect(parseTableSchema(col("circle")).success).toBe(true);
    expect(parseTableSchema(col("square")).success).toBe(false);
  });

  it("button columns need a button config; buttons/split displays are gone", () => {
    expect(
      parseTableSchema({ columns: [{ field: "x", header: "X", type: "button" }] }).success,
    ).toBe(false);
    expect(
      parseTableSchema({
        columns: [{ field: "x", header: "X", type: "button", button: { id: "pay" } }],
      }).success,
    ).toBe(true);
    expect(
      parseTableSchema({
        columns: [
          { field: "a", header: "A", type: "actions", actionsDisplay: "buttons", actions: [] },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("badge + action options", () => {
  it("validates icon names against the closed lists", () => {
    const ok = parseTableSchema({
      columns: [
        {
          field: "s",
          header: "S",
          type: "badge",
          badge: { indicator: "icon", icons: { a: "loader" } },
        },
        {
          field: "a",
          header: "A",
          type: "actions",
          actionsDisplay: "inline",
          actions: [{ id: "v", label: "View", icon: "eye" }],
        },
      ],
    });
    expect(ok.success).toBe(true);
    const badIcon = parseTableSchema({
      columns: [{ field: "s", header: "S", type: "badge", badge: { icons: { a: "rocket-ship" } } }],
    });
    expect(badIcon.success).toBe(false);
  });

  it("inline actions need icons", () => {
    const r = parseTableSchema({
      columns: [
        {
          field: "a",
          header: "A",
          type: "actions",
          actionsDisplay: "inline",
          actions: [{ id: "v", label: "View" }],
        },
      ],
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors[0]).toMatch(/actions\.0\.icon: required/);
  });
});
