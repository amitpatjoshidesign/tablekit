// Shared viewing options for the component gallery. Every specimen island on a page imports
// this module, so they all read the same state and re-render together.
import { useSyncExternalStore } from "react";
import type { PresetId } from "./hostThemes";

export interface SpecView {
  preset: PresetId;
  density: "compact" | "default" | "comfortable";
}

let view: SpecView = { preset: "site", density: "default" };
const listeners = new Set<() => void>();

export function setView(patch: Partial<SpecView>) {
  view = { ...view, ...patch };
  for (const l of listeners) l();
}

export function useView(): SpecView {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => view,
    () => view,
  );
}
