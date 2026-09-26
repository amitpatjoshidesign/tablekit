/**
 * Declarative table schema — the contract agents write against.
 *
 * Import from `@tablekit/core/schema` (this entry depends on zod; the main entry does not).
 * A JSON Schema version ships as `@tablekit/core/tablekit.schema.json`.
 */
import { z } from "zod";
import { ACTION_ICONS, ACTIONS_DISPLAYS, BADGE_ICONS } from "./badge-icons.ts";

export const COLUMN_TYPES = [
  "text",
  "number",
  "currency",
  "date",
  "badge",
  "avatar",
  "link",
  "boolean",
  "actions",
  "button",
] as const;

export const TONES = ["neutral", "info", "success", "warning", "danger", "accent"] as const;

const Tone = z
  .enum(TONES)
  .describe("Semantic color. Maps to --tk-tone-* tokens; never a raw color.");

const Action = z
  .object({
    id: z.string().describe("Stable id passed to onAction / onBulkAction."),
    label: z.string(),
    tone: z.enum(["neutral", "danger"]).optional().describe("`danger` for destructive actions."),
    icon: z
      .enum(ACTION_ICONS)
      .optional()
      .describe("Lucide icon name. Required for every action when actionsDisplay is inline."),
    disabled: z.boolean().optional().describe("Shown but not selectable."),
    separator: z.boolean().optional().describe("Draw a divider before this item (menu only)."),
    when: z
      .object({ field: z.string(), in: z.array(z.string()).min(1) })
      .strict()
      .optional()
      .describe(
        'Only show for rows where row[field] is one of `in`, e.g. { "field": "status", "in": ["paid"] }.',
      ),
  })
  .strict();

