import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FornecedorDto } from "@/api/viagens";
import { ReservationCard } from "./ReservationCard";
import { type ReservaForm, reservaVazia } from "./tipos";

const fornecedores: FornecedorDto[] = [
  { id: "f1", nome: "Decolar", tipo: "operadora", percentualComissaoPadrao: 10, prazoComissaoDias: 30, ativo: true },
];

function reservaPreenchida(aberta: boolean): ReservaForm {
  return {
    ...reservaVazia(0),
    fornecedorId: "f1",
    localizador: "DCL-88213",
    status: "emitida",
    valorTotal: 3000,
    valorComissao: 300,
    ravOperadora: 20,
    valorCliente: 3200,
    ravClienteModo: "via_operadora",
    aberta,
  };
}

function base(overrides: Partial<Parameters<typeof ReservationCard>[0]> = {}) {
  return {
    indice: 1,
    value: reservaPreenchida(false),
    onChange: () => undefined,
    onToggle: () => undefined,
    onRemover: () => undefined,
    fornecedores,
    onNovoFornecedor: () => undefined,
    erros: {},
    avisoDuplicada: null,
    ...overrides,
  };
}

test("header mostra 'Reserva 1', fornecedor e total; fechado não renderiza campos", () => {
  render(<ReservationCard {...base()} />);
  const region = screen.getByRole("region", { name: "Reserva 1" });
  expect(region).toHaveTextContent("Decolar");
  expect(region).toHaveTextContent("R$ 3.200,00");
  expect(screen.queryByLabelText("Total da reserva")).not.toBeInTheDocument();
});

test("'Expandir' chama onToggle", async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  render(<ReservationCard {...base({ onToggle })} />);
  await user.click(screen.getByRole("button", { name: "Expandir" }));
  expect(onToggle).toHaveBeenCalledTimes(1);
});

test("aberta mostra o ResultSummary com receita R$ 520,00 (3000/300/20/3200 via_operadora)", () => {
  render(<ReservationCard {...base({ value: reservaPreenchida(true) })} />);
  expect(screen.getByLabelText("Total da reserva")).toBeInTheDocument();
  const receita = screen.getByText("Receita da agência").closest("div");
  expect(receita).not.toBeNull();
  expect(within(receita as HTMLElement).getByText("R$ 520,00")).toBeInTheDocument();
});
