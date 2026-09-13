import { render, screen } from "@testing-library/react";
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
