import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { CreditoVencendoDto } from "@/api/agenda";
import { CreditosTab } from "./CreditosTab";

function credito(over: Partial<CreditoVencendoDto> = {}): CreditoVencendoDto {
  return {
    creditoId: "cr1",
    clienteId: "c1",
    clienteNome: "Patrícia Nunes",
    fornecedorNome: "Porto Seguro Viagens",
    origem: "cancelamento · PG-5521",
    viagemOrigemId: null,
    validade: "2027-02-28",
    diasParaVencer: 300,
    valor: 5100,
    ...over,
  };
}

function montar(creditos: CreditoVencendoDto[]) {
  render(
    <MemoryRouter>
      <CreditosTab creditos={creditos} />
    </MemoryRouter>,
  );
}

test("crédito vencido mostra 'vencido' em vez de meses negativos (achado: '01/2020 · -82 meses')", () => {
  montar([credito({ validade: "2020-01-15", diasParaVencer: -2490 })]);
  expect(screen.getByText("01/2020 · vencido")).toBeInTheDocument();
});

test("crédito válido continua mostrando os meses restantes", () => {
  montar([credito({ validade: "2027-02-28", diasParaVencer: 300 })]);
  expect(screen.getByText("02/2027 · 10 meses")).toBeInTheDocument();
});
