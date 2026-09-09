import { fireEvent, render, screen } from "@testing-library/react";
import type { FornecedorDto, VendedorDto } from "@/api/viagens";
import { FiltrosViagens } from "./FiltrosViagens";

const FORNECEDORES: FornecedorDto[] = [
  { id: "f1", nome: "CVC", tipo: "operadora", percentualComissaoPadrao: 10, prazoComissaoDias: 30, ativo: true },
];
const VENDEDORES: VendedorDto[] = [];

function montar(ativos = 0) {
  const definir = vi.fn();
  const limpar = vi.fn();
  render(
    <FiltrosViagens
      filtro={{ aba: "todas", pagina: 1, tamanho: 25 }}
      idaPreset="90d"
      definir={definir}
      limpar={limpar}
      ativos={ativos}
      vendedores={VENDEDORES}
      fornecedores={FORNECEDORES}
    />,
  );
  return { definir, limpar };
}

test("painel avançado fica fechado por padrão", () => {
  montar();
  expect(screen.getByRole("button", { name: /Filtros/ })).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("button", { name: "CVC" })).toBeNull();
});

test("clicar Filtros abre o painel e mostra os chips de fornecedor", () => {
  montar();
  fireEvent.click(screen.getByRole("button", { name: /Filtros/ }));
  expect(screen.getByRole("button", { name: /Filtros/ })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "CVC" })).toBeInTheDocument();
});

test("clicar no chip do fornecedor chama definir com o id selecionado", () => {
  const { definir } = montar();
  fireEvent.click(screen.getByRole("button", { name: /Filtros/ }));
  fireEvent.click(screen.getByRole("button", { name: "CVC" }));
  expect(definir).toHaveBeenCalledWith({ fornecedorId: ["f1"] });
});

test("painel abre por padrão quando já há filtros avançados ativos", () => {
  montar(2);
  expect(screen.getByRole("button", { name: "CVC" })).toBeInTheDocument();
});

test('mostra "Limpar" só quando há filtro ativo', () => {
  montar();
  expect(screen.queryByRole("button", { name: "Limpar" })).toBeNull();
  montar(1);
  expect(screen.getByRole("button", { name: "Limpar" })).toBeInTheDocument();
});
