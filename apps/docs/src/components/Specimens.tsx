import "@tablekit/react/styles.css";
import {
  type ActionItem,
  type ActionsDisplay,
  type ColumnSchemaInput,
  type ColumnSchemaType,
  DataTable,
  RowActionsGroup,
  type RowData,
  renderSchemaCell,
  type TableSchemaInput,
  type TableState,
} from "@tablekit/react";
import { type ReactNode, useEffect, useState } from "react";
import { banks } from "../data/logos";
import { makeMembers, makeOrders } from "../data/samples";
import { PresetStyles } from "./DocsTable";
import { PRESETS } from "./hostThemes";
import { setView, useView } from "./specStore";

// ---- Shared frame ---------------------------------------------------------------------------

/** Wraps specimens in the chosen design-system scope and density. */
function Scope({ children, className }: { children: ReactNode; className?: string }) {
  const { preset } = useView();
  return (
    <div
      className={`spec-scope not-prose ${className ?? ""}`}
      data-preset={preset === "default" ? undefined : preset}
    >
      <PresetStyles />
      {children}
    </div>
  );
}

function CopyRef({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="spec-ref"
      title="Copy a reference to paste into feedback"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`tablekit › ${reference}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {}
      }}
    >
      {copied ? "Copied" : reference}
    </button>
  );
}

// ---- Controls bar ---------------------------------------------------------------------------

export function SpecControls() {
  const view = useView();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  const setMode = (t: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
  };
  return (
    <div className="spec-controls not-prose">
      <fieldset className="docs-fieldset spec-control">
        <legend className="type-label text-faint">Design system</legend>
        <div className="docs-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="docs-chip"
              aria-pressed={view.preset === p.id}
              onClick={() => setView({ preset: p.id })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="docs-fieldset spec-control">
        <legend className="type-label text-faint">Mode</legend>
        <div className="docs-presets">
          <button
            type="button"
            className="docs-chip"
            aria-pressed={!dark}
            onClick={() => setMode("light")}
          >
            Light
          </button>
          <button
            type="button"
            className="docs-chip"
            aria-pressed={dark}
            onClick={() => setMode("dark")}
          >
            Dark
          </button>
        </div>
      </fieldset>
      <fieldset className="docs-fieldset spec-control">
        <legend className="type-label text-faint">Density</legend>
        <div className="docs-presets">
          {(["compact", "default", "comfortable"] as const).map((d) => (
            <button
              key={d}
              type="button"
              className="docs-chip"
              aria-pressed={view.density === d}
              onClick={() => setView({ density: d })}
            >
              {d[0]?.toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

// ---- Cell specimens -------------------------------------------------------------------------

interface CellVariant {
  name: string;
  column: ColumnSchemaInput;
  value: unknown;
  row?: Record<string, unknown>;
  /** Cell width in px, to show truncation. */
  width?: number;
  note?: string;
}

const col = (c: ColumnSchemaInput): ColumnSchemaType =>
  ({ ...c, type: c.type ?? "text" }) as ColumnSchemaType;

const TONE_LIST = ["neutral", "info", "success", "warning", "danger", "accent"] as const;

const CELLS: Record<string, { title: string; variants: CellVariant[] }> = {
  text: {
    title: "Text",
    variants: [
      { name: "default", column: { field: "v", header: "Name" }, value: "Northwind Traders" },
      {
        name: "truncated",
        column: { field: "v", header: "Name" },
        value: "Parcel & Co — Enterprise workspace (EU)",
        width: 180,
        note: "Ellipsis at the column width; full text on the row's screen-reader name.",
      },
      {
        name: "prefix + suffix",
        column: { field: "v", header: "Plan", format: { prefix: "Plan: ", suffix: " ✦" } },
        value: "Pro",
      },
      { name: "empty", column: { field: "v", header: "Name" }, value: null },
    ],
  },
  number: {
    title: "Number",
    variants: [
      { name: "default", column: { field: "v", header: "Items", type: "number" }, value: 1284 },
      {
        name: "2 decimals",
        column: { field: "v", header: "Score", type: "number", format: { decimals: 2 } },
        value: 98.4,
      },
      {
        name: "compact",
        column: { field: "v", header: "Views", type: "number", format: { notation: "compact" } },
        value: 1_254_300,
      },
      {
        name: "percent",
        column: {
          field: "v",
          header: "Bounce",
          type: "number",
          format: { style: "percent", decimals: 1 },
        },
        value: 0.423,
      },
      {
        name: "unit",
        column: {
          field: "v",
          header: "Size",
          type: "number",
          format: { unit: "kilobyte", notation: "compact" },
        },
        value: 48_200,
      },
      {
        name: "tabular alignment",
        column: { field: "v", header: "Amount", type: "number", format: { decimals: 2 } },
        value: 1111.11,
        note: "Inter tnum + zero + ss01: every digit the same width.",
      },
    ],
  },
  currency: {
    title: "Currency",
    variants: [
      {
        name: "USD",
        column: { field: "v", header: "Total", type: "currency", format: { currency: "USD" } },
        value: 2173.21,
      },
      {
        name: "EUR (de-DE)",
        column: {
          field: "v",
          header: "Total",
          type: "currency",
          format: { currency: "EUR", locale: "de-DE" },
        },
        value: 2173.21,
      },
      {
        name: "INR (en-IN)",
        column: {
          field: "v",
          header: "Amount",
          type: "currency",
          format: { currency: "INR", locale: "en-IN" },
        },
        value: 1741366.24,
        note: "Indian digit grouping: ₹17,41,366.24.",
      },
      {
        name: "JPY",
        column: { field: "v", header: "Total", type: "currency", format: { currency: "JPY" } },
        value: 318000,
      },
      {
        name: "compact",
        column: {
          field: "v",
          header: "ARR",
          type: "currency",
          format: { currency: "USD", notation: "compact" },
        },
        value: 4_820_000,
      },
      {
        name: "negative",
        column: { field: "v", header: "Refund", type: "currency", format: { currency: "USD" } },
        value: -129.5,
      },
    ],
  },
  date: {
    title: "Date",
    variants: [
      {
        name: "medium (default)",
        column: { field: "v", header: "Created", type: "date" },
        value: "2026-09-18T10:24:00Z",
      },
      {
        name: "short",
        column: { field: "v", header: "Created", type: "date", format: { dateStyle: "short" } },
        value: "2026-09-18T10:24:00Z",
      },
      {
        name: "long",
        column: { field: "v", header: "Created", type: "date", format: { dateStyle: "long" } },
        value: "2026-09-18T10:24:00Z",
      },
      {
        name: "relative",
        column: { field: "v", header: "Created", type: "date", format: { dateStyle: "relative" } },
        value: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      },
      {
        name: "date + time",
        column: {
          field: "v",
          header: "SLA due",
          type: "date",
          format: { dateStyle: "short", timeStyle: "short" },
        },
        value: "2026-09-18T16:45:00Z",
        note: "Hover shows the full timestamp.",
      },
    ],
  },
  badge: {
    title: "Badge",
    variants: [
      ...TONE_LIST.map(
        (tone): CellVariant => ({
          name: tone,
          column: {
            field: "v",
            header: "Status",
            type: "badge",
            badge: { tones: { [tone]: tone } },
          },
          value: tone,
          note: tone === "neutral" ? "Neutral is a true grey in every preset." : undefined,
        }),
      ),
      {
        name: "custom label",
        column: {
          field: "v",
          header: "Stock",
          type: "badge",
          badge: { tones: { in_stock: "success" }, labels: { in_stock: "In stock" } },
        },
        value: "in_stock",
      },
      {
        name: "humanized value",
        column: { field: "v", header: "Status", type: "badge", badge: { defaultTone: "warning" } },
        value: "on_hold",
        note: 'No label given: "on_hold" → "On hold".',
      },
      ...TONE_LIST.map(
        (tone): CellVariant => ({
          name: `icon · ${tone}`,
          column: {
            field: "v",
            header: "Status",
            type: "badge",
            badge: { tones: { [tone]: tone }, indicator: "icon" },
          },
          value: tone,
          note:
            tone === "neutral" ? "Each tone has a default Lucide icon (TONE_ICONS)." : undefined,
        }),
      ),
      {
        name: "icon · custom per value",
        column: {
          field: "v",
          header: "Settlement",
          type: "badge",
          badge: { tones: { processing: "info" }, icons: { processing: "loader" } },
        },
        value: "processing",
        note: "icons implies indicator: icon. The loader spins (not under reduced motion).",
      },
      {
        name: "icon · shipped",
        column: {
          field: "v",
          header: "Order",
          type: "badge",
          badge: { tones: { shipped: "accent" }, icons: { shipped: "truck" } },
        },
        value: "shipped",
      },
      {
        name: "icon · on hold",
        column: {
          field: "v",
          header: "Payout",
          type: "badge",
          badge: { tones: { on_hold: "warning" }, icons: { on_hold: "circle-pause" } },
        },
        value: "on_hold",
      },
      ...(["success", "warning", "danger"] as const).map(
        (tone): CellVariant => ({
          name: `icon-only · ${tone}`,
          column: {
            field: "v",
            header: "KYC",
            type: "badge",
            badge: { tones: { [tone]: tone }, indicator: "icon-only" },
          },
          value: tone,
          width: 120,
          note:
            tone === "success" ? "Label becomes the tooltip and screen-reader text." : undefined,
        }),
      ),
      ...TONE_LIST.map(
        (tone): CellVariant => ({
          name: `stroke · ${tone}`,
          column: {
            field: "v",
            header: "Status",
            type: "badge",
            badge: { tones: { [tone]: tone }, fill: false, stroke: true },
          },
          value: tone,
          note: tone === "neutral" ? "fill: false + stroke: true = outline badge." : undefined,
        }),
      ),
      ...(["success", "warning", "danger"] as const).map(
        (tone): CellVariant => ({
          name: `fill + stroke · ${tone}`,
          column: {
            field: "v",
            header: "Status",
            type: "badge",
            badge: { tones: { [tone]: tone }, stroke: true },
          },
          value: tone,
          note:
            tone === "success" ? "Tinted fill with a 1px ring in the tone's colour." : undefined,
        }),
      ),
      {
        name: "stroke + icon",
        column: {
          field: "v",
          header: "Settlement",
          type: "badge",
          badge: {
            tones: { settled: "success" },
            icons: { settled: "circle-check" },
            fill: false,
            stroke: true,
          },
        },
        value: "settled",
      },
      {
        name: "fill + stroke + icon",
        column: {
          field: "v",
          header: "Settlement",
          type: "badge",
          badge: { tones: { processing: "info" }, icons: { processing: "loader" }, stroke: true },
        },
        value: "processing",
      },
      {
        name: "text only (no fill, no stroke)",
        column: {
          field: "v",
          header: "Priority",
          type: "badge",
          badge: { tones: { urgent: "danger" }, fill: false },
        },
        value: "urgent",
        note: "Tinted text with its dot: the lightest option for dense tables.",
      },
      {
        name: "no indicator",
        column: {
          field: "v",
          header: "Plan",
          type: "badge",
          badge: { tones: { pro: "accent" }, indicator: "none" },
        },
        value: "pro",
      },
    ],
  },
  avatar: {
    title: "Avatar",
    variants: [
      {
        name: "initials",
        column: { field: "v", header: "Owner", type: "avatar" },
        value: "Ava Patel",
      },
      {
        name: "with subtitle",
        column: {
          field: "v",
          header: "Member",
          type: "avatar",
          avatar: { subtitleField: "email" },
        },
        value: "Kenji Haddad",
        row: { email: "kenji@parcelco.com" },
      },
      {
        name: "single name",
        column: { field: "v", header: "Owner", type: "avatar" },
        value: "Cher",
      },
      {
        name: "truncated",
        column: {
          field: "v",
          header: "Member",
          type: "avatar",
          avatar: { subtitleField: "email" },
        },
        value: "Maximiliana Oyelaran-Lindqvist",
        row: { email: "maximiliana.oyelaran-lindqvist@example.com" },
        width: 200,
      },
      {
        name: "logo · inline",
        column: {
          field: "v",
          header: "Bank",
          type: "avatar",
          avatar: { imageField: "logo", imageDarkField: "logoDark", logo: "inline" },
        },
        value: banks[0]?.name ?? "ICICI Bank",
        row: { logo: banks[0]?.logo, logoDark: banks[0]?.logoDark },
        note: "A 16px mark centred on the name's line; no container.",
      },
      {
        name: "logo · inline + subtitle",
        column: {
          field: "v",
          header: "Bank",
          type: "avatar",
          avatar: {
            imageField: "logo",
            imageDarkField: "logoDark",
            subtitleField: "acct",
            logo: "inline",
          },
        },
        value: banks.find((b) => b.slug === "deutschebank")?.name ?? "Deutsche Bank",
        row: {
          logo: banks.find((b) => b.slug === "deutschebank")?.logo,
          logoDark: banks.find((b) => b.slug === "deutschebank")?.logoDark,
          acct: "•••• 4821",
        },
        note: "Aligned to the first line (the name), not the middle of two lines.",
      },
      {
        name: "logo · circle, neutral",
        column: {
          field: "v",
          header: "Bank",
          type: "avatar",
          avatar: {
            imageField: "logo",
            imageDarkField: "logoDark",
            subtitleField: "acct",
            logo: "circle",
          },
        },
        value: banks.find((b) => b.slug === "axisbank")?.name ?? "Axis Bank",
        row: {
          logo: banks.find((b) => b.slug === "axisbank")?.logo,
          logoDark: banks.find((b) => b.slug === "axisbank")?.logoDark,
          acct: "•••• 1190",
        },
        note: "Mark centred in a neutral circle, no stroke.",
      },
      {
        name: "logo · circle, accent",
        column: {
          field: "v",
          header: "Bank",
          type: "avatar",
          avatar: {
            imageField: "logo",
            imageDarkField: "logoDark",
            logo: "circle",
            logoFill: "accent",
          },
        },
        value: banks.find((b) => b.slug === "barclays")?.name ?? "Barclays",
        row: {
          logo: banks.find((b) => b.slug === "barclays")?.logo,
          logoDark: banks.find((b) => b.slug === "barclays")?.logoDark,
        },
        note: "logoFill: accent tints the circle from --tk-color-accent.",
      },
      {
        name: "image fallback",
        column: { field: "v", header: "Owner", type: "avatar", avatar: { imageField: "photo" } },
        value: "Nora Rossi",
        row: { photo: "https://invalid.example/nora.png" },
        note: "Image fails to load → initials.",
      },
    ],
  },
  button: {
    title: "Button",
    variants: [
      {
        name: "secondary",
        column: {
          field: "v",
          header: "Receipt",
          type: "button",
          button: { id: "download", label: "Download" },
        },
        value: null,
        note: "One button per cell. Multiple actions belong in the row ⋯ menu.",
      },
      {
        name: "secondary + icon",
        column: {
          field: "v",
          header: "Receipt",
          type: "button",
          button: { id: "download", label: "Download", icon: "download" },
        },
        value: null,
      },
      {
        name: "primary",
        column: {
          field: "v",
          header: "Due",
          type: "button",
          button: { id: "pay", label: "Pay now", variant: "primary" },
        },
        value: null,
      },
      {
        name: "ghost",
        column: {
          field: "v",
          header: "Invite",
          type: "button",
          button: { id: "resend", label: "Resend", variant: "ghost", icon: "mail" },
        },
        value: null,
      },
      {
        name: "danger",
        column: {
          field: "v",
          header: "Access",
          type: "button",
          button: { id: "revoke", label: "Revoke", tone: "danger", icon: "ban" },
        },
        value: null,
      },
      {
        name: "label from value",
        column: { field: "v", header: "Status", type: "button", button: { id: "open" } },
        value: "Open ticket",
        note: "No label: the cell value becomes the button text.",
      },
    ],
  },
  link: {
    title: "Link",
    variants: [
      {
        name: "template",
        column: { field: "v", header: "Invoice", type: "link", link: { hrefTemplate: "#inv-{v}" } },
        value: "INV-04844",
      },
      {
        name: "external",
        column: {
          field: "v",
          header: "File",
          type: "link",
          link: { hrefField: "url", external: true },
        },
        value: "Brand guidelines.pdf",
        row: { url: "https://example.com" },
        note: "Opens in a new tab; icon marks it.",
      },
    ],
  },
  boolean: {
    title: "Boolean",
    variants: [
      { name: "true", column: { field: "v", header: "MFA", type: "boolean" }, value: true },
      { name: "false", column: { field: "v", header: "MFA", type: "boolean" }, value: false },
      {
        name: "custom labels",
        column: {
          field: "v",
          header: "Shared",
          type: "boolean",
          format: { trueLabel: "Shared", falseLabel: "Private" },
        },
        value: true,
        note: "Labels are read by screen readers.",
      },
    ],
  },
};

function CellTile({ id, variant }: { id: string; variant: CellVariant }) {
  const { density } = useView();
  const c = col(variant.column);
  const row = { v: variant.value, ...(variant.row ?? {}) };
  const align =
    c.type === "number" || c.type === "currency"
      ? "end"
      : c.type === "boolean"
        ? "center"
        : "start";
  const title = CELLS[id]?.title ?? id;
  const config = { ...variant.column, field: undefined, header: undefined };
  return (
    <figure className="spec-tile">
      <div className="spec-stage tk-root" data-density={density}>
        <div
          className="tk-scroll spec-cell-frame"
          style={variant.width ? { width: variant.width } : undefined}
        >
          <table className="tk-table" style={{ minWidth: 0 }}>
            <thead>
              <tr className="tk-tr">
                <th scope="col" className="tk-th" data-align={align}>
                  <span className="tk-th-label">{c.header}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="tk-tr">
                <td className="tk-td" data-align={align}>
                  {renderSchemaCell(c, variant.value, row)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="spec-caption">
        <CopyRef reference={`${title} / ${variant.name}`} />
        <code className="spec-config">{JSON.stringify(config)}</code>
        {variant.note && <span className="spec-note">{variant.note}</span>}
      </figcaption>
    </figure>
  );
}

type ActionVariant = {
  name: string;
  display?: ActionsDisplay;
  actions: ActionItem[];
  /** Rows to show (for conditional actions); each row gets its own visible actions. */
  rows?: { label: string; status: string }[];
  note?: string;
};

const ACTION_VARIANTS: ActionVariant[] = [
  {
    name: "menu",
    actions: [
      { id: "view", label: "View" },
      { id: "edit", label: "Edit" },
    ],
  },
  {
    name: "menu, destructive",
    actions: [
      { id: "view", label: "View" },
      { id: "refund", label: "Refund", tone: "danger" },
    ],
  },
  {
    name: "menu with icons",
    actions: [
      { id: "view", label: "View details", icon: "eye" },
      { id: "copy", label: "Copy payout ID", icon: "copy" },
      { id: "receipt", label: "Download receipt", icon: "download" },
      { id: "refund", label: "Refund", icon: "undo-2", tone: "danger" },
    ],
  },
  {
    name: "menu, groups + disabled",
    actions: [
      { id: "view", label: "View", icon: "eye" },
      { id: "edit", label: "Edit", icon: "pencil" },
      {
        id: "export",
        label: "Export (processing…)",
        icon: "download",
        disabled: true,
        separator: true,
      },
      { id: "archive", label: "Archive", icon: "archive" },
      { id: "delete", label: "Delete", icon: "trash-2", tone: "danger", separator: true },
    ],
    note: "separator starts a group; disabled items are skipped by the arrow keys.",
  },
  {
    name: "inline icons",
    display: "inline",
    actions: [
      { id: "view", label: "View", icon: "eye" },
      { id: "edit", label: "Edit", icon: "pencil" },
      { id: "delete", label: "Delete", icon: "trash-2", tone: "danger" },
    ],
    note: "Each icon's label is its tooltip and accessible name.",
  },
  {
    name: "conditional (when)",
    actions: [
      { id: "view", label: "View", icon: "eye" },
      {
        id: "refund",
        label: "Refund",
        tone: "danger",
        when: { field: "status", in: ["paid"] },
      } as ActionItem,
      {
        id: "retry",
        label: "Retry payout",
        when: { field: "status", in: ["failed"] },
      } as ActionItem,
    ],
    rows: [
      { label: "Paid", status: "paid" },
      { label: "Failed", status: "failed" },
    ],
    note: "Refund only on paid rows, Retry only on failed rows.",
  },
];

function ActionsTiles() {
  const { density } = useView();
  const [last, setLast] = useState("");
  return (
    <>
      {ACTION_VARIANTS.map((v) => {
        const rows = v.rows ?? [{ label: "", status: "" }];
        const config = {
          type: "actions",
          ...(v.display ? { actionsDisplay: v.display } : {}),
          actions: v.actions,
        };
        return (
          <figure className="spec-tile" key={v.name}>
            <div className="spec-stage tk-root" data-density={density}>
              <div className="tk-scroll spec-cell-frame">
                <table className="tk-table" style={{ minWidth: 0 }}>
                  <thead>
                    <tr className="tk-tr">
                      {v.rows && (
                        <th scope="col" className="tk-th">
                          <span className="tk-th-label">Status</span>
                        </th>
                      )}
                      <th scope="col" className="tk-th" data-actions="" data-align="end">
                        <span className="tk-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const visible = v.actions.filter(
                        (a) =>
                          !(a as { when?: { in: string[] } }).when ||
                          (a as { when: { in: string[] } }).when.in.includes(r.status),
                      );
                      return (
                        <tr className="tk-tr" key={r.status || "row"}>
                          {v.rows && <td className="tk-td">{r.label}</td>}
                          <td className="tk-td" data-actions="" data-align="end">
                            <RowActionsGroup
                              actions={visible}
                              display={v.display}
                              menuLabel="Row actions"
                              onAction={(id) => setLast(`${v.name}: ${id}`)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <figcaption className="spec-caption">
              <CopyRef reference={`Row actions / ${v.name}`} />
              <code className="spec-config">{JSON.stringify(config)}</code>
              <span className="spec-note">
                {v.note ?? "Click, or Tab + Enter; arrows move in menus, Esc closes."}
                {last.startsWith(`${v.name}:`) && ` Last: onAction("${last.split(": ")[1]}")`}
              </span>
            </figcaption>
          </figure>
        );
      })}
    </>
  );
}

/** `<CellSpecimen id="badge" />`: every variant of one cell type. */
export function CellSpecimen({ id }: { id: keyof typeof CELLS | "actions" }) {
  return (
    <Scope>
      <div className="spec-grid">
        {id === "actions" ? (
          <ActionsTiles />
        ) : (
          CELLS[id]?.variants.map((v) => <CellTile key={v.name} id={id} variant={v} />)
        )}
      </div>
    </Scope>
  );
}

// ---- Table parts ---------------------------------------------------------------------------

const orders = makeOrders(36) as unknown as RowData[];
const members = makeMembers(12) as unknown as RowData[];

const base: TableSchemaInput["features"] = {
  search: false,
  columnFilters: false,
  columnVisibility: false,
  columnReorder: false,
  columnPinning: false,
  pagination: false,
};

const orderCols: ColumnSchemaInput[] = [
  { field: "id", header: "Invoice", type: "link", link: { hrefTemplate: "#{id}" }, width: 130 },
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
    badge: {
      tones: {
        paid: "success",
        pending: "warning",
        overdue: "danger",
        refunded: "neutral",
        draft: "info",
      },
    },
    width: 130,
  },
  { field: "total", header: "Total", type: "currency", format: { currency: "USD" }, width: 120 },
];

function PartTile({
  reference,
  note,
  children,
}: {
  reference: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <figure className="spec-tile spec-tile-wide">
      <div className="spec-stage">{children}</div>
      <figcaption className="spec-caption">
        <CopyRef reference={reference} />
        {note && <span className="spec-note">{note}</span>}
      </figcaption>
    </figure>
  );
}

function Controlled({
  schema,
  data,
  initial,
  ...rest
}: {
  schema: TableSchemaInput;
  data: RowData[];
  initial?: Partial<TableState>;
  loading?: boolean;
  error?: unknown;
}) {
  const { density } = useView();
  const [state, setState] = useState<Partial<TableState>>(initial ?? {});
  return (
    <DataTable
      schema={schema}
      data={data}
      density={density}
      state={state}
      onStateChange={setState}
      onRetry={() => {}}
      {...rest}
    />
  );
}

const PARTS: Record<string, () => ReactNode> = {
  header: () => (
    <>
      <PartTile
        reference="Header / sort states"
        note="Unsorted (arrows on hover), ascending, descending, and the multi-sort index. Shift+click adds a sort. The drag handles on the right resize columns (arrow keys too)."
      >
        <Controlled
          schema={{
            title: "Header cells",
            columns: [
              ...orderCols.slice(0, 3),
              {
                field: "total",
                header: "Total",
                type: "currency",
                format: { currency: "USD" },
                width: 120,
              },
              { field: "created", header: "Created", type: "date", width: 130 },
            ],
            features: { ...base },
          }}
          data={orders.slice(0, 3)}
          initial={{
            sorting: [
              { id: "status", desc: false },
              { id: "total", desc: true },
            ],
          }}
        />
      </PartTile>
      <PartTile
        reference="Header / pinned first column"
        note="The pinned column stays put and shows an edge while the table scrolls sideways."
      >
        <div style={{ maxWidth: 520 }}>
          <Controlled
            schema={{
              title: "Pinned",
              columns: orderCols.map((c, i) =>
                i === 0 ? { ...c, pinned: true } : { ...c, width: 180 },
              ),
              features: { ...base },
              appearance: { responsive: "scroll" },
            }}
            data={orders.slice(0, 3)}
          />
        </div>
      </PartTile>
    </>
  ),
  selection: () => (
    <PartTile
      reference="Selection / checkboxes"
      note="Header checkbox is mixed when some rows on the page are selected; selected rows use --tk-color-row-selected."
    >
      <Controlled
        schema={{
          title: "Selection",
          columns: orderCols,
          features: { ...base, selection: "multi" },
        }}
        data={orders.slice(0, 4)}
        initial={{ rowSelection: { [String((orders[1] as { id: string }).id)]: true } }}
      />
    </PartTile>
  ),
  toolbar: () => (
    <PartTile
      reference="Toolbar / title, search, filters, columns"
      note="Title and description, global search, the filters popover and the column-visibility menu."
    >
      <Controlled
        schema={{
          title: "Invoices",
          description: "All invoices across workspaces.",
          columns: orderCols,
          features: {
            pagination: false,
            columnVisibility: true,
            columnFilters: true,
            search: true,
          },
        }}
        data={orders.slice(0, 3)}
      />
    </PartTile>
  ),
  "column-menu": () => (
    <PartTile
      reference="Column menu / show, pin, reorder"
      note="Open Columns. Pinned columns are grouped first, as in the table. Drag the grip (or focus it and press ↑/↓; Alt+↑/↓ from a checkbox) to reorder within a group; the pin moves a column between groups. Here Customer starts pinned and the table scrolls, so pinning shows its sticky edge."
    >
      <div style={{ maxWidth: 560 }}>
        <Controlled
          schema={{
            title: "Invoices",
            columns: [
              ...orderCols.map((c) => ({ ...c, width: 170 })),
              { field: "created", header: "Created", type: "date", width: 150 },
            ],
            features: { ...base, columnVisibility: true, columnReorder: true, columnPinning: true },
            appearance: { responsive: "scroll" },
          }}
          data={orders.slice(0, 4)}
          initial={{ columnPinning: { "customer.name": true } }}
        />
      </div>
    </PartTile>
  ),
  filters: () => (
    <PartTile
      reference="Filters / active chips"
      note="Each active filter becomes a removable chip; Clear filters resets them all. Open Filters to see select, range and text inputs."
    >
      <Controlled
        schema={{
          title: "Filtered",
          columns: orderCols,
          features: { pagination: false, columnVisibility: false, search: true },
        }}
        data={orders}
        initial={{
          columnFilters: [
            { id: "status", value: ["paid", "pending"] },
            { id: "total", value: { min: 100 } },
          ],
        }}
      />
    </PartTile>
  ),
  "selection-bar": () => (
    <PartTile
      reference="Selection bar / bulk actions"
      note="Appears when rows are selected; bulk actions come from schema.bulkActions."
    >
      <Controlled
        schema={{
          title: "Bulk actions",
          columns: orderCols,
          features: { ...base, selection: "multi" },
          bulkActions: [
            { id: "export", label: "Export CSV" },
            { id: "delete", label: "Delete", tone: "danger" },
          ],
        }}
        data={orders.slice(0, 4)}
        initial={{
          rowSelection: Object.fromEntries(
            orders.slice(0, 2).map((o) => [String((o as { id: string }).id), true]),
          ),
        }}
      />
    </PartTile>
  ),
  pagination: () => (
    <PartTile
      reference="Pagination / rows per page, range, pages"
      note="Compact page list with ellipses; the current page uses the accent."
    >
      <Controlled
        schema={{
          title: "Pagination",
          columns: orderCols,
          features: { ...base, pagination: true, pageSize: 5 },
        }}
        data={orders}
        initial={{ pagination: { pageIndex: 3, pageSize: 5 } }}
      />
    </PartTile>
  ),
  rows: () => (
    <>
      {(["plain", "zebra", "bordered"] as const).map((variant) => (
        <PartTile
          key={variant}
          reference={`Rows / ${variant}`}
          note={variant === "plain" ? "Hover a row to see --tk-color-row-hover." : undefined}
        >
          <Controlled
            schema={{
              title: `Rows: ${variant}`,
              columns: orderCols,
              features: { ...base },
              appearance: { variant },
            }}
            data={orders.slice(0, 4)}
          />
        </PartTile>
      ))}
    </>
  ),
  density: () => (
    <>
      {(["compact", "default", "comfortable"] as const).map((d) => (
        <PartTile key={d} reference={`Density / ${d}`}>
          <DataTable
            schema={{ title: `Density: ${d}`, columns: orderCols, features: { ...base } }}
            data={orders.slice(0, 3)}
            density={d}
          />
        </PartTile>
      ))}
    </>
  ),
  states: () => (
    <>
      <PartTile
        reference="States / loading (first load)"
        note="Skeleton rows while there's no data yet."
      >
        <Controlled
          schema={{ title: "Loading", columns: orderCols, features: { ...base } }}
          data={[]}
          loading
        />
      </PartTile>
      <PartTile
        reference="States / loading (refresh)"
        note="Existing rows dim, with a progress bar on top."
      >
        <Controlled
          schema={{ title: "Refreshing", columns: orderCols, features: { ...base } }}
          data={orders.slice(0, 3)}
          loading
        />
      </PartTile>
      <PartTile reference="States / empty">
        <Controlled
          schema={{
            title: "Empty",
            columns: orderCols,
            features: { ...base },
            emptyState: {
              title: "No invoices yet",
              description: "Invoices appear here once a customer is billed.",
            },
          }}
          data={[]}
        />
      </PartTile>
      <PartTile reference="States / no results" note="Filters are active but nothing matches.">
        <Controlled
          schema={{ title: "No results", columns: orderCols, features: { ...base, search: true } }}
          data={orders}
          initial={{ globalFilter: "zzzz" }}
        />
      </PartTile>
      <PartTile reference="States / error">
        <Controlled
          schema={{ title: "Error", columns: orderCols, features: { ...base } }}
          data={[]}
          error="The server responded with 503."
        />
      </PartTile>
    </>
  ),
  cards: () => (
    <PartTile
      reference="Cards / stacked layout"
      note="Below 640px of container width each row becomes a card: first column as title, actions in the header, a Sort select replaces the headers."
    >
      <div style={{ maxWidth: 400 }}>
        <Controlled
          schema={{
            title: "Members",
            columns: [
              {
                field: "name",
                header: "Member",
                type: "avatar",
                avatar: { subtitleField: "email" },
              },
              {
                field: "role",
                header: "Role",
                type: "badge",
                badge: { tones: { owner: "accent", admin: "info" } },
              },
              { field: "team", header: "Team" },
              {
                field: "lastActive",
                header: "Last active",
                type: "date",
                format: { dateStyle: "relative" },
              },
              {
                field: "actions",
                header: "Actions",
                type: "actions",
                actions: [
                  { id: "role", label: "Change role" },
                  { id: "remove", label: "Remove", tone: "danger" },
                ],
              },
            ],
            features: { ...base, selection: "multi" },
          }}
          data={members.slice(0, 3)}
        />
      </div>
    </PartTile>
  ),
};

/** `<PartSpecimen id="pagination" />`: one table part, rendered with the real DataTable. */
export function PartSpecimen({ id }: { id: keyof typeof PARTS }) {
  return (
    <Scope>
      <div className="spec-stack">{PARTS[id]?.()}</div>
    </Scope>
  );
}
