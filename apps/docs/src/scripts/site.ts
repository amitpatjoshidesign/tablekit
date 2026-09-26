import { icons } from "../components/icon";

// Site behavior, ported from amitpatjoshi.com: sidebar dot hop + scroll-spy,
// search, mobile drawer, code copy buttons, reveal-on-scroll, theme toggle.

type Point = { x: number; y: number };
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The dot travels in an arc, bulging by `lift`, with a slight overshoot (components/motion/hop-dot.ts). */
function hopDot(dot: HTMLElement, from: Point, to: Point, lift: Point) {
  if (reduced()) return;
  const at = ({ x, y }: Point) => `translate(${x}px, ${y}px)`;
  const mid = { x: (from.x + to.x) / 2 + lift.x, y: (from.y + to.y) / 2 + lift.y };
  dot.animate(
    [{ transform: at(from) }, { transform: at(mid), offset: 0.45 }, { transform: at(to) }],
    {
      duration: 420,
      easing: "cubic-bezier(0.34, 1.3, 0.64, 1)",
    },
  );
}

// ---- Sidebar: amber dot marks the current page / section -------------------------------
function initSideNav() {
  const nav = document.querySelector<HTMLElement>(".side-nav");
  const dot = nav?.querySelector<HTMLElement>(".side-dot");
  if (!nav || !dot) return;
  const pageLink = nav.querySelector<HTMLAnchorElement>("a[aria-current='page']");
  const sectionLinks = [...nav.querySelectorAll<HTMLAnchorElement>(".side-sections a")];
  const targets = sectionLinks.map((a) =>
    document.getElementById(decodeURIComponent(a.hash.slice(1))),
  );
  let current: HTMLAnchorElement | null = null;
  let lastY: number | null = null;

  const moveTo = (link: HTMLAnchorElement | null) => {
    if (!link || link === current) return;
    current?.removeAttribute("data-active");
    link.setAttribute("data-active", "");
    current = link;
    const navTop = nav.getBoundingClientRect().top;
    const r = link.getBoundingClientRect();
    const lh = Number.parseFloat(getComputedStyle(link).lineHeight) || 20;
    // The list scrolls on its own, so include its scroll offset.
    const y = r.top - navTop + nav.scrollTop + lh / 2 - 2;
    dot.style.transform = `translate(0px, ${y}px)`;
    dot.style.opacity = "1";
    if (lastY !== null && lastY !== y)
      hopDot(dot, { x: 0, y: lastY }, { x: 0, y }, { x: -12, y: 0 });
    lastY = y;
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    let idx = -1;
    targets.forEach((el, i) => {
      if (el && el.getBoundingClientRect().top <= 120) idx = i;
    });
    moveTo(idx >= 0 ? (sectionLinks[idx] ?? null) : pageLink);
  };
  update();
  addEventListener("scroll", () => (frame ||= requestAnimationFrame(update)), { passive: true });
  addEventListener("resize", () => {
    lastY = null;
    const c = current;
    current = null;
    moveTo(c);
  });
}

// ---- Code blocks: copy button, bottom-right (centered for one-liners) ------------------------
const COPY = icons.copy;
const CHECK = icons.check;

function initCopyButtons() {
  for (const pre of document.querySelectorAll<HTMLPreElement>(".prose pre")) {
    if (pre.parentElement?.classList.contains("code-block")) continue;
    const wrap = document.createElement("div");
    wrap.className = "code-block";
    pre.replaceWith(wrap);
    wrap.append(pre);
    const text = () => pre.innerText.replace(/\n$/, "");
    if (text().trim().split("\n").length <= 1) wrap.dataset.single = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-button";
    btn.setAttribute("aria-label", "Copy code");
    btn.innerHTML = COPY;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text());
        btn.dataset.copied = "";
        btn.innerHTML = CHECK;
        btn.setAttribute("aria-label", "Copied");
        setTimeout(() => {
          delete btn.dataset.copied;
          btn.innerHTML = COPY;
          btn.setAttribute("aria-label", "Copy code");
        }, 1500);
      } catch {}
    });
    wrap.append(btn);
  }
}

// ---- Reveal prose blocks on first view, with a short stagger ----------------------------------
function initReveal() {
  if (reduced() || !("IntersectionObserver" in window)) return;
  const blocks = [...document.querySelectorAll<HTMLElement>(".prose > *, [data-reveal]")];
  const io = new IntersectionObserver(
    (entries) => {
      let n = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.style.transitionDelay = `${Math.min(n++ * 60, 240)}ms`;
        el.dataset.visible = "true";
        io.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  for (const el of blocks) {
    // Already on screen at load: show without hiding first (no flash).
    if (el.getBoundingClientRect().top < innerHeight) continue;
    el.dataset.visible = "false";
    io.observe(el);
  }
}

// ---- Mobile drawer: the same sidebar slides in over the page -----------------------------------
function initDrawer() {
  const button = document.querySelector<HTMLButtonElement>(".menu-button");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.querySelector<HTMLElement>(".scrim");
  if (!button || !sidebar || !scrim) return;
  const set = (open: boolean) => {
    document.documentElement.toggleAttribute("data-drawer", open);
    button.setAttribute("aria-expanded", String(open));
    scrim.hidden = !open;
    // Next frame: the drawer must be visible before it can take focus.
    if (open)
      requestAnimationFrame(() =>
        document.getElementById("search-input")?.focus({ preventScroll: true }),
      );
    else button.focus({ preventScroll: true });
  };
  button.addEventListener("click", () => set(button.getAttribute("aria-expanded") !== "true"));
  scrim.addEventListener("click", () => set(false));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.documentElement.hasAttribute("data-drawer")) set(false);
  });
  // Following an in-page section link closes the drawer.
  sidebar.addEventListener("click", (e) => {
    if (
      (e.target as HTMLElement).closest("a") &&
      document.documentElement.hasAttribute("data-drawer")
    )
      set(false);
  });
}

