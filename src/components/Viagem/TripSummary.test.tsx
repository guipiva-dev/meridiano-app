import { render, screen } from "@testing-library/react";
import { comissaoMedia, type ReservaValores, somarReservas, TripSummary } from "./TripSummary";

test("soma vendas e calcula o resultado da viagem", () => {
  const reservas: ReservaValores[] = [
    {
      valorTotal: 3000,
      valorComissao: 300,
      ravOperadora: 20,
      valorCliente: 3200,
      taxaServico: 0,
      ravClienteModo: "via_operadora",
    },
    {
      valorTotal: 10000,
      valorComissao: 1000,
      ravOperadora: 100,
      valorCliente: 10500,
      taxaServico: 0,
      ravClienteModo: "via_operadora",
    },
  ];
  render(<TripSummary reservas={reservas} repasseValor={300} despesas={0} />);

  expect(screen.getByText("R$ 13.700,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 13.000,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 1.820,00")).toBeInTheDocument();
});

test("sem mostrarResultado esconde comissão, despesas e resultado, e mostra a receita", () => {
  const reservas: ReservaValores[] = [
    {
      valorTotal: 3000,
      valorComissao: 300,
      ravOperadora: 20,
      valorCliente: 3200,
      taxaServico: 0,
      ravClienteModo: "via_operadora",
    },
  ];
  render(<TripSummary reservas={reservas} repasseValor={300} despesas={0} mostrarResultado={false} />);

  expect(screen.queryByText("Comissão do vendedor")).toBeNull();
  expect(screen.queryByText("Despesas da viagem")).toBeNull();
  expect(screen.queryByText(/Resultado da viagem/)).toBeNull();
  expect(screen.getByText("Total cobrado")).toBeInTheDocument();
  expect(screen.getByText("Custo das reservas")).toBeInTheDocument();
  expect(screen.getByText("Receita da agência")).toBeInTheDocument();
  expect(screen.getByText("R$ 520,00")).toBeInTheDocument();
});

test("reserva cancelada fica fora de todos os totais (alinhado ao Resumo do detalhe)", () => {
  const ativa: ReservaValores = {
    valorTotal: 3000,
    valorComissao: 300,
    ravOperadora: 20,
    valorCliente: 3200,
    taxaServico: 0,
    ravClienteModo: "via_operadora",
    status: "emitida",
  };
  const cancelada: ReservaValores = { ...ativa, valorTotal: 10000, valorCliente: 10500, status: "cancelada" };
  render(<TripSummary reservas={[ativa, cancelada]} repasseValor={0} despesas={0} />);

  expect(screen.getByText("R$ 3.200,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 3.000,00")).toBeInTheDocument();
  expect(screen.queryByText("R$ 13.700,00")).toBeNull();
  // receita da agência e resultado (sem repasse nem despesas) coincidem
  expect(screen.getAllByText("R$ 520,00")).toHaveLength(2);
});

test("reserva sem venda ao cliente não puxa a receita para negativo", () => {
  const r = somarReservas([
    {
      status: "pendente",
      valorTotal: 10000,
      valorComissao: 1000,
      ravOperadora: 0,
      valorCliente: null,
      taxaServico: 0,
      ravClienteModo: "via_operadora",
    },
    {
      status: "pendente",
      valorTotal: 2000,
      valorComissao: 200,
      ravOperadora: 0,
      valorCliente: 2000,
      taxaServico: 0,
      ravClienteModo: "retido_agencia",
    },
  ] as ReservaValores[]);
  expect(r.receitaPrevista).toBe(200);
  expect(r.incompleta).toBe(true);
});

test("reserva incompleta mostra '—' no resultado e aponta a primeira reserva sem total cobrado", () => {
  const completa: ReservaValores = {
    valorTotal: 1000,
    valorComissao: 100,
    ravOperadora: 0,
    valorCliente: 1000,
    taxaServico: 0,
    ravClienteModo: "retido_agencia",
  };
  const semVenda: ReservaValores = { ...completa, valorCliente: null };
  render(<TripSummary reservas={[completa, semVenda]} repasseValor={0} despesas={0} />);
  expect(screen.getByText("Preencha o total cobrado da Reserva 2")).toBeInTheDocument();
  expect(screen.getByTestId("resultado-viagem")).toHaveTextContent("—");
});

test("sem detalheReserva mostra a dica para abrir uma reserva", () => {
  render(<TripSummary reservas={[]} repasseValor={0} despesas={0} />);
  expect(screen.getByText("Abra uma reserva para ver o cálculo")).toBeInTheDocument();
});

test("renderiza detalheReserva e rodape quando passados", () => {
  render(
    <TripSummary
      reservas={[]}
      repasseValor={0}
      despesas={0}
      detalheReserva={<p>Reserva 1 · CVC</p>}
      rodape={<p>atalhos</p>}
    />,
  );
  expect(screen.getByText("Reserva 1 · CVC")).toBeInTheDocument();
  expect(screen.getByText("atalhos")).toBeInTheDocument();
  expect(screen.queryByText("Abra uma reserva para ver o cálculo")).toBeNull();
});

test("é um aside com nome 'Resumo da viagem'", () => {
  render(<TripSummary reservas={[]} repasseValor={0} despesas={0} />);
  expect(screen.getByRole("complementary", { name: "Resumo da viagem" })).toBeInTheDocument();
});

const TRES: ReservaValores[] = [
  {
    valorTotal: 10000,
    valorComissao: 1000,
    ravOperadora: 0,
    valorCliente: 10500,
    taxaServico: 150,
    ravClienteModo: "via_operadora",
  },
  {
    valorTotal: 5000,
    valorComissao: 250,
    ravOperadora: 0,
    valorCliente: 5000,
    taxaServico: 0,
    ravClienteModo: "via_operadora",
  },
  {
    valorTotal: 9999,
    valorComissao: 999,
    ravOperadora: 0,
    valorCliente: 9999,
    taxaServico: 0,
    ravClienteModo: "via_operadora",
    status: "cancelada",
  },
];

test("somarReservas devolve total da comissão e comissão média ponderada", () => {
  const r = somarReservas(TRES);
  expect(r.totalComissao).toBe(1750);
  expect(r.comissaoMedia).toBe(8.33); // 1250 / 15000
});

test("comissaoMedia é null sem total", () => {
  expect(comissaoMedia([])).toBeNull();
  expect(comissaoMedia([{ valorTotal: 0, valorComissao: 0 }])).toBeNull();
});

test("rótulos da faixa do formulário", () => {
  render(<TripSummary reservas={TRES} repasseValor={0} despesas={0} />);
  for (const rotulo of [
    "Total cobrado",
    "Custo das reservas",
    "Receita da agência",
    "Comissão do vendedor",
    "Despesas da viagem",
  ])
    expect(screen.getByText(rotulo)).toBeInTheDocument();
  expect(screen.getByText(/^Resultado da viagem/)).toBeInTheDocument();
  expect(screen.getByText("comissão média 8,33 %")).toBeInTheDocument();
});
