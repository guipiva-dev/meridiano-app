import { fireEvent, render, screen } from "@testing-library/react";
import type { FornecedorDetalheDto } from "@/api/fornecedores";
import { RegrasTab } from "./RegrasTab";

const VIGENTE = {
  vigenteDesde: "2026-01-01",
  janelas: [
    { diaInicial: 1, diaFinal: 14, diaPagamento: 20, mesesAFrente: 0 },
    { diaInicial: 15, diaFinal: 31, diaPagamento: 5, mesesAFrente: 1 },
  ],
  vigente: true,
};

const FORNECEDOR: FornecedorDetalheDto = {
  id: "f1",
  versao: "77",
  nome: "CVC",
  tipo: "operadora",
  cnpj: null,
  site: null,
  contato: null,
  telefone: null,
  telefoneEmergencia: null,
  percentualComissaoPadrao: 10,
  prazoComissaoDias: 30,
  ativo: true,
  observacoes: null,
  resumo: { reservas: 12 },
  regras: [
    {
      vigenteDesde: "2025-01-01",
      janelas: [{ diaInicial: 1, diaFinal: 31, diaPagamento: 10, mesesAFrente: 1 }],
      vigente: false,
    },
    VIGENTE,
  ],
  regraVigente: VIGENTE,
};

function montar(fornecedor: FornecedorDetalheDto = FORNECEDOR, podeEditar = true) {
  render(<RegrasTab fornecedor={fornecedor} podeEditar={podeEditar} onMudou={() => undefined} />);
}

test("lista as janelas da regra vigente e o prazo fixo", () => {
  montar();
  expect(screen.getByText("Regra vigente desde 01/01/2026")).toBeInTheDocument();
  expect(screen.getByText("Vendas de 1 a 14")).toBeInTheDocument();
  expect(screen.getByText("pagam dia 20 do mesmo mês")).toBeInTheDocument();
  expect(screen.getByText("Vendas de 15 a 31")).toBeInTheDocument();
  expect(screen.getByText("pagam dia 5 do mês seguinte")).toBeInTheDocument();
  expect(screen.getByText("ou prazo fixo: 30 dias após a compra")).toBeInTheDocument();
});

test("versões antigas ficam recolhidas com a contagem", () => {
  montar();
  expect(screen.getByText("Versões anteriores (1)")).toBeInTheDocument();
});

test("botão abre o modal de nova versão", () => {
  montar();
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Nova versão da regra a partir de…" }));
  expect(screen.getByRole("dialog", { name: "Nova versão da regra" })).toBeInTheDocument();
});

test("sem permissão de editar não oferece nova versão", () => {
  montar(FORNECEDOR, false);
  expect(screen.queryByRole("button", { name: "Nova versão da regra a partir de…" })).toBeNull();
});

test("fornecedor sem regra mostra só o estado vazio, sem a linha de prazo fixo", () => {
  montar({ ...FORNECEDOR, regras: [], regraVigente: null });
  expect(screen.getByText("Sem regra de pagamento")).toBeInTheDocument();
  expect(screen.queryByText("ou prazo fixo: 30 dias após a compra")).toBeNull();
});

test("prazo de 1 dia usa o singular (não '1 dias')", () => {
  montar({ ...FORNECEDOR, prazoComissaoDias: 1 });
  expect(screen.getByText("ou prazo fixo: 1 dia após a compra")).toBeInTheDocument();
});

test("F02-front: versão com vigenteDesde no futuro vira 'Próxima versão' e some de anteriores", () => {
  const proxima = {
    vigenteDesde: "2099-01-01",
    janelas: [{ diaInicial: 1, diaFinal: 31, diaPagamento: 10, mesesAFrente: 0 }],
    vigente: false,
  };
  montar({ ...FORNECEDOR, regras: [...FORNECEDOR.regras, proxima] });
  expect(screen.getByText("Próxima versão (a partir de 01/01/2099)")).toBeInTheDocument();
  expect(screen.getByText("Versões anteriores (1)")).toBeInTheDocument();
});

test("F02-front: todas as versões futuras aparecem, em ordem crescente de data", () => {
  const vigenteAtual = { vigenteDesde: "2026-01-01", janelas: [], vigente: true };
  const regras = [
    { vigenteDesde: "2027-02-01", janelas: [], vigente: false },
    { vigenteDesde: "2027-01-01", janelas: [], vigente: false },
    vigenteAtual,
  ];
  montar({ ...FORNECEDOR, regras, regraVigente: vigenteAtual });
  const titulos = screen.getAllByText(/^Próxima versão \(a partir de/).map((el) => el.textContent);
  expect(titulos).toEqual(["Próxima versão (a partir de 01/01/2027)", "Próxima versão (a partir de 01/02/2027)"]);
});

test("F02-front: campo vigente do B6 decide mesmo quando regraVigente (legado) aponta para outra", () => {
  const outraVigente = { vigenteDesde: "2024-06-01", janelas: [], vigente: true };
  const naoVigente = { ...VIGENTE, vigente: false };
  montar({
    ...FORNECEDOR,
    regras: [outraVigente, naoVigente],
    regraVigente: VIGENTE,
  });
  expect(screen.getByText("Regra vigente desde 01/06/2024")).toBeInTheDocument();
  expect(screen.getByText("Versões anteriores (1)")).toBeInTheDocument();
});
