import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  /** Renders the trigger. Spread `props` onto a <button>. */
  trigger: (props: {
    ref: (el: HTMLButtonElement | null) => void;
    "aria-expanded": boolean;
    "aria-controls": string | undefined;
    "aria-haspopup": "dialog" | "menu";
    onClick: () => void;
  }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  role?: "dialog" | "menu";
  label: string;
  align?: "start" | "end";
  className?: string;
}

/**
 * Minimal, dependency-free popover: click-outside + Escape to close, focus moves in on open
 * and returns to the trigger on close. `role="menu"` adds arrow-key roving between items.
 *
 * The panel is portaled into the nearest `.tk-root` (not <body>) so it keeps inheriting the
 * table's tokens, theme and preset scope, and is promoted to the browser's top layer with the
 * Popover API, so no ancestor's `overflow: hidden`, transform or containment can clip it.
 * (Without the Popover API it falls back to absolute positioning inside the root.)
 */
export function Popover({
  trigger,
  children,
  role = "dialog",
  label,
  align = "start",
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<CSSProperties>({ visibility: "hidden" });

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // `host` is a dependency because the panel only mounts once the host is known.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const trig = triggerRef.current;
    const first = panel?.querySelector<HTMLElement>(
      role === "menu"
        ? '[role="menuitem"]:not([disabled])'
        : 'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    // Wait one frame so the panel is positioned and visible before focusing.
    const raf = requestAnimationFrame(() => first?.focus({ preventScroll: true }));

    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel?.contains(t) && !trig?.contains(t)) close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, role, close, host]);

  // Place next to the trigger, flipping to stay inside the viewport. In the top layer the
  // panel is fixed to the viewport; in the fallback it's absolute inside the host.
  const place = useCallback(() => {
    const panel = panelRef.current;
    const trig = triggerRef.current;
    if (!panel || !trig || !host) return;
    // Promote to the top layer first (Popover API), so the measurements below are final.
    const p = panel as HTMLElement & { showPopover?: () => void };
    let topLayer = false;
    if (p.hasAttribute("popover")) {
      try {
        p.showPopover?.(); // throws if it's already open, which is fine
      } catch {}
      try {
        topLayer = p.matches(":popover-open");
      } catch {}
      // No working Popover API (older browsers, jsdom): drop the attribute so the UA's
      // [popover] { display: none } can't hide the panel, and use the absolute fallback.
      if (!topLayer) p.removeAttribute("popover");
    } else {
      topLayer = false;
    }
    const t = trig.getBoundingClientRect();
    const w = panel.offsetWidth;
    const ph = panel.offsetHeight;
    const vw = document.documentElement.clientWidth;
    let side = align;
    if (side === "start" && t.left + w > vw - 8) side = "end";
    else if (side === "end" && t.right - w < 8) side = "start";
    const below = t.bottom + 6 + ph <= window.innerHeight - 8 || t.top - 6 - ph < 8;
    // Viewport coordinates, clamped so the panel never leaves the screen.
    const left = Math.min(Math.max(side === "start" ? t.left : t.right - w, 8), vw - w - 8);
    const top = below ? t.bottom + 6 : t.top - 6 - ph;
    if (topLayer) {
      setPos({ position: "fixed", top, left });
    } else {
      const h = host.getBoundingClientRect();
      setPos({ top: top - h.top, left: left - h.left });
    }
  }, [align, host]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (role === "dialog" && e.key === "Tab") {
      // Close when tabbing out so it never traps focus.
      requestAnimationFrame(() => {
        if (!panelRef.current?.contains(document.activeElement)) setOpen(false);
      });
    }
    if (role !== "menu") return;
    const items = [
      ...(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ??
        []),
    ];
    const i = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % items.length;
    else if (e.key === "ArrowUp") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "Tab") close(false);
    if (next >= 0) {
      e.preventDefault();
      items[next]?.focus();
    }
  };

  return (
    <div className="tk-popover-anchor">
      {trigger({
        ref: (el) => {
          triggerRef.current = el;
        },
        "aria-expanded": open,
        "aria-controls": open ? id : undefined,
        "aria-haspopup": role,
        onClick: () => {
          setHost((triggerRef.current?.closest(".tk-root") as HTMLElement | null) ?? document.body);
          setPos({ visibility: "hidden" });
          setOpen((o) => !o);
        },
      })}
      {open &&
        host &&
        createPortal(
          // biome-ignore lint/a11y/noStaticElementInteractions: role is dialog or menu (dynamic)
          // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is dialog or menu (dynamic)
          <div
            ref={panelRef}
            id={id}
            role={role}
            aria-label={label}
            aria-modal={role === "dialog" ? false : undefined}
            // "manual": we handle outside-click and Escape ourselves (see above).
            popover="manual"
            className={`tk-popover${className ? ` ${className}` : ""}`}
            style={pos}
            onKeyDown={onKeyDown}
          >
            {typeof children === "function" ? children(() => close()) : children}
          </div>,
          host,
        )}
    </div>
  );
}
