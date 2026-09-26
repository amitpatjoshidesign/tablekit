import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { DataTable, Table, type TableSchemaInput, useTable } from "./index";

type Order = {
  id: string;
  customer: { name: string; email: string };
  status: string;
  total: number;
  created: string;
  paid: boolean;
};

const orders: Order[] = Array.from({ length: 23 }, (_, i) => ({
  id: `ORD-${String(i + 1).padStart(3, "0")}`,
  customer: { name: `Customer ${i + 1}`, email: `c${i + 1}@example.com` },
  status: ["paid", "pending", "refunded"][i % 3] as string,
  total: (i + 1) * 10.5,
  created: new Date(Date.UTC(2025, 0, 1 + i)).toISOString(),
  paid: i % 3 === 0,
}));

const schema: TableSchemaInput = {
  title: "Orders",
  columns: [
    { field: "id", header: "Order", type: "link", link: { hrefTemplate: "/orders/{id}" } },
    {
      field: "customer.name",
      header: "Customer",
      type: "avatar",
      avatar: { subtitleField: "customer.email" },
    },
    {
      field: "status",
      header: "Status",
      type: "badge",
      badge: { tones: { paid: "success", pending: "warning", refunded: "neutral" } },
    },
    {
      field: "total",
      header: "Total",
      type: "currency",
      format: { currency: "USD", locale: "en-US" },
    },
    { field: "created", header: "Created", type: "date", format: { locale: "en-US" } },
    { field: "paid", header: "Paid", type: "boolean" },
    {
      field: "actions",
      header: "Actions",
      type: "actions",
      actions: [
        { id: "view", label: "View" },
        { id: "refund", label: "Refund", tone: "danger" },
      ],
    },
  ],
  features: { selection: "multi", pageSize: 10 },
  bulkActions: [{ id: "export", label: "Export" }],
};

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } }, // jsdom can't compute styles
  });
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`);
  expect(summary).toEqual([]);
}

const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);

describe("<DataTable />", () => {
  it("renders formatted cells and paginates", () => {
    render(<DataTable schema={schema} data={orders} />);
    expect(screen.getByRole("table", { name: "Orders" })).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByRole("link", { name: "ORD-001" })).toHaveAttribute(
      "href",
      "/orders/ORD-001",
    );
    expect(screen.getByText("$10.50")).toBeInTheDocument();
    expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);
    expect(screen.getByText("1–10 of 23")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<DataTable schema={schema} data={orders} />);
    await expectNoAxeViolations(container);
  });

  it("sorts via header buttons and sets aria-sort", async () => {
    const user = userEvent.setup();
    render(<DataTable schema={schema} data={orders} />);
    const header = screen.getByRole("columnheader", { name: /Total/ });
    await user.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    await user.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(within(bodyRows()[0] as HTMLElement).getByText("$241.50")).toBeInTheDocument();
  });

  it("searches and shows the no-results state", async () => {
    const user = userEvent.setup();
    render(<DataTable schema={schema} data={orders} />);
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "Customer 7");
    expect(await screen.findByText("1–1 of 1")).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(await screen.findByText("No results")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText("1–10 of 23")).toBeInTheDocument();
  });

  it("filters with the select facet and shows a removable chip", async () => {
    const user = userEvent.setup();
    render(<DataTable schema={schema} data={orders} />);
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const dialog = screen.getByRole("dialog", { name: "Filters" });
    await user.click(within(dialog).getByRole("checkbox", { name: "Refunded" }));
    expect(screen.getByText("1–7 of 7")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Remove Status filter" }));
    expect(screen.getByText("1–10 of 23")).toBeInTheDocument();
  });

  it("selects rows and fires bulk actions with originals", async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn();
    render(<DataTable schema={schema} data={orders} onBulkAction={onBulkAction} />);
    await user.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(screen.getByText("10 selected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(onBulkAction).toHaveBeenCalledWith("export", expect.arrayContaining([orders[0]]));
    expect(onBulkAction.mock.calls[0]?.[1]).toHaveLength(10);
  });

  it("row action menu is keyboard operable", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<DataTable schema={schema} data={orders} onAction={onAction} />);
    await user.click(screen.getAllByRole("button", { name: "Row actions" })[0] as HTMLElement);
    const menu = screen.getByRole("menu");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "View" })).toHaveFocus());
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onAction).toHaveBeenCalledWith("refund", orders[0]);
  });

  it("paginates with next/prev", async () => {
    const user = userEvent.setup();
    render(<DataTable schema={schema} data={orders} />);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("11–20 of 23")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it("hides columns from the column menu", async () => {
    const user = userEvent.setup();
    render(<DataTable schema={schema} data={orders} />);
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(screen.getByRole("checkbox", { name: "Customer" }));
    expect(screen.queryByRole("columnheader", { name: /Customer/ })).not.toBeInTheDocument();
  });

  const headerNames = () =>
    within(screen.getByRole("table"))
      .getAllByRole("columnheader")
      .map((th) => th.textContent?.trim())
      .filter(Boolean);

  it("reorders columns from the column menu with the keyboard, and announces it", async () => {
    const user = userEvent.setup();
    const { container } = render(<DataTable schema={schema} data={orders} />);
    await user.click(screen.getByRole("button", { name: "Columns" }));
    expect(screen.getByRole("dialog", { name: /pin or reorder/ })).toBeInTheDocument();
    // Row actions are neither listed nor movable.
    expect(screen.queryByRole("button", { name: "Move Actions" })).not.toBeInTheDocument();

    // The dialog focuses its first control on open.
    await waitFor(() => expect(screen.getByRole("button", { name: "Move Order" })).toHaveFocus());
    const handle = screen.getByRole("button", { name: "Move Total" });
    handle.focus();
    await user.keyboard("{ArrowUp}");
    expect(headerNames().slice(0, 5)).toEqual(["Order", "Customer", "Total", "Status", "Created"]);
    expect(screen.getByRole("button", { name: "Move Total" })).toHaveFocus();
    await waitFor(() =>
      expect(container.querySelector("[aria-live]")?.textContent).toMatch(
        /Total moved to position 3 of 6/,
      ),
    );

    // Alt+Arrow from the checkbox also moves.
    screen.getByRole("checkbox", { name: "Order" }).focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(headerNames().slice(0, 2)).toEqual(["Customer", "Order"]);
    await expectNoAxeViolations(container);
  });

  it("pins columns from the column menu into their own group", async () => {
    const user = userEvent.setup();
    const onStateChange = vi.fn();
    const { container } = render(
      <DataTable schema={schema} data={orders} onStateChange={onStateChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    const pin = screen.getByRole("button", { name: "Pin Status" });
    expect(pin).toHaveAttribute("aria-pressed", "false");
    await user.click(pin);

    expect(screen.getByRole("button", { name: "Pin Status" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Pin Status" })).toHaveFocus();
    expect(headerNames()[0]).toBe("Status");
    const th = screen.getByRole("columnheader", { name: /Status/ });
    expect(th).toHaveAttribute("data-pinned");
    const pinnedGroup = screen.getByRole("list", { name: "Pinned" });
    expect(within(pinnedGroup).getByText("Status")).toBeInTheDocument();
    // Moves never cross the pinned boundary.
    screen.getByRole("button", { name: "Move Order" }).focus();
    await user.keyboard("{ArrowUp}");
    expect(headerNames().slice(0, 2)).toEqual(["Status", "Order"]);
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ columnPinning: { status: true } }),
    );
    await expectNoAxeViolations(container);
  });

  it("feature flags turn pinning and reordering off", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        schema={{
          ...schema,
          features: { ...schema.features, columnReorder: false, columnPinning: false },
        }}
        data={orders}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    expect(screen.getByRole("dialog", { name: "Show or hide columns" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Move / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pin / })).not.toBeInTheDocument();
  });

  it("renders loading, error and empty states", async () => {
    const { rerender, container } = render(<DataTable schema={schema} data={[]} loading />);
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    const onRetry = vi.fn();
    rerender(<DataTable schema={schema} data={[]} error="Network down" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Network down");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
    rerender(
      <DataTable schema={{ ...schema, emptyState: { title: "No orders yet" } }} data={[]} />,
    );
    expect(screen.getByText("No orders yet")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("arrow keys move focus between cells", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        schema={{ ...schema, features: { selection: "none" }, bulkActions: undefined }}
        data={orders}
      />,
    );
    const firstLink = screen.getByRole("link", { name: "ORD-001" });
    firstLink.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "ORD-002" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement?.closest("td")?.dataset.c).toBe("1");
  });
});

describe("composable API", () => {
  function Composable() {
    const table = useTable({
      data: [
        { id: "a", name: "Alpha", score: 3 },
        { id: "b", name: "Beta", score: 1 },
      ],
      columns: [
        { id: "name", header: "Name" },
        {
          id: "score",
          header: "Score",
          align: "end",
          cell: ({ value }) => <strong>{String(value)}</strong>,
        },
      ],
    });
    return (
      <Table.Root table={table} aria-label="Scores" variant="zebra">
        <Table.Toolbar title="Scores">
          <Table.Search />
          <Table.DensityToggle />
        </Table.Toolbar>
        <Table.Content />
        <Table.Pagination />
      </Table.Root>
    );
  }

  it("renders custom cells and switches density", async () => {
    const user = userEvent.setup();
    const { container } = render(<Composable />);
    expect(screen.getByText("3").tagName).toBe("STRONG");
    await user.click(screen.getByLabelText("Compact"));
    expect(container.querySelector(".tk-root")).toHaveAttribute("data-density", "compact");
    await expectNoAxeViolations(container);
  });
});

describe("avatars", () => {
  it("imageDarkField renders a light and a dark image, switched by scheme tokens", () => {
    const { container } = render(
      <DataTable
        schema={{
          columns: [
            {
              field: "bank",
              header: "Bank",
              type: "avatar",
              avatar: { imageField: "logo", imageDarkField: "logoDark", logo: "circle" },
            },
          ],
        }}
        data={[{ id: 1, bank: "Acme Bank", logo: "/light.svg", logoDark: "/dark.svg" }]}
      />,
    );
    const imgs = [...container.querySelectorAll(".tk-avatar-img img")];
    expect(imgs.map((i) => [i.getAttribute("src"), i.getAttribute("data-scheme")])).toEqual([
      ["/light.svg", "light"],
      ["/dark.svg", "dark"],
    ]);
    expect(imgs.every((i) => i.getAttribute("alt") === "")).toBe(true);
  });

  it("logo and image backgrounds have no hard-coded light colours", () => {
    const css = readFileSync(resolve(__dirname, "tablekit.css"), "utf8");
    const tokens = readFileSync(resolve(__dirname, "../../tokens/src/tokens.mjs"), "utf8");
    expect(css).not.toMatch(/--tk-avatar-image-bg,\s*#/);
    const dark = tokens.slice(tokens.indexOf("  dark: {"), tokens.indexOf("/** Badge tones"));
    expect(dark).toMatch(/"logo-bg": "transparent"/);
    expect(dark).not.toMatch(/"logo-fill": "#[ef]/i);
  });

  it("initials take a theme tone by name: varied, stable, never danger", () => {
    const tonesOf = (c: HTMLElement) =>
      [...c.querySelectorAll(".tk-avatar-img")].map((el) => el.getAttribute("data-tone"));
    const first = render(<DataTable schema={schema} data={orders} />);
    const tones = tonesOf(first.container);
    first.unmount();
    expect(new Set(tones).size).toBeGreaterThan(2);
    expect(
      tones.every((t) => ["accent", "info", "success", "warning", "neutral"].includes(t ?? "")),
    ).toBe(true);
    const again = render(<DataTable schema={schema} data={orders} />);
    expect(tonesOf(again.container)).toEqual(tones);
  });

  it("shows the image and falls back to initials when it fails to load", async () => {
    const { container } = render(
      <DataTable
        schema={{
          title: "People",
          columns: [
            { field: "name", header: "Name", type: "avatar", avatar: { imageField: "photo" } },
          ],
        }}
        data={[
          { id: "1", name: "Ada Lovelace", photo: "https://example.com/ada.png" },
          { id: "2", name: "Alan Turing" },
        ]}
      />,
    );
    const img = container.querySelector(".tk-avatar-img img") as HTMLImageElement;
    expect(img).toHaveAttribute("src", "https://example.com/ada.png");
    expect(img).toHaveAttribute("alt", ""); // decorative: the name is right next to it
    expect(screen.getByText("AT")).toBeInTheDocument();
    img.dispatchEvent(new Event("error"));
    expect(await screen.findByText("AL")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe("stylesheet stacking order", () => {
  // Every rule is zero-specificity :where(), so source order decides which z-index wins.
  // Regression: pinned header cells were reset to z-index 1 and scrolled columns slid over them.
  it("keeps pinned header cells above sticky header and pinned body cells", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const css = readFileSync(resolve(process.cwd(), "packages/react/src/tablekit.css"), "utf8");
    const at = (selector: string) => css.lastIndexOf(selector);
    const pinnedBase = at(":where(.tk-th[data-pinned], .tk-td[data-pinned])");
    const stickyHeader = at(":where(.tk-table[data-sticky-header] thead .tk-th)");
    const pinnedHeader = at(":where(thead .tk-th[data-pinned])");
    expect(pinnedBase).toBeGreaterThan(-1);
    expect(pinnedHeader).toBeGreaterThan(pinnedBase);
    expect(pinnedHeader).toBeGreaterThan(stickyHeader);
    expect(css.slice(pinnedHeader, pinnedHeader + 80)).toContain("z-index: 3");
  });
});

describe("icons and logo avatars", () => {
  it("renders Lucide icons, decorative and sized for the table", () => {
    const { container } = render(<DataTable schema={schema} data={orders} />);
    const icons = [...container.querySelectorAll("svg.tk-icon")];
    expect(icons.length).toBeGreaterThan(5);
    for (const svg of icons) {
      expect(svg).toHaveClass("lucide");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
    expect(container.querySelector("svg.lucide-chevrons-up-down")).toBeInTheDocument(); // unsorted header
  });

  it("logo avatars: inline (line-height mark) and circle (filled), never a ring", () => {
    const logoSchema = (logo: "inline" | "circle"): TableSchemaInput => ({
      title: "Banks",
      columns: [
        { field: "bank", header: "Bank", type: "avatar", avatar: { imageField: "logo", logo } },
      ],
    });
    const data = [
      { id: "1", bank: "ICICI Bank", logo: "data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E" },
    ];
    const { container, rerender } = render(<DataTable schema={logoSchema("inline")} data={data} />);
    const tile = () => container.querySelector(".tk-avatar-img") as HTMLElement;
    expect(tile()).toHaveAttribute("data-logo", "inline");
    expect(tile()).not.toHaveAttribute("data-ring");
    rerender(<DataTable schema={logoSchema("circle")} data={data} />);
    expect(tile()).toHaveAttribute("data-logo", "circle");
    expect(tile()).toHaveAttribute("data-logo-fill", "neutral");
    expect(screen.getByText("ICICI Bank")).toBeInTheDocument();
  });
});

describe("badge indicators", () => {
  const badgeSchema = (badge: Record<string, unknown>): TableSchemaInput => ({
    title: "Payments",
    columns: [{ field: "status", header: "Status", type: "badge", badge }],
  });
  const rows = [
    { id: "1", status: "settled" },
    { id: "2", status: "processing" },
  ];

  it("icon indicator uses per-value icons, falling back to the tone icon", () => {
    const { container } = render(
      <DataTable
        schema={badgeSchema({
          tones: { settled: "success", processing: "info" },
          icons: { processing: "loader" },
        })}
        data={rows}
      />,
    );
    expect(container.querySelector(".tk-badge-dot")).toBeNull();
    expect(container.querySelector("svg.lucide-circle-check")).toBeInTheDocument(); // success default
    expect(container.querySelector("svg.lucide-loader-circle")).toHaveAttribute("data-spin");
  });

  it("icon-only keeps the label for screen readers and as a tooltip", async () => {
    const { container } = render(
      <DataTable
        schema={badgeSchema({ tones: { settled: "success" }, indicator: "icon-only" })}
        data={rows}
      />,
    );
    const badge = container.querySelector('.tk-badge[data-indicator="icon-only"]') as HTMLElement;
    expect(badge).toHaveAttribute("title", "Settled");
    expect(within(badge).getByText("Settled")).toHaveClass("tk-sr-only");
    await expectNoAxeViolations(container);
  });
});

describe("row action variants", () => {
  const actionsSchema = (column: Record<string, unknown>): TableSchemaInput => ({
    title: "Payouts",
    columns: [
      { field: "id", header: "Payout" },
      { field: "actions", header: "Actions", type: "actions", ...column },
    ],
  });
  const rows = [
    { id: "p1", status: "paid" },
    { id: "p2", status: "refunded" },
  ];

  it("inline: icon buttons named by their label", async () => {
    const onAction = vi.fn();
    render(
      <DataTable
        schema={actionsSchema({
          actionsDisplay: "inline",
          actions: [
            { id: "view", label: "View", icon: "eye" },
            { id: "delete", label: "Delete", icon: "trash-2", tone: "danger" },
          ],
        })}
        data={rows.slice(0, 1)}
        onAction={onAction}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onAction).toHaveBeenCalledWith("delete", rows[0]);
  });

  it("menu: when + disabled + separator respected, no text buttons in the row", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        schema={actionsSchema({
          actions: [
            { id: "view", label: "View" },
            {
              id: "refund",
              label: "Refund",
              tone: "danger",
              when: { field: "status", in: ["paid"] },
            },
            { id: "export", label: "Export", disabled: true, separator: true },
          ],
        })}
        data={rows}
      />,
    );
    expect(
      container.querySelectorAll("tbody .tk-cell-button, tbody .tk-action-button"),
    ).toHaveLength(0);
    const [menuPaid, menuRefunded] = screen.getAllByRole("button", { name: "Row actions" });
    await user.click(menuPaid as HTMLElement);
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Refund" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Export" })).toBeDisabled();
    expect(menu.querySelector("hr.tk-menu-separator")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(menuRefunded as HTMLElement);
    const menu2 = await screen.findByRole("menu");
    expect(within(menu2).queryByRole("menuitem", { name: "Refund" })).toBeNull();
  });

  it("button column: one button per cell, conditional, fires onAction", async () => {
    const onAction = vi.fn();
    render(
      <DataTable
        schema={{
          title: "Payouts",
          columns: [
            { field: "id", header: "Payout" },
            {
              field: "retry",
              header: "Retry",
              type: "button",
              button: {
                id: "retry",
                label: "Retry",
                icon: "refresh-cw",
                when: { field: "status", in: ["failed"] },
              },
            },
          ],
        }}
        data={[
          { id: "p1", status: "paid" },
          { id: "p2", status: "failed" },
        ]}
        onAction={onAction}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: "Retry" });
    expect(buttons).toHaveLength(1);
    await userEvent.click(buttons[0] as HTMLElement);
    expect(onAction).toHaveBeenCalledWith("retry", { id: "p2", status: "failed" });
  });
});

describe("badge fill and stroke", () => {
  const one = (badge: Record<string, unknown>) => (
    <DataTable
      schema={{ title: "S", columns: [{ field: "s", header: "S", type: "badge", badge }] }}
      data={[{ id: "1", s: "paid" }]}
    />
  );
  it("maps fill/stroke to data attributes (fill default on, stroke default off)", () => {
    const { container, rerender } = render(one({ tones: { paid: "success" } }));
    const badge = () => container.querySelector(".tk-badge") as HTMLElement;
    expect(badge()).not.toHaveAttribute("data-stroke");
    expect(badge()).not.toHaveAttribute("data-fill");
    rerender(one({ tones: { paid: "success" }, stroke: true }));
    expect(badge()).toHaveAttribute("data-stroke");
    rerender(one({ tones: { paid: "success" }, fill: false, stroke: true }));
    expect(badge()).toHaveAttribute("data-fill", "false");
    expect(badge()).toHaveAttribute("data-stroke");
  });
});
