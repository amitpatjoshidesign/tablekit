import "@tablekit/react/styles.css";
import { parseTableSchema } from "@tablekit/core/schema";
import { DataTable, type RowData, type TableSchemaInput } from "@tablekit/react";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";
import { type Recipe, recipes } from "../data/recipes";
import { datasets, PresetStyles } from "./DocsTable";
import { PRESETS, type PresetId } from "./hostThemes";

// ---- Options ------------------------------------------------------------------------------

type Appearance = NonNullable<TableSchemaInput["appearance"]>;
type Density = NonNullable<Appearance["density"]>;
type Variant = NonNullable<Appearance["variant"]>;
type Responsive = NonNullable<Appearance["responsive"]>;
type DataState = "data" | "loading" | "empty" | "error";

const WIDTHS = [
  { id: "full", label: "Full", px: undefined },
  { id: "laptop", label: "1024", px: 1024 },
  { id: "tablet", label: "768", px: 768 },
  { id: "phone", label: "375", px: 375 },
] as const;
type WidthId = (typeof WIDTHS)[number]["id"];

const ACCENTS = [
  { id: "preset", label: "Preset", color: undefined },
  { id: "blue", label: "Blue", color: "#3451d1" },
  { id: "moss", label: "Moss", color: "#717326" },
  { id: "coral", label: "Coral", color: "#b9455c" },
  { id: "violet", label: "Violet", color: "#6d4bd8" },
  { id: "teal", label: "Teal", color: "#0f766e" },
  { id: "ink", label: "Ink", color: "#272623" },
] as const;
type AccentId = (typeof ACCENTS)[number]["id"];

const RADII = [
  { id: "preset", label: "Preset", px: undefined },
  { id: "0", label: "0", px: 0 },
  { id: "4", label: "4", px: 4 },
  { id: "8", label: "8", px: 8 },
  { id: "14", label: "14", px: 14 },
] as const;
type RadiusId = (typeof RADII)[number]["id"];

const pretty = (s: unknown) => JSON.stringify(s, null, 2);
const recipeById = (id: string) => recipes.find((r) => r.id === id) ?? (recipes[0] as Recipe);

// ---- Small UI pieces ------------------------------------------------------------------------

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="pg-group docs-fieldset">
      <legend className="pg-group-label type-label text-faint">{label}</legend>
      <div className="docs-presets">{children}</div>
    </fieldset>
  );
}

