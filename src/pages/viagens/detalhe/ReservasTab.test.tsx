import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import type { CreditoDto } from "@/api/viagens";
import { VIAGEM } from "./fixtures";
import { ModaisViagem } from "./modais";
import { ReservasTab } from "./ReservasTab";
import type { ModalViagem } from "./useViagem";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const CREDITO: CreditoDto = {
  id: "cr1",
  clienteId: "c1",
  clienteNome: "Carlos Mendes",
  fornecedorId: "f1",
  fornecedorNome: "CVC Operadora",
  valor: 1200,
  validade: null,
  status: "disponivel",
  reservaOrigemId: null,
  codigoViagemOrigem: null,
  reservaUsoId: null,
};

/** Espelha o par ReservasTab + ModaisViagem que a `ViagemPage` monta. */
function Tela({ creditos }: { creditos: CreditoDto[] }) {
  const [modal, setModal] = useState<ModalViagem | null>(null);
  return (
    <>
      <ReservasTab
        viagem={VIAGEM}
        creditos={creditos}
        verValores
        podeEditar
        reservaAberta={undefined}
        abrir={setModal}
      />
      <ModaisViagem
        modal={modal}
        viagem={VIAGEM}
        vendedores={[]}
        creditos={creditos}
        aplicar={() => undefined}
        recarregar={() => undefined}
        fechar={() => {
          setModal(null);
        }}
      />
    </>
  );
}

function montar(creditos: CreditoDto[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/viagens/v1"]}>
        <Tela creditos={creditos} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, [])));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("crédito disponível mostra o alerta com Usar crédito…", () => {
  montar([CREDITO]);
  expect(screen.getByText(/Crédito disponível: 1 · R\$ 1\.200,00/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Usar crédito…" })).toBeInTheDocument();
});

test("sem crédito disponível não mostra o alerta", () => {
  montar();
  expect(screen.queryByRole("button", { name: "Usar crédito…" })).toBeNull();
});

test("Cancelar reserva… no card 1 abre o modal daquela reserva", () => {
  montar();
  fireEvent.click(screen.getAllByRole("button", { name: "Expandir" })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar reserva…" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("Cancelar reserva 1");
});
