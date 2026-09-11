import { expect, test } from "@playwright/test";
import { loginUi } from "./api";
import { criarViagemComComissao, OPERADORA_FIN } from "./financeiro";

test.describe("financeiro", () => {
  test("conciliação: recebe comissão e a reserva sai de pendentes", async ({ page }) => {
    await loginUi(page);
    // O destino isola a linha desta execução: o banco de dev acumula viagens de execuções anteriores.
    const destino = `Lisboa FIN ${Date.now() % 100000}`;
    await criarViagemComComissao(page.request, { destino });

    await page.goto("/financeiro");
    // A conciliação não tem busca por texto; filtrar pela operadora tira as reservas das outras suítes.
    await page.getByLabel("Operadora").selectOption({ label: OPERADORA_FIN });

    const linha = page.getByRole("row", { name: new RegExp(destino) });
    await expect(linha).toBeVisible();
    await linha.getByRole("button", { name: "Receber" }).click();

    const modal = page.getByRole("dialog");
    await expect(modal.getByText(/Esperado R\$ 1\.100,00/)).toBeVisible();
    await modal.getByRole("button", { name: "Confirmar recebimento" }).click();
    await expect(modal).toHaveCount(0);

    await expect(page.getByRole("row", { name: new RegExp(destino) })).toHaveCount(0);
    await page.getByRole("tab", { name: /Recebidas/ }).click();
    await expect(page.getByRole("row", { name: new RegExp(destino) })).toBeVisible();
  });

  test("despesas: cria, marca paga e a recorrente gera a próxima", async ({ page }) => {
    await loginUi(page);
    await page.goto("/financeiro/despesas");
    await page.getByRole("button", { name: "+ Nova despesa" }).click();

    const nome = `Sistema E2E ${Date.now() % 10000}`;
    const nova = page.getByRole("dialog");
    await nova.getByLabel("Descrição").fill(nome);
    // MoneyInput mostra texto cru só enquanto focado: clicar, digitar e sair com Tab.
    const valor = nova.getByLabel("Valor");
    await valor.click();
    await valor.pressSequentially("149");
    await valor.press("Tab");
    await nova.getByLabel("Categoria").selectOption("fixo");
    await nova.getByLabel("Vencimento").fill(new Date().toLocaleDateString("en-CA"));
    await nova.getByLabel(/Repete todo mês/).selectOption("sim");
    await nova.getByRole("button", { name: "Lançar despesa" }).click();
    await expect(nova).toHaveCount(0);

    const linha = page.getByRole("row", { name: new RegExp(nome) });
    await expect(linha).toBeVisible();
    await linha.getByRole("button", { name: "Marcar pago" }).click();

    const pagar = page.getByRole("dialog");
    await pagar.getByLabel("Forma de pagamento").selectOption("pix");
    await pagar.getByRole("button", { name: "Confirmar pagamento" }).click();
    await expect(page.getByText(/Próxima criada para/)).toBeVisible();
  });
});
