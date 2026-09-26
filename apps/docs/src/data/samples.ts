// Deterministic sample data for demos (same rows on server and client — no hydration mismatch).
import { banks } from "./logos";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const first = [
  "Ava",
  "Noah",
  "Mia",
  "Liam",
  "Zara",
  "Kenji",
  "Priya",
  "Mateo",
  "Lena",
  "Omar",
  "Sofia",
  "Arjun",
  "Chloe",
  "Diego",
  "Hana",
  "Ibrahim",
  "Maya",
  "Felix",
  "Nora",
  "Ravi",
  "Elena",
  "Kofi",
  "Yuki",
  "Aisha",
];
const last = [
  "Patel",
  "Kim",
  "García",
  "Okafor",
  "Nguyen",
  "Rossi",
  "Schmidt",
  "Haddad",
  "Silva",
  "Kowalski",
  "Tanaka",
  "Mensah",
  "Dubois",
  "Lindqvist",
  "Sharma",
  "Moreau",
  "Costa",
  "Ahmed",
];
const companies = [
  "Northwind",
  "Lumen Labs",
  "Acme Health",
  "Bluebird",
  "Quanta",
  "Fernway",
  "Orbital",
  "Parcel & Co",
  "Kite Studio",
  "Mosaic",
];

const BASE = Date.UTC(2026, 8, 20);
const DAY = 86_400_000;

export interface Order {
  id: string;
  customer: { name: string; email: string };
  company: string;
  status: "paid" | "pending" | "overdue" | "refunded" | "draft";
  plan: "Starter" | "Pro" | "Enterprise";
  total: number;
  items: number;
  created: string;
  paid: boolean;
}

export function makeOrders(n = 120, seed = 7): Order[] {
  const r = rng(seed);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)] as T;
  const statuses = [
    "paid",
    "paid",
    "paid",
    "pending",
    "pending",
    "overdue",
    "refunded",
    "draft",
  ] as const;
  return Array.from({ length: n }, (_, i) => {
    const name = `${pick(first)} ${pick(last)}`;
    const plan = pick(["Starter", "Starter", "Pro", "Pro", "Enterprise"] as const);
    const base = plan === "Starter" ? 29 : plan === "Pro" ? 129 : 890;
    const status = pick(statuses);
    return {
      id: `INV-${String(4800 + n - i).padStart(5, "0")}`,
      customer: {
        name,
        email: `${name.split(" ")[0]?.toLowerCase()}@${pick(companies)
          .toLowerCase()
          .replace(/[^a-z]/g, "")}.com`,
      },
      company: pick(companies),
      status,
      plan,
      total: Math.round(base * (1 + r() * 3) * 100) / 100,
      items: 1 + Math.floor(r() * 12),
      created: new Date(BASE - Math.floor(r() * 180) * DAY - Math.floor(r() * DAY)).toISOString(),
      paid: status === "paid",
    };
  });
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  team: string;
  status: "active" | "invited" | "suspended";
  lastActive: string;
  mfa: boolean;
}

export function makeMembers(n = 40, seed = 11): Member[] {
  const r = rng(seed);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)] as T;
  return Array.from({ length: n }, (_, i) => {
    const name = `${pick(first)} ${pick(last)}`;
    return {
      id: `u_${i + 1}`,
      name,
      email: `${name
        .toLowerCase()
        .replace(/[^a-z ]/g, "")
        .replace(" ", ".")}@example.com`,
      role: i === 0 ? "owner" : pick(["admin", "editor", "editor", "viewer", "viewer"] as const),
      team: pick(["Design", "Engineering", "Research", "Marketing", "Support"]),
      status: pick(["active", "active", "active", "active", "invited", "suspended"] as const),
      lastActive: new Date(BASE - Math.floor(r() * 30 * DAY)).toISOString(),
      mfa: r() > 0.3,
    };
  });
}

export interface Deployment {
  id: string;
  service: string;
  environment: "production" | "staging" | "preview";
  status: "ready" | "building" | "failed" | "canceled";
  commit: string;
  author: string;
  duration: number;
  created: string;
}

export function makeDeployments(n = 60, seed = 3): Deployment[] {
  const r = rng(seed);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)] as T;
  return Array.from({ length: n }, (_, i) => ({
    id: `dpl_${(0x9f3a + i * 7919).toString(16)}`,
    service: pick(["web", "api", "worker", "docs", "auth"]),
    environment: pick(["production", "staging", "preview", "preview"] as const),
    status:
      i === 0
        ? "building"
        : pick(["ready", "ready", "ready", "ready", "failed", "canceled"] as const),
    commit: pick([
      "fix: table focus ring",
      "feat: bulk export",
      "chore: bump deps",
      "refactor: tokens",
      "feat: dark mode",
      "fix: pagination clamp",
    ]),
    author: `${pick(first)} ${pick(last)}`,
    duration: Math.round(20 + r() * 400),
    created: new Date(BASE - i * 3_600_000 * (1 + r() * 5)).toISOString(),
  }));
}

