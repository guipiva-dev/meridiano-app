import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { CabecalhoViagem } from "./CabecalhoViagem";
import { VIAGEM } from "./fixtures";

function renderCab({
  pode,
  viagem = VIAGEM,
  onTransferir = vi.fn(),
  onCancelar = vi.fn(),
}: {
  pode: (permissao: string) => boolean;
  viagem?: typeof VIAGEM;
  onTransferir?: () => void;
  onCancelar?: () => void;
}) {
  render(
    <MemoryRouter>
      <CabecalhoViagem viagem={viagem} pode={pode} onTransferir={onTransferir} onCancelar={onCancelar} />
    </MemoryRouter>,
  );
}

test("A24: sem_reserva com reservas todas canceladas mostra 'Sem reserva ativa'", () => {
  renderCab({
    pode: () => true,
    viagem: {
      ...VIAGEM,
      faseOperacional: "sem_reserva",
      reservas: VIAGEM.reservas.map((r) => ({ ...r, status: "cancelada" as const })),
    },
  });
  expect(screen.getByText("Sem reserva ativa")).toBeInTheDocument();
  expect(screen.queryByText("Rascunho")).toBeNull();
});

test("A24: sem_reserva sem nunca ter tido reserva mostra 'Rascunho'", () => {
  renderCab({ pode: () => true, viagem: { ...VIAGEM, faseOperacional: "sem_reserva", reservas: [] } });
  expect(screen.getByText("Rascunho")).toBeInTheDocument();
  expect(screen.queryByText("Sem reserva ativa")).toBeNull();
});

test("fase diferente de sem_reserva usa o rótulo padrão", () => {
  renderCab({ pode: () => true, viagem: { ...VIAGEM, faseOperacional: "em_emissao" } });
  expect(screen.getByText("Em emissão")).toBeInTheDocument();
});

test("com viagem.editar e transferir: Editar visível; Transferir e Cancelar viagem… no menu Mais ações", async () => {
  const user = userEvent.setup();
  const onCancelar = vi.fn();
  renderCab({ pode: () => true, onCancelar });
  expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cancelar viagem…" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Mais ações" }));
  expect(screen.getByRole("menuitem", { name: "Transferir" })).toBeInTheDocument();
  await user.click(screen.getByRole("menuitem", { name: "Cancelar viagem…" }));
  expect(onCancelar).toHaveBeenCalledTimes(1);
});

test("sem permissões: sem Editar e sem menu", () => {
  renderCab({ pode: () => false });
  expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Mais ações" })).toBeNull();
});

test("viagem cancelada: sem ações e com alerta", () => {
  renderCab({
    pode: () => true,
    viagem: { ...VIAGEM, cancelada: true, canceladaEm: "2026-09-10T10:00:00Z", motivoCancelamento: "desistiu" },
  });
  expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Mais ações" })).toBeNull();
  expect(screen.getByText(/desistiu/)).toBeInTheDocument();
});

test("trilha: link Viagens e código", () => {
  renderCab({ pode: () => true });
  const trilha = screen.getByRole("navigation", { name: "Trilha" });
  expect(within(trilha).getByRole("link", { name: "Viagens" })).toHaveAttribute("href", "/viagens");
  expect(trilha).toHaveTextContent(VIAGEM.codigo);
});
