import { expect, type Locator, type Page, test } from "@playwright/test";
import { DEV_USER, SEED } from "./fixtures";

const ANO = new Date().getFullYear() + 1;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/E-mail/).fill(DEV_USER.email);
  await page.getByLabel(/Senha/).fill(DEV_USER.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/viagens/);
}

async function escolherPassageiro(page: Page, nome: string) {
  const busca = page.getByLabel("Passageiros");
  await busca.fill(nome);
  await expect(page.getByRole("listbox")).toBeVisible();
  await busca.press("Enter");
}

/** MoneyInput mostra texto cru só enquanto focado: clicar, digitar e sair com Tab. */
async function preencherDinheiro(campo: Locator, valor: string) {
  await campo.click();
  await campo.pressSequentially(valor);
  await campo.press("Tab");
}

async function reserva(page: Page, n: number, fornecedor: string, loc: string, total: string, cliente: string) {
  await page.keyboard.press("Control+Enter");
  const card = page.getByRole("region", { name: `Reserva ${n}` });
  await card.getByLabel("Fornecedor", { exact: true }).selectOption({ label: fornecedor });
  await card.getByLabel("Localizador", { exact: true }).fill(loc);
  await card.getByRole("button", { name: "Aéreo" }).click();
  await preencherDinheiro(card.getByLabel("Total da reserva", { exact: true }), total);
  await preencherDinheiro(card.getByLabel("Venda ao cliente", { exact: true }), cliente);
}

test("lança viagem com 4 reservas só pelo teclado e mede o tempo", async ({ page }, testInfo) => {
  await login(page);

  const inicio = Date.now();
  await page.goto("/viagens/nova");
  await escolherPassageiro(page, SEED.cliente);
  await page.getByLabel("Destino").fill("Lisboa");
  await page.getByLabel("Tipo").selectOption("internacional");
  await page.getByLabel("Ida").fill(`${ANO}-04-18`);
  await page.getByLabel("Volta").fill(`${ANO}-04-28`);

  await reserva(page, 1, "CVC", "K7X2PQ", "10000", "10500");
  // Sugerido: CVC tem percentual_comissao_padrao = 10 no seed -> 10 % de 10.000 = 1.000.
  await expect(page.getByRole("region", { name: "Reserva 1" }).getByLabel("Comissão", { exact: true })).toHaveValue(
    "R$ 1.000,00",
  );

  await reserva(page, 2, "Decolar", "DCL-88213", "3000", "3200");
  await reserva(page, 3, "Azul Viagens", "AZ-90213", "2500", "2500");
  await reserva(page, 4, "CVC", "CVC-77A2Q", "1200", "1400");

  await page.keyboard.press("Control+S");
  await expect(page).toHaveURL(/\/viagens\/[0-9a-f-]+\/editar/);
  await expect(page.getByText(/✓ Salvo/)).toBeVisible();

  const segundos = (Date.now() - inicio) / 1000;
  testInfo.annotations.push({ type: "tempo-4-reservas-s", description: segundos.toFixed(1) });
  expect(segundos).toBeLessThan(300);

  // 10.500 + 3.200 + 2.500 + 1.400 = 17.600 (venda ao cliente somada em TripSummary)
  await expect(page.getByText("R$ 17.600,00")).toBeVisible();
});

test("aviso de viagem semelhante aparece e não bloqueia", async ({ page }) => {
  await login(page);

  // cria uma primeira viagem para o mesmo titular, com datas que vão se sobrepor
  await page.goto("/viagens/nova");
  await escolherPassageiro(page, SEED.cliente);
  await page.getByLabel("Destino").fill("Cancún");
  await page.getByLabel("Ida").fill(`${ANO}-05-01`);
  await page.getByLabel("Volta").fill(`${ANO}-05-05`);
  await page.keyboard.press("Control+S");
  await expect(page).toHaveURL(/\/viagens\/[0-9a-f-]+\/editar/);

  // abre uma nova viagem para o mesmo titular com período sobreposto
  await page.goto("/viagens/nova");
  await escolherPassageiro(page, SEED.cliente);
  await page.getByLabel("Ida").fill(`${ANO}-05-02`);
  await page.getByLabel("Volta").fill(`${ANO}-05-06`);

  const aviso = page.getByText(/Encontramos uma viagem semelhante/);
  await expect(aviso).toBeVisible();
  await page.getByRole("button", { name: "Continuar criando nova" }).click();
  await expect(aviso).toHaveCount(0);
});