// ---- Search: static index, section-level results, keyboard navigable ------------------------------
type SearchRecord = { page: string; title: string; section?: string; url: string; text: string };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function initSearch() {
  const root = document.querySelector<HTMLElement>("[data-search]");
  const input = root?.querySelector<HTMLInputElement>("input");
  const panel = root?.querySelector<HTMLElement>(".search-panel");
  if (!root || !input || !panel) return;
  const base = root.dataset.base ?? "";
  let index: SearchRecord[] | null = null;
  let loading: Promise<SearchRecord[]> | null = null;
  let active = -1;
  let results: SearchRecord[] = [];

  const load = () =>
    (loading ??= fetch(`${base}/search-index.json`)
      .then((r) => r.json())
      .then((d: SearchRecord[]) => (index = d)));

  const score = (r: SearchRecord, terms: string[]) => {
    const title = r.title.toLowerCase();
    const page = r.page.toLowerCase();
    const text = r.text.toLowerCase();
    let s = 0;
    for (const t of terms) {
      if (title.includes(t)) s += title.startsWith(t) ? 12 : 8;
      else if (page.includes(t)) s += 4;
      else if (text.includes(t)) s += 2;
      else return 0; // every term must match somewhere
    }
    return s + (r.section ? 0 : 1);
  };

  const snippet = (text: string, terms: string[]) => {
    const lower = text.toLowerCase();
    const at = Math.max(0, Math.min(...terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0)));
    const start = Math.max(0, at - 40);
    let out = escapeHtml(
      `${start > 0 ? "…" : ""}${text.slice(start, start + 140)}${start + 140 < text.length ? "…" : ""}`,
    );
    for (const t of terms) {
      if (!t) continue;
      out = out.replace(
        new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
        "<mark>$1</mark>",
      );
    }
    return out;
  };

  const open = (show: boolean) => {
    panel.hidden = !show;
    input.setAttribute("aria-expanded", String(show));
  };

  const highlight = (i: number) => {
    active = i;
    const items = panel.querySelectorAll<HTMLElement>("[role=option]");
    items.forEach((el, j) => {
      el.setAttribute("aria-selected", String(j === i));
    });
    const el = items[i];
    if (el) {
      input.setAttribute("aria-activedescendant", el.id);
      el.scrollIntoView({ block: "nearest" });
    } else input.removeAttribute("aria-activedescendant");
  };

  const render = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      open(false);
      return;
    }
    if (!index) {
      load().then(render);
      return;
    }
    const terms = q.split(/\s+/);
    results = index
      .map((r) => ({ r, s: score(r, terms) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.r);
    panel.innerHTML = results.length
      ? results
          .map(
            (
              r,
              i,
            ) => `<a id="search-opt-${i}" role="option" aria-selected="false" class="search-result" href="${base}/${r.url}">
              <span class="search-result-title">${escapeHtml(r.title)}</span>
              ${r.section ? `<span class="search-result-page">${escapeHtml(r.page)}</span>` : ""}
              <span class="search-result-text">${snippet(r.text, terms)}</span>
            </a>`,
          )
          .join("")
      : `<p class="search-empty">No results for “${escapeHtml(input.value.trim())}”</p>`;
    open(true);
    highlight(results.length ? 0 : -1);
  };

  input.addEventListener("focus", () => {
    load();
    if (input.value.trim()) render();
  });
  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!results.length) return;
      const d = e.key === "ArrowDown" ? 1 : -1;
      highlight((active + d + results.length) % results.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      panel.querySelectorAll<HTMLAnchorElement>("[role=option]")[active]?.click();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      if (input.value) input.value = "";
      open(false);
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (!root.contains(e.target as Node)) open(false);
  });
  // "/" or ⌘K / Ctrl+K focuses search from anywhere.
  addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    const typing = t.closest("input, textarea, select, [contenteditable]");
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      if (matchMedia("(max-width: 63.99rem)").matches)
        document.querySelector<HTMLButtonElement>(".menu-button")?.click();
      input.focus();
      input.select();
    }
  });
}

// ---- Theme toggle (button + "D" shortcut, like the website) ------------------------------------
function initTheme() {
  const root = document.documentElement;
  const set = (t: "light" | "dark") => {
    root.classList.remove("light", "dark");
    root.classList.add(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
  };
  const toggle = () => set(root.classList.contains("dark") ? "light" : "dark");
  for (const b of document.querySelectorAll(".theme-toggle")) b.addEventListener("click", toggle);
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "d" || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable]")) return;
    toggle();
  });
}

initTheme();
initDrawer();
initSearch();
initCopyButtons();
initSideNav();
initReveal();
