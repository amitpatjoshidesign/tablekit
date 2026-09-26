// Static search index: one record per page section. Built with the site, so search
// works on GitHub Pages and in dev with no service or extra build step.
import { getCollection } from "astro:content";
import GithubSlugger from "github-slugger";

const clean = (md: string) =>
  md
    .replace(/^import .*$/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    // Keep inline code like `<table>`; strip only JSX/HTML elements.
    .replace(/`([^`]*)`/g, (_, c: string) => c.replace(/</g, "\uE000").replace(/>/g, "\uE001"))
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, " ")
    .replace(/[`*_>#|]/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\uE000/g, "<")
    .replace(/\uE001/g, ">")
    .trim();

export async function GET() {
  const docs = await getCollection("docs");
  const records: { page: string; title: string; section?: string; url: string; text: string }[] =
    [];
  for (const entry of docs) {
    const slugger = new GithubSlugger();
    const url = `${entry.id}/`;
    const parts = (entry.body ?? "").split(/^## (.+)$/m);
    records.push({
      page: entry.data.title,
      title: entry.data.title,
      url,
      text: `${entry.data.description ?? ""} ${clean(parts[0] ?? "")}`.trim(),
    });
    for (let i = 1; i < parts.length; i += 2) {
      const heading = (parts[i] ?? "").trim();
      records.push({
        page: entry.data.title,
        title: heading,
        section: heading,
        url: `${url}#${slugger.slug(heading)}`,
        text: clean(parts[i + 1] ?? ""),
      });
    }
  }
  return new Response(JSON.stringify(records), { headers: { "Content-Type": "application/json" } });
}