// ---- More datasets: one per prompt recipe, so every recipe can be previewed live. ----------

const person = (r: () => number) => {
  const f = first[Math.floor(r() * first.length)] as string;
  const l = last[Math.floor(r() * last.length)] as string;
  return `${f} ${l}`;
};
const pickWith =
  (r: () => number) =>
  <T>(a: readonly T[]) =>
    a[Math.floor(r() * a.length)] as T;
const iso = (t: number) => new Date(t).toISOString();

export function makeLeads(n = 48, seed = 21) {
  const r = rng(seed);
  const pick = pickWith(r);
  return Array.from({ length: n }, (_, i) => {
    const name = person(r);
    return {
      id: `lead_${i + 1}`,
      name,
      company: pick(companies),
      stage: pick(["new", "new", "qualified", "qualified", "proposal", "won", "lost"] as const),
      value: Math.round((2 + r() * 180) * 1000),
      owner: person(r),
      nextStep: iso(BASE + Math.floor(r() * 30) * DAY),
      lastContacted: iso(BASE - Math.floor(r() * 40 * DAY)),
    };
  });
}

export function makeTickets(n = 64, seed = 31) {
  const r = rng(seed);
  const pick = pickWith(r);
  const subjects = [
    "Can't export invoices to CSV",
    "SSO login loops back to sign-in",
    "Webhook retries not firing",
    "Dark mode contrast on badges",
    "Refund stuck in pending",
    "API rate limit too low for batch job",
    "Table columns reset after refresh",
    "Invite email never arrived",
    "Billing address won't save",
    "Mobile layout cuts off totals",
  ];
  return Array.from({ length: n }, (_, i) => {
    const requester = person(r);
    return {
      id: `T-${String(2400 + n - i)}`,
      subject: pick(subjects),
      requester,
      priority: pick(["urgent", "high", "high", "normal", "normal", "normal", "low"] as const),
      status: pick(["open", "open", "pending", "on_hold", "solved"] as const),
      assignee: pick(["Ava Patel", "Noah Kim", "Priya Sharma", "Unassigned"]),
      due: iso(BASE + Math.floor((r() * 6 - 1) * DAY)),
    };
  });
}

export function makeInventory(n = 56, seed = 41) {
  const r = rng(seed);
  const pick = pickWith(r);
  const products = {
    Furniture: ["Oak desk", "Task chair", "Standing frame", "Bookshelf", "Side table"],
    Lighting: ["Desk lamp", "Floor lamp", "LED strip", "Pendant light"],
    Audio: ["Studio headphones", "USB microphone", "Bookshelf speakers"],
    Office: ["Notebook set", "Pen pack", "Monitor arm", "Cable tray", "Desk mat"],
  } as const;
  const cats = Object.keys(products) as (keyof typeof products)[];
  return Array.from({ length: n }, (_, i) => {
    const category = pick(cats);
    const stock = r() < 0.12 ? 0 : Math.floor(r() * (r() < 0.25 ? 12 : 400));
    return {
      id: `sku_${i + 1}`,
      sku: `${category.slice(0, 3).toUpperCase()}-${String(1000 + i * 7)}`,
      name: pick(products[category]),
      category,
      stock,
      price: Math.round((8 + r() * 640) * 100) / 100,
      stockStatus: stock === 0 ? "out" : stock < 15 ? "low" : "in_stock",
      updated: iso(BASE - Math.floor(r() * 60 * DAY)),
    };
  });
}

export function makeFiles(n = 36, seed = 51) {
  const r = rng(seed);
  const pick = pickWith(r);
  const kinds = [
    ["Brand guidelines", "PDF"],
    ["Q3 roadmap", "Slides"],
    ["Table component spec", "Doc"],
    ["Usability test notes", "Doc"],
    ["Icon set", "Figma"],
    ["Customer interviews", "Sheet"],
    ["Onboarding flow", "Figma"],
    ["Pricing research", "Sheet"],
    ["Launch video", "Video"],
  ] as const;
  return Array.from({ length: n }, (_, i) => {
    const [title, type] = pick(kinds);
    const ext = { PDF: "pdf", Slides: "key", Doc: "md", Figma: "fig", Sheet: "csv", Video: "mp4" }[
      type
    ];
    return {
      id: `file_${i + 1}`,
      name: `${title}${i > kinds.length ? ` v${1 + (i % 4)}` : ""}.${ext}`,
      url: `https://example.com/files/${i + 1}`,
      owner: person(r),
      size: Math.round(
        (type === "Video" ? 80_000 : 40) + r() * (type === "Video" ? 900_000 : 24_000),
      ),
      type,
      shared: r() > 0.45,
      modified: iso(BASE - Math.floor(r() * 90 * DAY)),
    };
  });
}