function Chip({
  pressed,
  onClick,
  children,
  title,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="docs-chip"
      aria-pressed={pressed}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

const readTheme = (): "light" | "dark" =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

/** Follows the site's light/dark class so the toggle stays in sync with the sidebar. */
function useSiteTheme(): ["light" | "dark", (t: "light" | "dark") => void] {
  const [theme, setThemeState] = useState<"light" | "dark">(readTheme);
  useEffect(() => {
    const mo = new MutationObserver(() => setThemeState(readTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  const setTheme = (t: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
  };
  return [theme, setTheme];
}

function readHash(): { recipe: string; text: string } | null {
  try {
    const h = new URLSearchParams(location.hash.slice(1));
    const s = h.get("s");
    if (!s) return null;
    return {
      recipe: h.get("r") ?? recipes[0]?.id ?? "",
      text: decodeURIComponent(escape(atob(s))),
    };
  } catch {
    return null;
  }
}

// ---- Playground -------------------------------------------------------------------------------

export default function Playground() {
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? "invoices");
  const recipe = recipeById(recipeId);
  const [text, setText] = useState(() => pretty(recipe.schema));
  const [preset, setPreset] = useState<PresetId>("site");
  const [accent, setAccent] = useState<AccentId>("preset");
  const [radius, setRadius] = useState<RadiusId>("preset");
  const [width, setWidth] = useState<WidthId>("full");
  const [dataState, setDataState] = useState<DataState>("data");
  const [theme, setTheme] = useSiteTheme();
  const [copied, setCopied] = useState("");
  const [showEditor, setShowEditor] = useState(true);

  useEffect(() => {
    const fromHash = readHash();
    if (fromHash) {
      setRecipeId(fromHash.recipe);
      setText(fromHash.text);
    }
  }, []);

  const result = useMemo(() => {
    try {
      const json = JSON.parse(text);
      const parsed = parseTableSchema(json);
      return parsed.success
        ? { ok: true as const, schema: json as TableSchemaInput }
        : { ok: false as const, errors: parsed.errors };
    } catch (e) {
      return { ok: false as const, errors: [`JSON: ${(e as Error).message}`] };
    }
  }, [text]);

  const [lastGood, setLastGood] = useState<TableSchemaInput>(recipe.schema);
  useEffect(() => {
    if (result.ok) setLastGood(result.schema);
  }, [result]);

  const rows = useMemo(
    () => (recipe.dataset ? datasets[recipe.dataset]() : datasets.orders()) as RowData[],
    [recipe.dataset],
  );

  // Appearance controls write into the schema, so the JSON stays the single source of truth.
  const appearance = (lastGood.appearance ?? {}) as Appearance;
  const setAppearance = (patch: Partial<Appearance>) => {
    const base = result.ok ? result.schema : lastGood;
    setText(pretty({ ...base, appearance: { ...(base.appearance ?? {}), ...patch } }));
  };

  const loadRecipe = (id: string) => {
    setRecipeId(id);
    setText(pretty(recipeById(id).schema));
    setDataState("data");
  };

  // Theme overrides, applied inside the preset scope so they win over it.
  const accentColor = ACCENTS.find((a) => a.id === accent)?.color;
  const radiusPx = RADII.find((r) => r.id === radius)?.px;
  const overrides: Record<string, string> = {};
  if (accentColor) {
    overrides["--tk-color-accent"] = accentColor;
    overrides["--tk-color-accent-hover"] = `color-mix(in oklab, ${accentColor} 85%, black)`;
    overrides["--tk-color-accent-contrast"] = "#ffffff";
    overrides["--tk-color-focus"] = accentColor;
    overrides["--tk-color-row-selected"] =
      `color-mix(in oklab, ${accentColor} 10%, var(--tk-color-surface))`;
    overrides["--tk-tone-accent-bg"] =
      `color-mix(in oklab, ${accentColor} 14%, var(--tk-color-surface))`;
    overrides["--tk-tone-accent-fg"] = accentColor;
  }
  if (radiusPx !== undefined) {
    overrides["--tk-radius-sm"] = `${Math.max(0, radiusPx - 4)}px`;
    overrides["--tk-radius-md"] = `${radiusPx}px`;
    overrides["--tk-radius-lg"] = `${radiusPx + (radiusPx ? 4 : 0)}px`;
  }
  const themeCss = Object.keys(overrides).length
    ? `:root {\n${Object.entries(overrides)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join("\n")}\n}`
    : "";

  const copy = async (what: "schema" | "prompt" | "link" | "css") => {
    let value = text;
    if (what === "prompt")
      value = `Render this table with <DataTable schema={schema} data={rows} /> from @tablekit/react. Import "@tablekit/react/styles.css" and "@fontsource-variable/inter" once. Keep the schema as-is and wire onAction/onBulkAction.\n\nconst schema = ${text};`;
    if (what === "css") {
      const presetFile = preset === "default" ? null : preset === "site" ? "shadcn" : preset;
      value = [
        presetFile && `@import "@tablekit/tokens/presets/${presetFile}.css";`,
        themeCss || "/* No token overrides: the preset's own values. */",
      ]
        .filter(Boolean)
        .join("\n\n");
    }
    if (what === "link") {
      const s = btoa(unescape(encodeURIComponent(text)));
      value = `${location.origin}${location.pathname}#r=${recipeId}&s=${s}`;
      history.replaceState(null, "", `#r=${recipeId}&s=${s}`);
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  };

  const px = WIDTHS.find((w) => w.id === width)?.px;
  const tableData = dataState === "data" ? rows : [];

  return (
    <div className="pg not-prose">
      <PresetStyles />

      {/* ---- Theming & appearance -------------------------------------------------------- */}
      <section className="pg-panel pg-controls" aria-label="Data and appearance">
        <div className="pg-group">
          <label className="pg-group-label type-label text-faint" htmlFor="pg-data">
            Sample data
          </label>
          <select
            id="pg-data"
            className="pg-select"
            value={recipeId}
            onChange={(e) => loadRecipe(e.target.value)}
          >
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
        <Group label="Design system">
          {PRESETS.map((p) => (
            <Chip key={p.id} pressed={preset === p.id} onClick={() => setPreset(p.id)}>
              {p.label}
            </Chip>
          ))}
        </Group>
        <Group label="Mode">
          <Chip pressed={theme === "light"} onClick={() => setTheme("light")}>
            Light
          </Chip>
          <Chip pressed={theme === "dark"} onClick={() => setTheme("dark")}>
            Dark
          </Chip>
        </Group>
        <Group label="Accent">
          {ACCENTS.map((a) => (
            <Chip
              key={a.id}
              pressed={accent === a.id}
              onClick={() => setAccent(a.id)}
              title={a.label}
            >
              {a.color ? (
                <>
                  <span className="pg-swatch" style={{ background: a.color }} aria-hidden="true" />
                  <span className="sr-only">{a.label}</span>
                </>
              ) : (
                a.label
              )}
            </Chip>
          ))}
        </Group>
        <Group label="Corner radius">
          {RADII.map((r) => (
            <Chip key={r.id} pressed={radius === r.id} onClick={() => setRadius(r.id)}>
              {r.label}
            </Chip>
          ))}
        </Group>
        <Group label="Density">
          {(["compact", "default", "comfortable"] as Density[]).map((d) => (
            <Chip
              key={d}
              pressed={(appearance.density ?? "default") === d}
              onClick={() => setAppearance({ density: d })}
            >
              {d[0]?.toUpperCase() + d.slice(1)}
            </Chip>
          ))}
        </Group>
        <Group label="Rows">
          {(["plain", "zebra", "bordered"] as Variant[]).map((v) => (
            <Chip
              key={v}
              pressed={(appearance.variant ?? "plain") === v}
              onClick={() => setAppearance({ variant: v })}
            >
              {v[0]?.toUpperCase() + v.slice(1)}
            </Chip>
          ))}
        </Group>
        <Group label="Narrow screens">
          {(["stack", "priority", "scroll"] as Responsive[]).map((m) => (
            <Chip
              key={m}
              pressed={(appearance.responsive ?? "stack") === m}
              onClick={() => setAppearance({ responsive: m })}
            >
              {m === "stack" ? "Cards" : m === "priority" ? "Drop columns" : "Scroll"}
            </Chip>
          ))}
        </Group>
        <Group label="State">
          {(["data", "loading", "empty", "error"] as DataState[]).map((s) => (
            <Chip key={s} pressed={dataState === s} onClick={() => setDataState(s)}>
              {s[0]?.toUpperCase() + s.slice(1)}
            </Chip>
          ))}
        </Group>
        <Group label="Preview width">
          {WIDTHS.map((w) => (
            <Chip key={w.id} pressed={width === w.id} onClick={() => setWidth(w.id)}>
              {w.label}
            </Chip>
          ))}
        </Group>
      </section>

      {/* ---- Preview: the table at full capacity ----------------------------------------------- */}
      <section className="pg-stage" aria-label="Preview" data-width={width}>
        <div className="pg-stage-meta type-meta text-muted">
          <span>
            {recipe.title} · {rows.length} rows
          </span>
          <span>{px ? `${px}px container` : "Full width"}</span>
        </div>
        <div className="pg-frame" style={{ maxWidth: px ?? "100%" }}>
          <div data-preset={preset === "default" ? undefined : preset}>
            <div className="pg-surface" style={overrides as CSSProperties}>
              <DataTable
                key={`${recipeId}-${dataState}`}
                schema={lastGood}
                data={tableData}
                loading={dataState === "loading"}
                error={
                  dataState === "error"
                    ? "The server responded with 503. Try again in a moment."
                    : undefined
                }
                onRetry={() => setDataState("data")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Schema editor ------------------------------------------------------------------ */}
      <section className="pg-editor" aria-label="Schema editor">
        <div className="pg-editor-head">
          <button
            type="button"
            className="pg-editor-toggle"
            aria-expanded={showEditor}
            aria-controls="pg-schema"
            onClick={() => setShowEditor((v) => !v)}
          >
            <span className="pg-group-label type-label text-faint">Schema</span>
            <span className="type-meta">{showEditor ? "Hide" : "Show"} JSON</span>
          </button>
          <p id="pg-status" className="pg-status" data-ok={result.ok} aria-live="polite">
            {result.ok
              ? "✓ Valid TableSchema"
              : `✕ ${result.errors.length} problem(s) — the preview shows the last valid schema`}
          </p>
          <div className="docs-presets">
            <Chip pressed={false} onClick={() => copy("schema")}>
              {copied === "schema" ? "Copied" : "Copy schema"}
            </Chip>
            <Chip pressed={false} onClick={() => copy("prompt")}>
              {copied === "prompt" ? "Copied" : "Copy as agent prompt"}
            </Chip>
            <Chip pressed={false} onClick={() => copy("css")}>
              {copied === "css" ? "Copied" : "Copy theme CSS"}
            </Chip>
            <Chip pressed={false} onClick={() => copy("link")}>
              {copied === "link" ? "Link copied" : "Share link"}
            </Chip>
            <Chip pressed={false} onClick={() => loadRecipe(recipeId)}>
              Reset
            </Chip>
          </div>
        </div>
        {!result.ok && (
          <ul className="pg-errors">
            {result.errors.slice(0, 6).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {showEditor && (
          <textarea
            id="pg-schema"
            aria-label="Table schema (JSON)"
            aria-describedby="pg-status"
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                const t = e.currentTarget;
                const { selectionStart: a, selectionEnd: b } = t;
                setText(`${text.slice(0, a)}  ${text.slice(b)}`);
                requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2));
              }
            }}
          />
        )}
      </section>
    </div>
  );
}
