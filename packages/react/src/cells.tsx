import {
  type ActionIconName,
  type ActionsDisplay,
  type BadgeIconName,
  type BadgeIndicator,
  type ColumnSchemaType,
  fillTemplate,
  formatCurrency,
  formatDate,
  formatNumber,
  getByPath,
  humanize,
  type RowData,
  TONE_ICONS,
  type Tone,
  toDate,
} from "@tablekit/core";
import { Fragment, type ReactNode, useState } from "react";
import { useTableContext } from "./context";
import { ActionIcon, BadgeIcon, CheckIcon, ExternalIcon, MinusIcon, MoreIcon } from "./icons";
import { Popover } from "./popover";

export interface BadgeProps {
  tone?: Tone;
  /** dot (default) · icon · icon-only (label becomes tooltip + screen-reader text) · none */
  indicator?: BadgeIndicator;
  /** Lucide icon name for icon indicators. Defaults to the tone's icon (TONE_ICONS). */
  icon?: BadgeIconName;
  /** Tinted background. Default `true`. */
  fill?: boolean;
  /** 1px border in the tone's colour. Default `false`. `fill={false} stroke` = outline badge. */
  stroke?: boolean;
  children: ReactNode;
}

export function Badge({
  tone = "neutral",
  indicator = "dot",
  icon,
  fill = true,
  stroke = false,
  children,
}: BadgeProps) {
  const iconName = icon ?? TONE_ICONS[tone];
  const iconOnly = indicator === "icon-only";
  return (
    <span
      className="tk-badge"
      data-tone={tone}
      data-indicator={indicator === "dot" ? undefined : indicator}
      data-fill={fill ? undefined : "false"}
      data-stroke={stroke ? "" : undefined}
      title={iconOnly && typeof children === "string" ? children : undefined}
    >
      {indicator === "dot" && <span className="tk-badge-dot" aria-hidden="true" />}
      {(indicator === "icon" || iconOnly) && <BadgeIcon name={iconName} />}
      {iconOnly ? <span className="tk-sr-only">{children}</span> : children}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

function AvatarImage({ name, src, srcDark }: { name: string; src?: string; srcDark?: string }) {
  const [failed, setFailed] = useState(false);
  // Initials whenever there's no image or it fails to load (offline, 404, blocked CDN).
  if (!src || failed) return <>{initials(name)}</>;
  const img = (url: string, scheme?: "light" | "dark") => (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      data-scheme={scheme}
      onError={() => setFailed(true)}
    />
  );
  if (!srcDark) return img(src);
  // Both load; CSS shows the one matching the table's colour scheme (--tk-scheme-*-display).
  return (
    <>
      {img(src, "light")}
      {img(srcDark, "dark")}
    </>
  );
}

const RING_COUNT = 8;

function hashName(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Same name → same ring colour (1–8), on every render and every page. */
function ringFor(name: string): number {
  return (hashName(name) % RING_COUNT) + 1;
}

/**
 * Initials avatars take one of the theme's tones, picked by name, so a list of people
 * isn't a wall of one colour and follows whichever preset is loaded. `danger` is left
 * out so a person never reads as an error.
 */
const AVATAR_FALLBACK_TONES = ["accent", "info", "success", "warning", "neutral"] as const;

function fallbackToneFor(name: string): (typeof AVATAR_FALLBACK_TONES)[number] {
  // FNV-1a with a final mix: spreads similar names evenly across the few tones
  // (the ring hash above clusters when there are only five buckets).
  let h = 0x811c9dc5;
  for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return AVATAR_FALLBACK_TONES[(h >>> 0) % AVATAR_FALLBACK_TONES.length] ?? "accent";
}

export function Avatar({
  name,
  src,
  srcDark,
  subtitle,
  logo,
  logoFill = "neutral",
}: {
  name: string;
  src?: string;
  /** Dark-theme variant of `src`, e.g. a light logo for dark backgrounds. */
  srcDark?: string;
  subtitle?: string;
  /**
   * Treat the image as a brand logo instead of a person:
   * `inline` — compact mark exactly one line of the name tall, no container;
   * `circle` — mark centred in a filled circle (`logoFill`).
   */
  logo?: "inline" | "circle";
  logoFill?: "neutral" | "accent";
}) {
  return (
    <span className="tk-avatar" data-logo={logo}>
      <span
        className="tk-avatar-img"
        aria-hidden="true"
        data-logo={logo}
        data-logo-fill={logo === "circle" ? logoFill : undefined}
        data-has-image={src ? "" : undefined}
        data-ring={src && !logo ? ringFor(name) : undefined}
        data-tone={logo ? undefined : fallbackToneFor(name)}
      >
        <AvatarImage key={`${src}|${srcDark}`} name={name} src={src} srcDark={srcDark} />
      </span>
      <span className="tk-avatar-text">
        <span className="tk-avatar-name">{name}</span>
        {subtitle && <span className="tk-avatar-subtitle">{subtitle}</span>}
      </span>
    </span>
  );
}

export interface ActionItem {
  id: string;
  label: string;
  tone?: "neutral" | "danger";
  icon?: ActionIconName;
  disabled?: boolean;
  /** Divider before this item (menus only). */
  separator?: boolean;
}

/** The ⋯ menu. Items can carry an icon, be disabled, or start a new group. */
export function RowActions({
  actions,
  label,
  onAction,
}: {
  actions: ActionItem[];
  label: string;
  onAction: (id: string) => void;
}) {
  const withIcons = actions.some((a) => a.icon);
  return (
    <Popover
      role="menu"
      label={label}
      align="end"
      className="tk-menu"
      trigger={(p) => (
        <button type="button" className="tk-icon-button" aria-label={label} {...p}>
          <MoreIcon />
        </button>
      )}
    >
      {(close) =>
        actions.map((a, i) => (
          <Fragment key={a.id}>
            {a.separator && i > 0 && <hr className="tk-menu-separator" />}
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="tk-menu-item"
              data-tone={a.tone}
              disabled={a.disabled}
              aria-disabled={a.disabled || undefined}
              onClick={() => {
                close();
                onAction(a.id);
              }}
            >
              {a.icon ? (
                <ActionIcon name={a.icon} />
              ) : (
                withIcons && <span className="tk-menu-icon-space" aria-hidden="true" />
              )}
              <span>{a.label}</span>
            </button>
          </Fragment>
        ))
      }
    </Popover>
  );
}

/**
 * Row-action layouts. Multiple actions are never a row of text buttons:
 *  menu   — ⋯ menu (default)
 *  inline — icon buttons; each label is the tooltip and accessible name
 * For a single, clear call to action per row, use a `button` column (ButtonCell).
 */
export function RowActionsGroup({
  actions,
  display = "menu",
  menuLabel,
  onAction,
}: {
  actions: ActionItem[];
  display?: ActionsDisplay;
  menuLabel: string;
  onAction: (id: string) => void;
}) {
  if (actions.length === 0) return null;
  const iconsOk = display === "inline" && actions.every((a) => a.icon);
  if (!iconsOk) return <RowActions actions={actions} label={menuLabel} onAction={onAction} />;
  return (
    <span className="tk-actions" data-display="inline">
      {actions.map((a) => (
        <button
          key={a.id}
          type="button"
          className="tk-icon-button"
          data-tone={a.tone}
          aria-label={a.label}
          title={a.label}
          disabled={a.disabled}
          onClick={() => onAction(a.id)}
        >
          {a.icon && <ActionIcon name={a.icon} />}
        </button>
      ))}
    </span>
  );
}

export interface CellButtonProps {
  label: string;
  variant?: "secondary" | "primary" | "ghost";
  tone?: "neutral" | "danger";
  icon?: ActionIconName;
  disabled?: boolean;
  onClick: () => void;
}

/** A single button inside a cell (type=button columns): Pay, Download, Retry… */
export function CellButton({
  label,
  variant = "secondary",
  tone,
  icon,
  disabled,
  onClick,
}: CellButtonProps) {
  return (
    <button
      type="button"
      className="tk-cell-button"
      data-variant={variant}
      data-tone={tone}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <ActionIcon name={icon} />}
      {label}
    </button>
  );
}

/** Drop actions whose `when` condition doesn't match this row. */
function visibleActions(column: ColumnSchemaType, row: RowData): ActionItem[] {
  return (column.actions ?? []).filter(
    (a) => !a.when || a.when.in.includes(String(getByPath(row, a.when.field) ?? "")),
  );
}

function RowActionsCell({
  column,
  row,
  onAction,
}: {
  column: ColumnSchemaType;
  row: RowData;
  onAction?: (actionId: string, row: RowData) => void;
}) {
  const { labels } = useTableContext();
  const actions = visibleActions(column, row);
  if (actions.length === 0) return null;
  return (
    <RowActionsGroup
      actions={actions}
      display={column.actionsDisplay}
      menuLabel={labels.rowActions}
      onAction={(id) => onAction?.(id, row)}
    />
  );
}

/** Plain-text rendering of a schema cell (search chips, card titles, aria-labels). */
export function schemaCellText(column: ColumnSchemaType, value: unknown, _row?: RowData): string {
  const f = column.format ?? {};
  const wrap = (s: string) => (s ? `${f.prefix ?? ""}${s}${f.suffix ?? ""}` : s);
  switch (column.type) {
    case "number":
      return wrap(formatNumber(value, f));
    case "currency":
      return wrap(formatCurrency(value, f));
    case "date":
      return wrap(formatDate(value, f));
    case "boolean":
      return value ? (f.trueLabel ?? "Yes") : (f.falseLabel ?? "No");
    case "badge": {
      const key = String(value ?? "");
      return column.badge?.labels?.[key] ?? humanize(key);
    }
    case "actions":
      return "";
    case "button":
      return column.button?.label ?? "";
    default:
      return wrap(value === null || value === undefined ? "" : String(value));
  }
}

export function renderSchemaCell(
  column: ColumnSchemaType,
  value: unknown,
  row: RowData,
  onAction?: (actionId: string, row: RowData) => void,
): ReactNode {
  const f = column.format ?? {};
  if (value === null || value === undefined || value === "") {
    if (column.type === "actions")
      return <RowActionsCell column={column} row={row} onAction={onAction} />;
    if (column.type !== "boolean" && column.type !== "button")
      return (
        <span className="tk-empty-value">
          <span aria-hidden="true">—</span>
          <span className="tk-sr-only">No value</span>
        </span>
      );
  }
  switch (column.type) {
    case "badge": {
      const key = String(value);
      const b = column.badge;
      const tone = b?.tones?.[key] ?? b?.defaultTone ?? "neutral";
      const indicator: BadgeIndicator = b?.indicator ?? (b?.icons ? "icon" : "dot");
      return (
        <Badge
          tone={tone}
          indicator={indicator}
          icon={b?.icons?.[key]}
          fill={b?.fill ?? true}
          stroke={b?.stroke ?? false}
        >
          {schemaCellText(column, value, row)}
        </Badge>
      );
    }
    case "avatar":
      return (
        <Avatar
          name={String(value)}
          src={
            column.avatar?.imageField
              ? (getByPath(row, column.avatar.imageField) as string)
              : undefined
          }
          srcDark={
            column.avatar?.imageDarkField
              ? (getByPath(row, column.avatar.imageDarkField) as string | undefined)
              : undefined
          }
          subtitle={
            column.avatar?.subtitleField
              ? (getByPath(row, column.avatar.subtitleField) as string | undefined)
              : undefined
          }
          logo={column.avatar?.logo}
          logoFill={column.avatar?.logoFill}
        />
      );
    case "link": {
      const href = column.link?.hrefTemplate
        ? fillTemplate(column.link.hrefTemplate, row)
        : column.link?.hrefField
          ? String(getByPath(row, column.link.hrefField) ?? "")
          : String(value);
      const external = column.link?.external;
      return (
        <a
          className="tk-link"
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {schemaCellText(column, value, row)}
          {external && <ExternalIcon />}
        </a>
      );
    }
    case "boolean":
      return (
        <span className="tk-boolean" data-value={value ? "true" : "false"}>
          {value ? <CheckIcon /> : <MinusIcon />}
          <span className="tk-sr-only">{schemaCellText(column, value, row)}</span>
        </span>
      );
    case "date": {
      const d = toDate(value);
      return d ? (
        <time dateTime={d.toISOString()} title={d.toLocaleString(f.locale)}>
          {schemaCellText(column, value, row)}
        </time>
      ) : (
        String(value)
      );
    }
    case "number":
    case "currency":
      return <span className="tk-num">{schemaCellText(column, value, row)}</span>;
    case "actions":
      return <RowActionsCell column={column} row={row} onAction={onAction} />;
    case "button": {
      const b = column.button;
      if (!b) return null;
      if (b.when && !b.when.in.includes(String(getByPath(row, b.when.field) ?? ""))) return null;
      return (
        <CellButton
          label={b.label ?? String(value ?? column.header)}
          variant={b.variant}
          tone={b.tone}
          icon={b.icon}
          onClick={() => onAction?.(b.id, row)}
        />
      );
    }
    default:
      return schemaCellText(column, value, row);
  }
}
