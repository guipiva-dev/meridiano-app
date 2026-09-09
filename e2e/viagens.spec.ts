import { expect, type Locator, test } from "@playwright/test";
import { criarViagemViaApi, loginUi } from "./api";

/** MoneyInput mostra texto cru só enquanto focado: clicar, digitar e sair com Tab. */
async function preencherDinheiro(campo: Locator, valor: string) {
  await campo.click();
  await campo.pressSequentially(valor);
  await campo.press("Tab");
}

test.describe("viagens", () => {
  test("lista → filtro por aba → abre detalhe → cancela reserva com crédito → timeline", async ({ page }) => {
    await loginUi(page);
    const { id, codigo } = await criarViagemViaApi(page.request, { destino: "Lisboa E2E", reservas: 2 });

    // `q=<codigo>` isola a viagem desta execução: o banco de dev acumula viagens de execuções anteriores.
    await page.goto(`/viagens?aba=todas&idaPreset=qualquer&q=${codigo}`);
    const linha = page.getByRole("row", { name: new RegExp(codigo) });
    await expect(linha).toBeVisible();

    await page.getByRole("tab", { name: /Em emissão/ }).click();
    await expect(linha).toBeVisible();
    await linha.click();
    await expect(page).toHaveURL(new RegExp(`/viagens/${id}`));
    await expect(page.getByRole("heading", { name: "Carlos Mendes · Lisboa E2E" })).toBeVisible();

    await page.getByRole("tab", { name: /Reservas/ }).click();
    await page.getByRole("button", { name: "Expandir" }).first().click();
    await page.getByRole("button", { name: "Cancelar reserva…" }).first().click();

    const modal = page.getByRole("dialog");
    await modal.getByLabel("Motivo").fill("cliente desistiu");
    await modal.getByLabel("Desfecho").selectOption("credito");
    await preencherDinheiro(modal.getByLabel("Valor do crédito"), "9000");
    await modal.getByRole("button", { name: "Cancelar reserva", exact: true }).click();
    await expect(modal).toHaveCount(0);

    await expect(page.getByText("Cancelada").first()).toBeVisible();
    await expect(page.getByText(/Crédito disponível/)).toBeVisible();

    await page.getByRole("tab", { name: "Timeline" }).click();
    await expect(page.getByText("Reserva cancelada").first()).toBeVisible();
  });

  test("busca global acha a viagem pelo localizador", async ({ page }) => {
    await loginUi(page);
    const { id, localizador } = await criarViagemViaApi(page.request, { destino: "Porto E2E", reservas: 1 });

    await page.keyboard.press("Control+K");
    await page.getByRole("combobox", { name: "Buscar" }).fill(localizador.toLowerCase());
    await page.getByRole("option", { name: new RegExp(localizador) }).click();
    await expect(page).toHaveURL(new RegExp(`/viagens/${id}`));
  });
});