export const ColumnSchema = z
  .object({
    field: z
      .string()
      .min(1)
      .describe("Row property to read. Dot paths are supported: `customer.name`."),
    header: z.string().describe("Visible column label."),
    type: z
      .enum(COLUMN_TYPES)
      .default("text")
      .describe("Controls formatting, alignment, sorting and the default filter."),
    id: z.string().optional().describe("Defaults to `field`. Must be unique."),

    sortable: z.boolean().optional().describe("Default true (false for `actions`)."),
    filter: z
      .union([z.enum(["text", "select", "range"]), z.literal(false)])
      .optional()
      .describe(
        "Column filter UI. Defaults: badge/boolean → select, number/currency/date → range, others → none.",
      ),
    searchable: z.boolean().optional().describe("Include in global search. Default true."),
    hideable: z.boolean().optional().describe("Show in the column visibility menu. Default true."),
    hidden: z.boolean().optional().describe("Start hidden."),
    width: z.number().int().positive().optional().describe("Initial width in px."),
    minWidth: z.number().int().positive().optional(),
    maxWidth: z.number().int().positive().optional(),
    pinned: z
      .boolean()
      .optional()
      .describe(
        "Initially pinned to the start edge (sticky when scrolling horizontally). Users can change it when features.columnPinning is on.",
      ),
    priority: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe("1 = always visible … 5 = first to hide on narrow screens (responsive=priority)."),
    align: z.enum(["start", "center", "end"]).optional().describe("Numbers default to end."),

    format: z
      .object({
        locale: z.string().optional().describe("BCP 47, e.g. `en-US`, `de-DE`."),
        currency: z.string().length(3).optional().describe("ISO 4217 code, e.g. `USD`."),
        decimals: z.number().int().min(0).max(8).optional(),
        notation: z.enum(["standard", "compact"]).optional(),
        style: z.enum(["decimal", "percent"]).optional(),
        unit: z.string().optional().describe("Intl unit, e.g. `kilobyte`, `percent`."),
        dateStyle: z.enum(["short", "medium", "long", "relative"]).optional(),
        timeStyle: z.enum(["short", "medium"]).optional(),
        trueLabel: z.string().optional(),
        falseLabel: z.string().optional(),
        prefix: z.string().optional(),
        suffix: z.string().optional(),
      })
      .strict()
      .optional(),

    badge: z
      .object({
        tones: z
          .record(z.string(), Tone)
          .optional()
          .describe('Value → tone, e.g. { "paid": "success", "overdue": "danger" }.'),
        labels: z.record(z.string(), z.string()).optional().describe("Value → display label."),
        defaultTone: Tone.optional(),
        fill: z
          .boolean()
          .optional()
          .describe("Tinted background. Default true. false + stroke = outline badge."),
        stroke: z
          .boolean()
          .optional()
          .describe(
            "1px border in the tone's colour. Default false. Combine with fill for a tinted, bordered badge.",
          ),
        indicator: z
          .enum(["dot", "icon", "icon-only", "none"])
          .optional()
          .describe(
            'Leading mark. dot (default; "icon" when `icons` is set), icon = icon + label, icon-only = icon with the label as tooltip and screen-reader text, none = label only.',
          ),
        icons: z
          .record(z.string(), z.enum(BADGE_ICONS))
          .optional()
          .describe(
            'Value → Lucide icon name, e.g. { "settled": "circle-check", "processing": "loader" }. Values without one use their tone\'s default icon.',
          ),
      })
      .strict()
      .optional()
      .describe("Only for type=badge."),

    avatar: z
      .object({
        imageField: z.string().optional().describe("Row field holding the image URL."),
        imageDarkField: z
          .string()
          .optional()
          .describe(
            "Row field holding a dark-theme variant of the image (e.g. a light logo for dark backgrounds). Shown instead of imageField when the table is dark.",
          ),
        subtitleField: z.string().optional().describe("Row field shown under the name."),
        logo: z
          .enum(["inline", "circle"])
          .optional()
          .describe(
            "Render the image as a brand logo (bank, merchant, provider) instead of a person: inline = 16px compact mark centred on the name's first line, no container; circle = mark centred in a filled circle.",
          ),
        logoFill: z
          .enum(["neutral", "accent"])
          .optional()
          .describe("Fill behind logo=circle. Default neutral."),
      })
      .strict()
      .optional()
      .describe("Only for type=avatar. `field` is the display name."),

    link: z
      .object({
        hrefField: z.string().optional().describe("Row field holding the URL."),
        hrefTemplate: z
          .string()
          .optional()
          .describe("URL with {field} placeholders, e.g. `/orders/{id}`."),
        external: z.boolean().optional().describe("Open in a new tab with rel=noopener."),
      })
      .strict()
      .optional()
      .describe("Only for type=link."),

    actions: z.array(Action).optional().describe("Only for type=actions. Row menu items."),
    actionsDisplay: z
      .enum(ACTIONS_DISPLAYS)
      .optional()
      .describe(
        "Only for type=actions. menu (default) = ⋯ menu; inline = icon buttons (every action needs an icon). For one clear call to action per row, use a type=button column instead.",
      ),

    button: z
      .object({
        id: z.string().describe("Action id passed to onAction(id, row)."),
        label: z.string().optional().describe("Button text. Defaults to the cell value."),
        variant: z
          .enum(["secondary", "primary", "ghost"])
          .optional()
          .describe("secondary (default, outlined) · primary (accent fill) · ghost (text only)."),
        tone: z.enum(["neutral", "danger"]).optional(),
        icon: z.enum(ACTION_ICONS).optional().describe("Leading Lucide icon."),
        when: z
          .object({ field: z.string(), in: z.array(z.string()).min(1) })
          .strict()
          .optional()
          .describe(
            "Only render the button on rows where row[field] is one of `in`; other rows show nothing.",
          ),
      })
      .strict()
      .optional()
      .describe(
        "Only for type=button: a single button inside the cell (e.g. Pay, Download, Retry).",
      ),
  })
  .strict();

