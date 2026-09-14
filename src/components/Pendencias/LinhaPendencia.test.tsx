import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { clientesApi } from "@/api/clientes";
import type { PendenciaDto } from "@/api/pendencias";
import { LinhaPendencia } from "./LinhaPendencia";

function pendencia(over: Partial<PendenciaDto> = {}): PendenciaDto {
  return {
    id: "p1",
    versao: "1",
    titulo: "Renovar passaporte",
    descricao: null,
    dataPrevista: "2026-04-15",
    responsavelId: "u1",
    responsavelNome: "Dono Dev",
    clienteId: null,
    clienteNome: null,
    viagemId: null,
    codigoViagem: null,
    status: "aberta",
    origem: "automatica",
    prioridade: "normal",
    adiadaDe: null,
    concluidaEm: null,
    atrasada: false,
    ...over,
  };
}

function montar(p: PendenciaDto) {
  render(
    <LinhaPendencia p={p} onConcluir={vi.fn()} onAdiar={vi.fn()} onEditar={vi.fn()} onExcluir={vi.fn()} podeEditar />,
  );
}

test("separa origem e responsável com ' · ' (achado: 'automáticaDono Dev' sem separador)", () => {
  montar(pendencia({ origem: "automatica", responsavelNome: "Dono Dev" }));
  const meta = document.querySelector(".meta");
  expect(meta?.textContent).toContain("automática · Dono Dev");
  expect(meta?.textContent).not.toContain("automáticaDono Dev");
});

test("também separa quando a origem é manual", () => {
  montar(pendencia({ origem: "manual", responsavelNome: "Ana Paula" }));
  const meta = document.querySelector(".meta");
  expect(meta?.textContent).toContain("manual · Ana Paula");
});

test("sem responsável não sobra separador solto", () => {
  montar(pendencia({ responsavelNome: null }));
  const meta = document.querySelector(".meta");
  const texto = meta?.textContent ?? "";
  expect(texto.trim().endsWith("·")).toBe(false);
});

test("AC03: concluída mostra o badge 'Concluída', não só o risco no título", () => {
  montar(pendencia({ status: "concluida" }));
  expect(screen.getByText("Concluída")).toBeInTheDocument();
});

test("AC03: aberta não mostra o badge 'Concluída'", () => {
  montar(pendencia({ status: "aberta" }));
  expect(screen.queryByText("Concluída")).toBeNull();
});

describe("mensagem pronta no WhatsApp (check-in e pós-viagem)", () => {
  const contato = {
    titularId: "c1",
    titularNome: "Carlos Mendes",
    titularWhatsapp: "11988887777",
    destino: "Lisboa",
    dataIda: "2026-10-05",
    dataVolta: "2026-10-15",
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("check-in com WhatsApp: abre o link e registra o atendimento, sem concluir", async () => {
    const abrir = vi.spyOn(window, "open").mockReturnValue(null);
    const criar = vi.spyOn(clientesApi, "criarAtendimento").mockResolvedValue({} as never);
    const onConcluir = vi.fn();
    render(
      <LinhaPendencia
        p={pendencia({ titulo: "Check-in", viagemId: "v1", mensagemTipo: "checkin", ...contato })}
        onConcluir={onConcluir}
        onAdiar={vi.fn()}
        onEditar={vi.fn()}
        onExcluir={vi.fn()}
        podeEditar
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(abrir).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/wa\.me\/5511988887777\?text=Ol%C3%A1%2C%20Carlos!/),
      "_blank",
      "noopener",
    );
    await waitFor(() => {
      expect(criar).toHaveBeenCalledWith("c1", {
        canal: "whatsapp",
        resumo: "Mensagem de check-in enviada pelo sistema",
        ocorridoEm: null,
      });
    });
    expect(onConcluir).not.toHaveBeenCalled();
  });

  test("titular sem WhatsApp: botão desabilitado com texto visível", () => {
    montar(
      pendencia({ titulo: "Pós-viagem", viagemId: "v1", mensagemTipo: "posviagem", ...contato, titularWhatsapp: null }),
    );
    expect(screen.getByRole("button", { name: "Titular sem WhatsApp" })).toBeDisabled();
  });

  test("manual ou sem contato do titular não mostra a ação", () => {
    // Título "Check-in" sem mensagemTipo (manual ou sem permissão): o front não adivinha pelo título.
    montar(pendencia({ titulo: "Check-in", origem: "manual", viagemId: "v1", mensagemTipo: null, ...contato }));
    montar(pendencia({ id: "p2", titulo: "Check-in", viagemId: "v1" }));
    expect(screen.queryByRole("button", { name: "Enviar mensagem" })).toBeNull();
    expect(screen.queryByText("Titular sem WhatsApp")).toBeNull();
  });
});
