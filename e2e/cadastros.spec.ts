import { expect, test } from "@playwright/test";
import { loginUi } from "./api";
import { abrirPessoaPorNome, criarPessoaViaApi } from "./cadastros";

test.describe("cadastros", () => {
  test("lista → pessoa → documentos → edita e salva com Ctrl+S", async ({ page }) => {
    await loginUi(page);
    await abrirPessoaPorNome(page, "Lúcia Mendes");

    await page.getByRole("tab", { name: /Documentos/ }).click();
    await expect(page.getByText("GB998877")).toBeVisible(); // dono tem cliente.ver_documento

    // A edição vai numa pessoa própria da execução: editar a do seed nos dois viewports em
    // paralelo bate no 409 de concorrência (mesmo `xmin`).
    const nome = `Pessoa E2E ${Date.now().toString(36).toUpperCase()}`;
    await criarPessoaViaApi(page.request, nome);
    await abrirPessoaPorNome(page, nome);

    await page.getByLabel("Cidade").fill(`Campinas ${Date.now() % 1000}`);
    await expect(page.getByText("Alterações não salvas")).toBeVisible();
    await page.keyboard.press("Control+S");
    await expect(page.getByText(/Salvo às/)).toBeVisible();
  });

  test("grupo mostra as pessoas e fornecedor mostra a regra vigente", async ({ page }) => {
    await loginUi(page);
    await page.goto("/clientes/grupos");
    await page.getByRole("row", { name: /Família Mendes/ }).click();
    await expect(page.getByText("Carlos Mendes")).toBeVisible();

    await page.goto("/fornecedores");
    await page.getByRole("row", { name: /CVC/ }).click();
    await page.getByRole("tab", { name: "Financeiro" }).click();
    await expect(page.getByText("Vendas de 1 a 14")).toBeVisible();
  });
});
