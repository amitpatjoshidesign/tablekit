/**
 * Locale-aware formatters used by schema columns. Pure functions — safe on server and client.
 */

export interface NumberFormatOptions {
  locale?: string;
  decimals?: number;
  notation?: "standard" | "compact";
  style?: "decimal" | "percent";
  unit?: string;
}

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  decimals?: number;
  notation?: "standard" | "compact";
}

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: "short" | "medium" | "long" | "relative";
  timeStyle?: "short" | "medium";
}

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>();

function memo<F extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
  key: string,
  make: () => F,
): F {
  let f = cache.get(key) as F | undefined;
  if (!f) {
    f = make();
    cache.set(key, f);
  }
  return f;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}

export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatNumber(value: unknown, o: NumberFormatOptions = {}): string {
  const n = toNumber(value);
  if (n === null) return "";
  const fmt = memo(`n|${o.locale}|${o.decimals}|${o.notation}|${o.style}|${o.unit}`, () =>
    o.unit
      ? new Intl.NumberFormat(o.locale, {
          style: "unit",
          unit: o.unit,
          notation: o.notation,
          maximumFractionDigits: o.decimals,
          minimumFractionDigits: o.decimals,
        })
      : new Intl.NumberFormat(o.locale, {
          style: o.style ?? "decimal",
          notation: o.notation,
          maximumFractionDigits: o.decimals,
          minimumFractionDigits: o.decimals,
        }),
  );
  return (fmt as Intl.NumberFormat).format(n);
}

export function formatCurrency(value: unknown, o: CurrencyFormatOptions = {}): string {
  const n = toNumber(value);
  if (n === null) return "";
  const fmt = memo(
    `c|${o.locale}|${o.currency}|${o.decimals}|${o.notation}`,
    () =>
      new Intl.NumberFormat(o.locale, {
        style: "currency",
        currency: o.currency ?? "USD",
        notation: o.notation,
        maximumFractionDigits: o.decimals,
        minimumFractionDigits: o.decimals,
      }),
  );
  return (fmt as Intl.NumberFormat).format(n);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

export function formatRelative(date: Date, locale?: string, now: Date = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const fmt = memo(`r|${locale}`, () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }));
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size || unit === "second") {
      return (fmt as Intl.RelativeTimeFormat).format(Math.round(seconds / size), unit);
    }
  }
  return "";
}

export function formatDate(value: unknown, o: DateFormatOptions = {}): string {
  const d = toDate(value);
  if (!d) return "";
  const { dateStyle } = o;
  if (dateStyle === "relative") return formatRelative(d, o.locale);
  const fmt = memo(
    `d|${o.locale}|${dateStyle}|${o.timeStyle}`,
    () =>
      new Intl.DateTimeFormat(o.locale, {
        dateStyle: dateStyle ?? "medium",
        timeStyle: o.timeStyle,
      }),
  );
  return (fmt as Intl.DateTimeFormat).format(d);
}

/** Title-case a machine value for display: "in_progress" → "In progress". */
export function humanize(value: unknown): string {
  const s = String(value ?? "")
    .replace(/[_-]+/g, " ")
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
