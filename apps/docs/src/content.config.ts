import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      /** Full-width content column (playground). */
      wide: z.boolean().optional(),
      /** Hide the in-page section list under the current item. */
      sections: z.boolean().optional(),
    }),
  }),
};
