import { useState } from "react";
import Demo from "./DocsTable";

/** Reads ?recipe=&presets=1 (theme is applied before paint in embed.astro). */
export default function Embed() {
  const [params] = useState(() => new URLSearchParams(location.search));
  return (
    <Demo recipe={params.get("recipe") ?? "invoices"} presets={params.get("presets") === "1"} />
  );
}
