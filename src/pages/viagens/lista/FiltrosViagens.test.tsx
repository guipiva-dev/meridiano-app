import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import type { FiltroViagens, FornecedorDto, VendedorDto } from "@/api/viagens";
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

/** Envolve o componente com o mínimo do contrato do hook real (definir/limpar mudando `filtro`),
 * para reproduzir a divergência entre o texto digitado e o `q` da URL depois de "Limpar". */
function WrapperComEstado() {
  const [filtro, setFiltro] = useState<FiltroViagens>({ aba: "todas", pagina: 1, tamanho: 25 });
  return (
    <FiltrosViagens
      filtro={filtro}
      idaPreset="90d"
      definir={(patch) => {
        setFiltro((f) => ({ ...f, ...patch }));
      }}
      limpar={() => {
        setFiltro({ aba: "todas", pagina: 1, tamanho: 25 });
      }}
      ativos={0}
      vendedores={VENDEDORES}
      fornecedores={FORNECEDORES}
    />
  );
}

afterEach(() => {
  vi.useRealTimers();
});

test("Limpar reseta o campo de busca visível mesmo depois de digitar", () => {
  vi.useFakeTimers();
  render(<WrapperComEstado />);
  const campo = screen.getByLabelText("Buscar viagens");

  fireEvent.change(campo, { target: { value: "lis" } });
  act(() => {
    vi.advanceTimersByTime(300);
  });
  expect(campo).toHaveValue("lis");

  fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
  expect(campo).toHaveValue("");
});

test("busca acompanha filtro.q quando ele muda por fora da digitação (voltar/avançar)", () => {
  const { rerender } = render(
    <FiltrosViagens
      filtro={{ aba: "todas", pagina: 1, tamanho: 25, q: "lis" }}
      idaPreset="90d"
      definir={vi.fn()}
      limpar={vi.fn()}
      ativos={0}
      vendedores={VENDEDORES}
      fornecedores={FORNECEDORES}
    />,
  );
  const campo = screen.getByLabelText("Buscar viagens");
  expect(campo).toHaveValue("lis");

  rerender(
    <FiltrosViagens
      filtro={{ aba: "todas", pagina: 1, tamanho: 25 }}
      idaPreset="90d"
      definir={vi.fn()}
      limpar={vi.fn()}
      ativos={0}
      vendedores={VENDEDORES}
      fornecedores={FORNECEDORES}
    />,
  );
  expect(campo).toHaveValue("");
});
