import { type RefObject, useEffect, useLayoutEffect, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Width of an element, tracked with ResizeObserver. `undefined` until measured (SSR-safe). */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number | undefined {
  const [width, setWidth] = useState<number | undefined>(undefined);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 0 means "not laid out" (display:none, jsdom) — treat as unmeasured.
    const initial = el.getBoundingClientRect().width;
    if (initial > 0) setWidth(initial);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** Debounce a changing value. */
export function useDebounced<V>(value: V, ms: number): V {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
