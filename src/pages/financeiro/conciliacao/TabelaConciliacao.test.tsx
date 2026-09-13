import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { ConciliacaoItemDto } from "@/api/financeiro";
import { TabelaConciliacao } from "./TabelaConciliacao";

const ESTORNO: ConciliacaoItemDto = {
  reservaId: "r7",
  viagemId: "v50",
  codigo: "VG-2026-0050",
  titular: "Paula Cancelada",
  destino: "Lugar",
  localizador: "AAA",
  fornecedorId: "f1",
  fornecedorNome: "CVC",
  dataCompra: "2026-01-10",
  dataPrevistaComissao: "2026-04-05",
  situacaoComissao: "estorno_pendente",
  diasAtraso: null,
  esperado: 0,
  recebido: 150,
  saldo: -150,
  conciliacaoEncerrada: false,
  divergenciaMotivo: null,
  ultimoRecebimentoEm: "2026-03-01",
  elegivelLote: false,
};

function montar(onDivergencia = vi.fn()) {
  const tabela = (
    <TabelaConciliacao
      itens={[ESTORNO]}
      aba="divergencias"
      selecionados={new Set()}
      alternar={vi.fn()}
      alternarTodas={vi.fn()}
      podeMovimentar
      podeConciliar
      onReceber={vi.fn()}
      onDivergencia={onDivergencia}
    />
  );
  const router = createMemoryRouter(
    [
      { path: "/financeiro", element: tabela },
      { path: "/viagens/:id", element: <div>Detalhe da viagem</div> },
    ],
    { initialEntries: ["/financeiro"] },
  );
  render(<RouterProvider router={router} />);
  return screen.getByRole("row", { name: /Paula Cancelada/ });
}

test("divergências: estorno pendente mostra o chip e o botão de encerrar abre sem navegar (ALT-01)", () => {
  const onDivergencia = vi.fn();
  const linha = montar(onDivergencia);
  expect(within(linha).getByText("Estorno pendente")).toBeInTheDocument();
  fireEvent.click(within(linha).getByRole("button", { name: "Encerrar divergência…" }));
  expect(onDivergencia).toHaveBeenCalledWith(ESTORNO);
  expect(screen.queryByText("Detalhe da viagem")).toBeNull();
});

test("divergências: Enter no botão de encerrar não dispara a navegação da linha (ALT-01)", () => {
  const linha = montar();
  fireEvent.keyDown(within(linha).getByRole("button", { name: "Encerrar divergência…" }), { key: "Enter" });
  expect(screen.queryByText("Detalhe da viagem")).toBeNull();
});

test("divergências: o encerramento não fica duplicado no menu ⋯ (ALT-01)", () => {
  const linha = montar();
  expect(within(linha).getAllByRole("button", { name: /Encerrar divergência/ })).toHaveLength(1);
});
