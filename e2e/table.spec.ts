import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });

    test("home demo renders with the right layout and no a11y violations", async ({
      page,
    }, info) => {
      await page.goto("./");
      const root = page.locator(".tk-root").first();
      await expect(root).toBeVisible();
      const layout = await root.getAttribute("data-layout");
      expect(layout).toBe(info.project.name === "phone" ? "stack" : "table");

      // No horizontal page scroll at any width.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow).toBe(false);

      const axe = await new AxeBuilder({ page }).include(".tk-root").analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

      await expect(root).toHaveScreenshot(`home-${scheme}.png`, { maxDiffPixelRatio: 0.02 });
    });
  });
}

test("each preset renders", async ({ page }) => {
  await page.goto("./guides/theming/");
  for (const name of ["shadcn/ui", "Material 3", "Carbon", "tablekit"]) {
    await page.getByRole("button", { name }).click();
    await expect(page.locator(".tk-root").first()).toHaveScreenshot(
      `preset-${name.replace(/\W/g, "")}.png`,
      {
        maxDiffPixelRatio: 0.02,
      },
    );
  }
});

test("keyboard: sort, open row menu, escape returns focus", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "headers are replaced by the sort select on phones");
  await page.goto("./");
  const total = page.getByRole("columnheader", { name: /Total/ }).first();
  await total.getByRole("button").focus();
  await page.keyboard.press("Enter");
  await expect(total).toHaveAttribute("aria-sort", "ascending");

  const menuButton = page.getByRole("button", { name: "Row actions" }).first();
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "View" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();
});
