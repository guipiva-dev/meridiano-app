import { expect, test } from "@playwright/test";

const secoes = ["botoes", "campos", "dinheiro", "chips-badges", "alertas", "tabs", "page-header"];

for (const sec of secoes) {
  test(`styleguide ${sec}`, async ({ page }) => {
    await page.goto("/styleguide");
    const el = page.getByTestId(`sg-${sec}`);
    await expect(el).toBeVisible();
    await expect(el).toHaveScreenshot(`${sec}.png`);
  });
}

test("modal aberto", async ({ page }) => {
  await page.goto("/styleguide");
  await page.getByRole("button", { name: "Abrir modal de decisão" }).click();
  await expect(page.getByRole("dialog")).toHaveScreenshot("modal.png");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