export const TableSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.literal(1).default(1),
    title: z.string().optional().describe("Shown in the toolbar and used as the accessible name."),
    description: z.string().optional(),
    rowId: z.string().optional().describe("Row field used as a stable id. Default `id`."),
    columns: z.array(ColumnSchema).min(1),

    features: z
      .object({
        search: z.boolean().default(true).describe("Global search box."),
        columnFilters: z.boolean().default(true),
        sorting: z.boolean().default(true),
        multiSort: z.boolean().default(true),
        pagination: z.boolean().default(true),
        pageSize: z.number().int().positive().default(10),
        pageSizeOptions: z.array(z.number().int().positive()).default([10, 25, 50, 100]),
        selection: z.enum(["none", "single", "multi"]).default("none"),
        columnVisibility: z.boolean().default(true),
        columnResize: z.boolean().default(true),
        columnReorder: z
          .boolean()
          .default(true)
          .describe("Users can reorder columns from the column menu (drag or Alt+Arrow keys)."),
        columnPinning: z
          .boolean()
          .default(true)
          .describe(
            "Users can pin columns to the start edge from the column menu. `column.pinned` sets the initial state.",
          ),
        stickyHeader: z.boolean().default(true),
      })
      .strict()
      .prefault({}),

    appearance: z
      .object({
        density: z.enum(["compact", "default", "comfortable"]).default("default"),
        variant: z.enum(["plain", "zebra", "bordered"]).default("plain"),
        responsive: z
          .enum(["stack", "scroll", "priority"])
          .default("stack")
          .describe(
            "Narrow-screen behavior. stack = cards, scroll = horizontal scroll, priority = drop low-priority columns.",
          ),
        stackBelow: z
          .number()
          .int()
          .positive()
          .default(640)
          .describe("Container width (px) below which `stack` switches to cards."),
      })
      .strict()
      .prefault({}),

    initialState: z
      .object({
        sort: z
          .array(z.object({ id: z.string(), desc: z.boolean().default(false) }).strict())
          .optional(),
        search: z.string().optional(),
      })
      .strict()
      .optional(),

    bulkActions: z
      .array(Action)
      .optional()
      .describe("Shown in the selection bar when rows are selected. Requires selection=multi."),

    emptyState: z
      .object({ title: z.string(), description: z.string().optional() })
      .strict()
      .optional(),
  })
  .strict();

export type ColumnSchemaInput = z.input<typeof ColumnSchema>;
export type ColumnSchemaType = z.output<typeof ColumnSchema>;
export type TableSchemaInput = z.input<typeof TableSchema>;
export type TableSchemaType = z.output<typeof TableSchema>;
export type ColumnType = (typeof COLUMN_TYPES)[number];
export type Tone = (typeof TONES)[number];
export type BadgeIndicator = "dot" | "icon" | "icon-only" | "none";

export type ParseResult =
  | { success: true; data: TableSchemaType }
  | { success: false; errors: string[] };

/**
 * Validate a schema and return human/agent-readable errors like
 * `columns.2.type: Invalid option: expected one of "text"|"number"…`.
 */
export function parseTableSchema(input: unknown): ParseResult {
  const result = TableSchema.safeParse(input);
  if (result.success) {
    const errors = semanticErrors(result.data);
    return errors.length ? { success: false, errors } : { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
}

function semanticErrors(schema: TableSchemaType): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  schema.columns.forEach((c, i) => {
    const id = c.id ?? c.field;
    if (ids.has(id)) errors.push(`columns.${i}.id: duplicate column id "${id}"`);
    ids.add(id);
    if (c.badge && c.type !== "badge")
      errors.push(`columns.${i}.badge: only valid when type=badge`);
    if (c.link && c.type !== "link") errors.push(`columns.${i}.link: only valid when type=link`);
    if (c.avatar && c.type !== "avatar")
      errors.push(`columns.${i}.avatar: only valid when type=avatar`);
    if (c.actions && c.type !== "actions")
      errors.push(`columns.${i}.actions: only valid when type=actions`);
    if (c.button && c.type !== "button")
      errors.push(`columns.${i}.button: only valid when type=button`);
    if (c.type === "button" && !c.button)
      errors.push(`columns.${i}.button: required when type=button (at least { "id": "…" })`);
    if (c.actionsDisplay && c.type !== "actions")
      errors.push(`columns.${i}.actionsDisplay: only valid when type=actions`);
    if (c.actionsDisplay === "inline")
      c.actions?.forEach((a, j) => {
        if (!a.icon)
          errors.push(`columns.${i}.actions.${j}.icon: required when actionsDisplay is "inline"`);
      });
  });
  if (schema.bulkActions?.length && schema.features.selection !== "multi") {
    errors.push('bulkActions: requires features.selection = "multi"');
  }
  return errors;
}

/** JSON Schema (draft 2020-12) for editors, validators and LLM structured output. */
export function toJSONSchema(): Record<string, unknown> {
  return z.toJSONSchema(TableSchema, { io: "input", target: "draft-2020-12" }) as Record<
    string,
    unknown
  >;
}
