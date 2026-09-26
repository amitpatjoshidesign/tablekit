import "@tablekit/react/styles.css";
import { DataTable, type DataTableProps, type RowData } from "@tablekit/react";
import { useMemo, useState } from "react";
import { type DatasetKey, recipes } from "../data/recipes";
import {
  makeApiKeys,
  makeAudit,
  makeDeployments,
  makeFiles,
  makeInventory,
  makeLeads,
  makeMembers,
  makeOrders,
  makeSettlements,
  makeTickets,
  makeTopPages,
} from "../data/samples";
import { PRESETS, type PresetId, presetStyles } from "./hostThemes";

export const datasets: Record<DatasetKey, () => object[]> = {
  orders: () => makeOrders(),
  members: () => makeMembers(),
  deployments: () => makeDeployments(),
  leads: () => makeLeads(),
  tickets: () => makeTickets(),
  inventory: () => makeInventory(),
  files: () => makeFiles(),
  audit: () => makeAudit(),
  apiKeys: () => makeApiKeys(),
  topPages: () => makeTopPages(),
  settlements: () => makeSettlements(),
};

export type { DatasetKey };

/** Injects the scoped preset styles once. */
export function PresetStyles() {
  return <style>{presetStyles}</style>;
}

export function PresetPicker({
  value,
  onChange,
}: {
  value: PresetId;
  onChange: (p: PresetId) => void;
}) {
  return (
    <fieldset className="docs-presets docs-fieldset">
      <legend className="tk-sr-only">Design system preset</legend>
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={value === p.id}
          className="docs-chip"
          onClick={() => onChange(p.id)}
        >
          {p.label}
        </button>
      ))}
    </fieldset>
  );
}

/** A live DataTable for docs pages: `<Demo recipe="invoices" />` or `<Demo schema={…} dataset="orders" />`. */
export default function Demo({
  recipe,
  schema,
  dataset,
  presets = false,
  ...rest
}: Partial<DataTableProps<RowData>> & {
  recipe?: string;
  dataset?: DatasetKey;
  presets?: boolean;
}) {
  const r = recipe ? recipes.find((x) => x.id === recipe) : undefined;
  const key = dataset ?? r?.dataset ?? "orders";
  const data = useMemo(() => datasets[key](), [key]);
  const [preset, setPreset] = useState<PresetId>("site");
  const [log, setLog] = useState<string>("");
  const finalSchema = schema ?? r?.schema;
  if (!finalSchema) return <p>Unknown recipe “{recipe}”.</p>;

  return (
    <div className="demo not-prose">
      <PresetStyles />
      {presets && <PresetPicker value={preset} onChange={setPreset} />}
      <div data-preset={preset === "default" ? undefined : preset} className="docs-preset-frame">
        <DataTable
          schema={finalSchema}
          data={data as RowData[]}
          onAction={(id, row) =>
            setLog(`onAction("${id}", ${JSON.stringify((row as { id?: string }).id)})`)
          }
          onBulkAction={(id, rows) => setLog(`onBulkAction("${id}", [${rows.length} rows])`)}
          {...rest}
        />
      </div>
      {log && (
        <p className="docs-log" aria-live="polite">
          <code>{log}</code>
        </p>
      )}
    </div>
  );
}
