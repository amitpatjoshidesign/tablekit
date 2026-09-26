import { useState } from "react";
import { type Recipe, recipes } from "../data/recipes";
import Demo from "./DocsTable";

function RecipeCard({ recipe, llmsUrl }: { recipe: Recipe; llmsUrl: string }) {
  const [show, setShow] = useState<"none" | "schema" | "preview">("none");
  const [copied, setCopied] = useState(false);
  const prompt = recipe.prompt.replace("{{LLMS_URL}}", llmsUrl);
  return (
    <article className="recipe" id={recipe.id}>
      <h3>{recipe.title}</h3>
      <p className="recipe-prompt">{prompt}</p>
      <div className="recipe-actions">
        <button
          type="button"
          className="docs-chip"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(prompt);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
        >
          {copied ? "Copied" : "Copy prompt"}
        </button>
        <button
          type="button"
          className="docs-chip"
          aria-pressed={show === "schema"}
          onClick={() => setShow(show === "schema" ? "none" : "schema")}
        >
          Expected schema
        </button>
        {recipe.dataset && (
          <button
            type="button"
            className="docs-chip"
            aria-pressed={show === "preview"}
            onClick={() => setShow(show === "preview" ? "none" : "preview")}
          >
            Live preview
          </button>
        )}
      </div>
      {show === "schema" && <pre>{JSON.stringify(recipe.schema, null, 2)}</pre>}
      {show === "preview" && <Demo recipe={recipe.id} />}
    </article>
  );
}

export default function Recipes({ llmsUrl }: { llmsUrl: string }) {
  return (
    <div className="recipes not-prose">
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} llmsUrl={llmsUrl} />
      ))}
    </div>
  );
}