export function makeAudit(n = 120, seed = 61) {
  const r = rng(seed);
  const pick = pickWith(r);
  return Array.from({ length: n }, (_, i) => {
    const actor = person(r);
    return {
      id: `evt_${i + 1}`,
      at: iso(BASE - i * 17 * 60_000 - Math.floor(r() * 600_000)),
      actor,
      action: pick([
        "user.login",
        "invoice.refund",
        "member.invite",
        "apikey.create",
        "settings.update",
        "export.csv",
      ]),
      target: pick([
        "workspace/acme",
        "invoice/INV-04844",
        "member/u_12",
        "key/sk_live_…a1b2",
        "billing/plan",
      ]),
      ip: `10.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`,
      result: r() > 0.12 ? "success" : "denied",
    };
  });
}

export function makeApiKeys(n = 7, seed = 71) {
  const r = rng(seed);
  const pick = pickWith(r);
  const names = [
    "Production",
    "Staging",
    "CI pipeline",
    "Analytics export",
    "Zapier",
    "Local dev",
    "Legacy import",
  ];
  return Array.from({ length: n }, (_, i) => ({
    id: `key_${i + 1}`,
    name: names[i % names.length] as string,
    prefix: `sk_${i < 2 ? "live" : "test"}_…${Math.floor(r() * 0xffff)
      .toString(16)
      .padStart(4, "0")}`,
    scopes: pick(["read", "read, write", "read, write, admin", "export"]),
    lastUsed: iso(BASE - Math.floor(r() * 20 * DAY)),
    expires: iso(BASE + Math.floor((r() * 300 - 40) * DAY)),
    status: i === 6 ? "revoked" : i === 5 ? "expired" : "active",
  }));
}

export function makeTopPages(n = 60, seed = 81) {
  const r = rng(seed);
  const pages = [
    "/",
    "/pricing",
    "/docs",
    "/docs/install",
    "/blog/agentic-prototyping",
    "/changelog",
    "/playground",
    "/docs/theming",
    "/about",
    "/careers",
    "/blog/design-tokens",
    "/docs/accessibility",
  ];
  return Array.from({ length: n }, (_, i) => {
    const path = i < pages.length ? (pages[i] as string) : `/blog/post-${i}`;
    const views = Math.round(200 + (r() * 120_000) / (1 + i * 0.35));
    return {
      id: `page_${i + 1}`,
      path,
      url: `https://example.com${path}`,
      views,
      visitors: Math.round(views * (0.55 + r() * 0.3)),
      bounce: Math.round((0.2 + r() * 0.55) * 1000) / 1000,
      avgTime: Math.round(15 + r() * 280),
      conversion: Math.round(r() * 0.09 * 1000) / 1000,
    };
  });
}

// ---- Bank settlements (fintech payouts), with bank logos from Simple Icons ----------------

export function makeSettlements(n = 90, seed = 91) {
  const r = rng(seed);
  const pick = pickWith(r);
  const merchants = [
    "Blue Tokai Coffee",
    "Chai Point",
    "Nykaa",
    "FabIndia",
    "Haldiram's",
    "Croma",
    "Decathlon",
    "Lenskart",
    "Tanishq",
    "Bikanervala",
  ];
  return Array.from({ length: n }, (_, i) => {
    const b = pick(banks);
    const status = pick([
      "settled",
      "settled",
      "settled",
      "processing",
      "on_hold",
      "failed",
    ] as const);
    return {
      id: `STL-${String(88100 + n - i)}`,
      merchant: pick(merchants),
      bank: b.name,
      bankLogo: b.logo,
      bankLogoDark: b.logoDark,
      account: `•••• ${String(1000 + Math.floor(r() * 9000))}`,
      method: pick(["UPI", "IMPS", "NEFT", "NEFT", "RTGS"] as const),
      amount: Math.round((1200 + r() * (r() < 0.15 ? 2_400_000 : 180_000)) * 100) / 100,
      status,
      settledAt: iso(BASE - i * 5 * 3_600_000 - Math.floor(r() * 3_600_000)),
    };
  });
}
