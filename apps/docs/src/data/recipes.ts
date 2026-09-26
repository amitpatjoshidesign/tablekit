// Prompt recipes — shown on the docs site AND bundled into llms-full.txt.
// Each schema is validated in CI (scripts/build-llms.mjs), so recipes can't drift from the API.
import type { TableSchemaInput } from "@tablekit/core";

export type DatasetKey =
  | "orders"
  | "members"
  | "deployments"
  | "leads"
  | "tickets"
  | "inventory"
  | "files"
  | "audit"
  | "apiKeys"
  | "topPages"
  | "settlements";

export interface Recipe {
  id: string;
  title: string;
  /** Copy-paste prompt for Claude Code, Cursor, v0, Lovable, … */
  prompt: string;
  schema: TableSchemaInput;
  /** Sample dataset key for a live preview on the docs site. */
  dataset?: DatasetKey;
}

const SUFFIX =
  "Use tablekit's <DataTable schema={…} /> from @tablekit/react (docs: {{LLMS_URL}}). Validate the schema with parseTableSchema from @tablekit/core/schema. Don't hardcode colors; use badge tones.";

export const recipes: Recipe[] = [
  {
    id: "settlements",
    title: "Bank settlements (INR)",
    dataset: "settlements",
    prompt: `Build a merchant settlements table for a payments dashboard: settlement id (pinned), merchant, destination bank with its compact 16px logo mark (avatar logo: inline, account number as subtitle, and a lighter variant of the mark for dark mode via imageDarkField), payment rail badge (UPI=accent, IMPS=info, NEFT=neutral, RTGS=warning), amount in INR (en-IN locale), status badge with icons (settled=success circle-check, processing=info spinning loader, on_hold=warning circle-pause, failed=danger circle-x) and settled time (relative). A "Retry" button cell only on failed rows, and a row ⋯ menu with View details, Download receipt, Copy UTR (never a row of text buttons). On narrow screens drop merchant, then settled time, rather than scrolling. Multi-select with a "Download report" bulk action. Newest first. ${SUFFIX}`,
    schema: {
      title: "Settlements",
      description: "Payouts to merchant bank accounts.",
      columns: [
        { field: "id", header: "Settlement", pinned: true, width: 134 },
        { field: "merchant", header: "Merchant", priority: 3, width: 168 },
        {
          field: "bank",
          header: "Bank",
          type: "avatar",
          avatar: {
            imageField: "bankLogo",
            imageDarkField: "bankLogoDark",
            subtitleField: "account",
            logo: "inline",
          },
          width: 212,
        },
        {
          field: "method",
          header: "Rail",
          type: "badge",
          badge: { tones: { UPI: "accent", IMPS: "info", NEFT: "neutral", RTGS: "warning" } },
          width: 96,
        },
        {
          field: "amount",
          header: "Amount",
          type: "currency",
          format: { currency: "INR", locale: "en-IN" },
          width: 140,
        },
        {
          field: "status",
          header: "Status",
          type: "badge",
          badge: {
            tones: { settled: "success", processing: "info", on_hold: "warning", failed: "danger" },
            icons: {
              settled: "circle-check",
              processing: "loader",
              on_hold: "circle-pause",
              failed: "circle-x",
            },
          },
          width: 130,
        },
        {
          field: "settledAt",
          header: "Settled",
          type: "date",
          format: { dateStyle: "relative" },
          priority: 2,
          width: 116,
        },
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
        {
          field: "actions",
          header: "Actions",
          type: "actions",
          actions: [
            { id: "view", label: "View details", icon: "eye" },
            { id: "receipt", label: "Download receipt", icon: "download" },
            { id: "copy", label: "Copy UTR", icon: "copy" },
            {
              id: "hold",
              label: "Put on hold",
              icon: "lock",
              when: { field: "status", in: ["processing"] },
              separator: true,
            },
          ],
        },
      ],
      features: { selection: "multi" },
      appearance: { responsive: "priority" },
      initialState: { sort: [{ id: "settledAt", desc: true }] },
      bulkActions: [{ id: "report", label: "Download report" }],
    },
  },
  {
    id: "invoices",
    title: "Invoices / orders",
    dataset: "orders",
    prompt: `Add an invoices table to the billing page. Columns: invoice number (links to /invoices/{id}), customer with avatar and email, status badge with icons (paid=success circle-check, pending=warning clock, overdue=danger triangle-alert, refunded=neutral undo-2, draft=info circle-dashed), plan, total in USD, created date (relative). Allow multi-select with an "Export CSV" bulk action and a row menu with "View" and "Refund" (destructive). Sort by created, newest first. ${SUFFIX}`,
    schema: {
      title: "Invoices",
      description: "All invoices across workspaces.",
      columns: [
        {
          field: "id",
          header: "Invoice",
          type: "link",
          link: { hrefTemplate: "/invoices/{id}" },
          pinned: true,
          width: 132,
        },
        {
          field: "customer.name",
          header: "Customer",
          type: "avatar",
          avatar: { subtitleField: "customer.email" },
          width: 220,
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
            icons: {
              paid: "circle-check",
              pending: "clock",
              overdue: "triangle-alert",
              refunded: "undo-2",
              draft: "circle-dashed",
            },
          },
          width: 130,
        },
        { field: "plan", header: "Plan", type: "text", filter: "select", priority: 3, width: 104 },
        {
          field: "total",
          header: "Total",
          type: "currency",
          format: { currency: "USD" },
          width: 120,
        },
        {
          field: "created",
          header: "Created",
          type: "date",
          format: { dateStyle: "relative" },
          priority: 2,
          width: 124,
        },
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
      initialState: { sort: [{ id: "created", desc: true }] },
      bulkActions: [{ id: "export", label: "Export CSV" }],
    },
  },
  {
    id: "members",
    title: "Team members admin",
    dataset: "members",
    prompt: `Build a team members admin table: member (avatar + email), role badge (owner=accent, admin=info, others neutral), team (filterable), status (active=success, invited=warning, suspended=danger), MFA enabled (boolean), last active (relative). Compact density, zebra rows. Row menu: "Change role", "Remove" (destructive). ${SUFFIX}`,
    schema: {
      title: "Members",
      columns: [
        {
          field: "name",
          header: "Member",
          type: "avatar",
          avatar: { subtitleField: "email" },
          width: 260,
        },
        {
          field: "role",
          header: "Role",
          type: "badge",
          badge: { tones: { owner: "accent", admin: "info" }, defaultTone: "neutral" },
        },
        { field: "team", header: "Team", filter: "select", priority: 2 },
        {
          field: "status",
          header: "Status",
          type: "badge",
          badge: { tones: { active: "success", invited: "warning", suspended: "danger" } },
        },
        {
          field: "mfa",
          header: "MFA",
          type: "boolean",
          format: { trueLabel: "Enabled", falseLabel: "Off" },
          priority: 3,
          width: 90,
        },
        {
          field: "lastActive",
          header: "Last active",
          type: "date",
          format: { dateStyle: "relative" },
          priority: 2,
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
      features: { selection: "multi", pageSize: 10 },
      appearance: { density: "compact", variant: "zebra" },
      bulkActions: [{ id: "remove", label: "Remove", tone: "danger" }],
    },
  },
  {
    id: "deployments",
    title: "Deployments / CI runs",
    dataset: "deployments",
    prompt: `Show recent deployments: id (monospace link to /deployments/{id}), service, environment badge (production=accent, staging=info, preview=neutral), status (ready=success, building=warning, failed=danger, canceled=neutral), commit message, author, duration in seconds (unit "second"), created (relative). On mobile, drop low-priority columns instead of stacking cards. ${SUFFIX}`,
    schema: {
      title: "Deployments",
      columns: [
        {
          field: "id",
          header: "Deployment",
          type: "link",
          link: { hrefTemplate: "/deployments/{id}" },
          width: 130,
        },
        { field: "service", header: "Service", filter: "select", width: 110 },
        {
          field: "environment",
          header: "Env",
          type: "badge",
          badge: { tones: { production: "accent", staging: "info", preview: "neutral" } },
          width: 130,
        },
        {
          field: "status",
          header: "Status",
          type: "badge",
          badge: {
            tones: { ready: "success", building: "warning", failed: "danger", canceled: "neutral" },
          },
          width: 120,
        },
        { field: "commit", header: "Commit", priority: 3, width: 220 },
        {
          field: "author",
          header: "Author",
          type: "avatar",
          priority: 4,
          width: 180,
        },
        {
          field: "duration",
          header: "Duration",
          type: "number",
          format: { unit: "second" },
          priority: 2,
          width: 110,
        },
        {
          field: "created",
          header: "Created",
          type: "date",
          format: { dateStyle: "relative" },
          width: 130,
        },
      ],
      appearance: { responsive: "priority" },
      initialState: { sort: [{ id: "created", desc: true }] },
    },
  },
  {
    id: "crm-leads",
    dataset: "leads",
    title: "CRM leads pipeline",
    prompt: `Create a leads table for a CRM: lead (avatar with company as subtitle), stage badge (new=info, qualified=accent, proposal=warning, won=success, lost=neutral), deal value in EUR with compact notation, owner, next step date, last contacted (relative). Single selection opens a side panel via onRowClick. ${SUFFIX}`,
    schema: {
      title: "Leads",
      columns: [
        {
          field: "name",
          header: "Lead",
          type: "avatar",
          avatar: { subtitleField: "company" },
        },
        {
          field: "stage",
          header: "Stage",
          type: "badge",
          badge: {
            tones: {
              new: "info",
              qualified: "accent",
              proposal: "warning",
              won: "success",
              lost: "neutral",
            },
          },
        },
        {
          field: "value",
          header: "Value",
          type: "currency",
          format: { currency: "EUR", notation: "compact" },
        },
        { field: "owner", header: "Owner", filter: "select", priority: 3 },
        {
          field: "nextStep",
          header: "Next step",
          type: "date",
          format: { dateStyle: "medium" },
          priority: 2,
        },
        {
          field: "lastContacted",
          header: "Last contacted",
          type: "date",
          format: { dateStyle: "relative" },
          priority: 4,
        },
      ],
      features: { selection: "single" },
    },
  },
  {
    id: "files",
    dataset: "files",
    title: "File browser",
    prompt: `Make a file list: name (link to the file URL in \`url\`, opens in a new tab), owner, size in kilobytes (unit "kilobyte", compact), type (select filter), shared (boolean), modified (relative). No pagination; sticky header inside a 480px scroll area. ${SUFFIX}`,
    schema: {
      title: "Files",
      columns: [
        { field: "name", header: "Name", type: "link", link: { hrefField: "url", external: true } },
        { field: "owner", header: "Owner", priority: 3 },
        {
          field: "size",
          header: "Size",
          type: "number",
          format: { unit: "kilobyte", notation: "compact" },
        },
        { field: "type", header: "Type", filter: "select", priority: 2 },
        { field: "shared", header: "Shared", type: "boolean" },
        { field: "modified", header: "Modified", type: "date", format: { dateStyle: "relative" } },
      ],
      features: { pagination: false },
    },
  },
  {
    id: "inventory",
    dataset: "inventory",
    title: "Product inventory",
    prompt: `Inventory table: SKU (pinned), product name, category (select filter), stock (number, range filter), price in USD, stock status badge derived server-side (in_stock=success, low=warning, out=danger), updated date. Bordered variant, comfortable density. Bulk actions "Restock" and "Archive". ${SUFFIX}`,
    schema: {
      title: "Inventory",
      columns: [
        { field: "sku", header: "SKU", pinned: true, width: 120 },
        { field: "name", header: "Product", width: 240 },
        { field: "category", header: "Category", filter: "select" },
        { field: "stock", header: "Stock", type: "number" },
        { field: "price", header: "Price", type: "currency", format: { currency: "USD" } },
        {
          field: "stockStatus",
          header: "Availability",
          type: "badge",
          badge: {
            tones: { in_stock: "success", low: "warning", out: "danger" },
            labels: { in_stock: "In stock", low: "Low", out: "Out of stock" },
          },
        },
        { field: "updated", header: "Updated", type: "date", priority: 3 },
      ],
      features: { selection: "multi" },
      appearance: { variant: "bordered", density: "comfortable" },
      bulkActions: [
        { id: "restock", label: "Restock" },
        { id: "archive", label: "Archive", tone: "danger" },
      ],
    },
  },
  {
    id: "support-tickets",
    dataset: "tickets",
    title: "Support tickets queue",
    prompt: `Support queue: ticket id (link /tickets/{id}), subject, requester (avatar), priority badge (urgent=danger, high=warning, normal=neutral, low=info), status, assignee, SLA due date (short date + short time). Default sort by priority then due date (multi-sort). ${SUFFIX}`,
    schema: {
      title: "Tickets",
      columns: [
        {
          field: "id",
          header: "Ticket",
          type: "link",
          link: { hrefTemplate: "/tickets/{id}" },
          width: 110,
        },
        { field: "subject", header: "Subject", width: 280 },
        {
          field: "requester",
          header: "Requester",
          type: "avatar",
          priority: 3,
        },
        {
          field: "priority",
          header: "Priority",
          type: "badge",
          badge: { tones: { urgent: "danger", high: "warning", normal: "neutral", low: "info" } },
        },
        {
          field: "status",
          header: "Status",
          type: "badge",
          badge: {
            tones: { open: "info", pending: "warning", on_hold: "neutral", solved: "success" },
          },
        },
        { field: "assignee", header: "Assignee", filter: "select", priority: 2 },
        {
          field: "due",
          header: "SLA due",
          type: "date",
          format: { dateStyle: "short", timeStyle: "short" },
        },
      ],
      initialState: {
        sort: [
          { id: "priority", desc: false },
          { id: "due", desc: false },
        ],
      },
    },
  },
  {
    id: "audit-log",
    dataset: "audit",
    title: "Audit log",
    prompt: `Read-only audit log: timestamp (medium date + time), actor (avatar), action (text filter), target, IP address, result badge (success=success, denied=danger). Compact, no selection, no column hiding, 50 rows per page. Server-side pagination with rowCount from the API. ${SUFFIX}`,
    schema: {
      title: "Audit log",
      columns: [
        {
          field: "at",
          header: "Time",
          type: "date",
          format: { dateStyle: "medium", timeStyle: "medium" },
          width: 200,
        },
        { field: "actor", header: "Actor", type: "avatar" },
        { field: "action", header: "Action", filter: "text" },
        { field: "target", header: "Target", priority: 2 },
        { field: "ip", header: "IP", priority: 4 },
        {
          field: "result",
          header: "Result",
          type: "badge",
          badge: { tones: { success: "success", denied: "danger" } },
        },
      ],
      features: { columnVisibility: false, pageSize: 50, pageSizeOptions: [50, 100, 200] },
      appearance: { density: "compact" },
    },
  },
  {
    id: "api-keys",
    dataset: "apiKeys",
    title: "API keys",
    prompt: `API keys settings table: name, key prefix (e.g. "sk_live_…a1b2"), scopes, created, last used (relative), expires (medium date), status (active=success, expired=neutral, revoked=danger). Row menu: "Roll key", "Revoke" (destructive). Empty state: "No API keys yet" / "Create a key to access the API.". ${SUFFIX}`,
    schema: {
      title: "API keys",
      columns: [
        { field: "name", header: "Name" },
        { field: "prefix", header: "Key", searchable: false },
        { field: "scopes", header: "Scopes", priority: 3 },
        { field: "lastUsed", header: "Last used", type: "date", format: { dateStyle: "relative" } },
        { field: "expires", header: "Expires", type: "date", priority: 2 },
        {
          field: "status",
          header: "Status",
          type: "badge",
          badge: { tones: { active: "success", expired: "neutral", revoked: "danger" } },
        },
        {
          field: "actions",
          header: "Actions",
          type: "actions",
          actions: [
            { id: "roll", label: "Roll key" },
            { id: "revoke", label: "Revoke", tone: "danger" },
          ],
        },
      ],
      features: { search: false, columnFilters: false, pagination: false },
      emptyState: { title: "No API keys yet", description: "Create a key to access the API." },
    },
  },
  {
    id: "top-pages",
    dataset: "topPages",
    title: "Analytics: top pages",
    prompt: `Analytics "Top pages" table: path (link), views (compact number), unique visitors (compact), bounce rate (percent, 1 decimal), avg. time on page (unit "second"), conversion (percent). Sorted by views desc, 25 per page, no search. ${SUFFIX}`,
    schema: {
      title: "Top pages",
      columns: [
        { field: "path", header: "Page", type: "link", link: { hrefField: "url" } },
        { field: "views", header: "Views", type: "number", format: { notation: "compact" } },
        {
          field: "visitors",
          header: "Visitors",
          type: "number",
          format: { notation: "compact" },
          priority: 2,
        },
        {
          field: "bounce",
          header: "Bounce",
          type: "number",
          format: { style: "percent", decimals: 1 },
          priority: 3,
        },
        {
          field: "avgTime",
          header: "Avg. time",
          type: "number",
          format: { unit: "second" },
          priority: 4,
        },
        {
          field: "conversion",
          header: "Conv.",
          type: "number",
          format: { style: "percent", decimals: 1 },
        },
      ],
      features: { search: false, pageSize: 25 },
      initialState: { sort: [{ id: "views", desc: true }] },
    },
  },
];
