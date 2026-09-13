import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { CabecalhoViagem } from "./CabecalhoViagem";
import { VIAGEM } from "./fixtures";

const noop = vi.fn();
const pode = () => true;

function montar(viagem = VIAGEM) {
  render(
    <MemoryRouter>
      <CabecalhoViagem viagem={viagem} pode={pode} onTransferir={noop} onCancelar={noop} />
    </MemoryRouter>,
  );
}

test("A24: sem_reserva com reservas todas canceladas mostra 'Sem reserva ativa'", () => {
  montar({
    ...VIAGEM,
    faseOperacional: "sem_reserva",
    reservas: VIAGEM.reservas.map((r) => ({ ...r, status: "cancelada" as const })),
  });
  expect(screen.getByText("Sem reserva ativa")).toBeInTheDocument();
  expect(screen.queryByText("Rascunho")).toBeNull();
});

test("A24: sem_reserva sem nunca ter tido reserva mostra 'Rascunho'", () => {
  montar({ ...VIAGEM, faseOperacional: "sem_reserva", reservas: [] });
  expect(screen.getByText("Rascunho")).toBeInTheDocument();
  expect(screen.queryByText("Sem reserva ativa")).toBeNull();
});

test("fase diferente de sem_reserva usa o rótulo padrão", () => {
  montar({ ...VIAGEM, faseOperacional: "em_emissao" });
  expect(screen.getByText("Em emissão")).toBeInTheDocument();
});
