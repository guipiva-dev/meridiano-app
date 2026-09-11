import { expect, test } from "@playwright/test";
import { criarViagemViaApi, loginUi } from "./api";
import { cancelarPrimeiraReservaViaApi, E2E_API } from "./operacao";

test.describe("operação", () => {
  test("agenda mostra pendência atrasada do seed, badge e cria pendência solta", async ({ page }) => {
    await loginUi(page);
    // Badge de Agenda na sidebar: o `aria-label` do link carrega a contagem (o número em si é aria-hidden).
    await expect(page.getByRole("link", { name: /Agenda · \d+ pendências/ })).toBeVisible();

    await page.goto("/agenda");
    const atrasadas = page.locator("section", { has: page.getByRole("heading", { name: /^Atrasadas \d+$/ }) });
    await expect(atrasadas).toContainText("Cobrar comissão CVC");

    const titulo = `E2E agenda ${Date.now() % 100000}`;
    await page.getByRole("button", { name: "+ Nova pendência" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel(/O que precisa ser feito/).fill(titulo);
    await expect(modal.getByLabel(/^Data/)).toHaveValue(new Date().toLocaleDateString("en-CA"));
    await modal.getByRole("button", { name: "Criar pendência" }).click();
    await expect(modal).toHaveCount(0);

    const hoje = page.locator("section", { has: page.getByRole("heading", { name: /^Hoje \d+$/ }) });
    await expect(hoje).toContainText(titulo);

    // O checkbox da linha (aria-label "Concluir <título>") dispara o mesmo `onConcluir` do botão "✓ Concluir".
    await hoje.getByRole("checkbox", { name: `Concluir ${titulo}` }).click();
    await expect(page.getByText(titulo, { exact: true })).toHaveCount(0);
  });

  test("relatórios do ano carregam KPIs e CSV responde", async ({ page }) => {
    await loginUi(page);
    await page.goto("/relatorios");

    const kpi = page.locator("div", { has: page.getByText("Venda no ano", { exact: true }) }).last();
    await expect(kpi).toContainText("R$");

    for (const mes of ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]) {
      await expect(page.getByRole("group", { name: new RegExp(`^${mes}:`) })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible();

    // `page.request` compartilha o cookie da sessão da tela.
    const ano = new Date().getFullYear();
    const csv = await page.request.get(`${E2E_API}/relatorios/csv?ano=${ano}`);
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
  });

  test("equipe lista estados e reenvia convite", async ({ page }) => {
    await loginUi(page);
    await page.goto("/equipe");

    const marcos = page.getByRole("row", { name: /Marcos Castro/ });
    await expect(marcos).toContainText(/sem acesso/i);
    await expect(marcos.getByRole("button", { name: "Convidar" })).toBeVisible();

    // O seed dá ao Bruno um convite com prazo; a coluna Acesso mostra "convite pendente" ou "convite expira em N dias".
    const bruno = page.getByRole("row", { name: /Bruno Sales/ });
    await expect(bruno).toContainText(/convite (pendente|expira)/i);
    await bruno.getByRole("button", { name: "Reenviar" }).click();
    await expect(page.getByText("Convite enviado para bruno@viva.dev")).toBeVisible();

    // Marcos não tem "Editar" (só "Convidar"); a linha inteira é clicável e abre o detalhe.
    await marcos.getByText("Marcos Castro").click();
    await expect(page).toHaveURL(/\/equipe\/[0-9a-f-]{36}$/);
    await expect(page.getByText("O que este perfil vê")).toBeVisible();
    await expect(page.getByText("só as próprias")).toBeVisible();
  });

  test("auditoria lista o evento gerado e filtra por categoria", async ({ page }) => {
    await loginUi(page);
    const destino = `Roma AUD ${Date.now() % 100000}`;
    const motivo = `E2E auditoria ${Date.now() % 100000}`;
    const viagem = await criarViagemViaApi(page.request, { destino, reservas: 1 });
    await cancelarPrimeiraReservaViaApi(page.request, viagem.id, motivo);

    await page.goto("/auditoria");
    await page.getByRole("group", { name: "O quê" }).getByRole("button", { name: "Cancelamentos" }).click();

    // A linha identifica a reserva pelo localizador; o motivo do cancelamento fica em `reserva.motivo_cancelamento`,
    // não na coluna `auditoria.motivo` (o endpoint não passa `req.Motivo` ao `Contexto()`), então não aparece aqui.
    const evento = page.getByRole("listitem").filter({ hasText: viagem.localizador }).first();
    await expect(evento).toContainText("— Reserva cancelada");
    await expect(evento.getByRole("link", { name: viagem.codigo })).toHaveAttribute("href", `/viagens/${viagem.id}`);

    await evento.getByRole("button", { name: "Ver detalhes" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("rowheader", { name: "status" })).toBeVisible();
    await expect(modal).toContainText("cancelada");
  });
});
