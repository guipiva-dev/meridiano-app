import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { RESERVA_1, RESERVA_2, VIAGEM } from "./fixtures";
import { ResumoTab } from "./ResumoTab";

const noop = vi.fn();

test("sem resumo, com verValores, mostra a faixa reduzida (Receita da agência, sem Resultado da viagem)", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, resumo: undefined }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("Receita da agência")).toBeInTheDocument();
  expect(screen.queryByText("Resultado da viagem")).toBeNull();
});

test("o bloco Reservas conta só as ativas no título, mas mostra Ativas N · Total M quando há cancelada", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, reservas: [RESERVA_1, { ...RESERVA_2, status: "cancelada" }] }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText(/^Ativas 1 · Total 2 · clique para abrir/)).toBeInTheDocument();
});

test("sem cancelada, o bloco Reservas mostra só a contagem", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, reservas: [RESERVA_1, RESERVA_2] }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText(/^2 · clique para abrir/)).toBeInTheDocument();
});

test("faixa completa: Receita recebida e Comissão do vendedor", () => {
  render(<ResumoTab viagem={VIAGEM} verValores={true} pendencias={[]} onAbrirReserva={noop} onVerPendencias={noop} />);
  expect(screen.getByText("Receita recebida")).toBeInTheDocument();
  expect(screen.getByText("Comissão do vendedor")).toBeInTheDocument();
  expect(screen.getByText(/Comissões, RAV e taxas que já entraram/)).toHaveAttribute("role", "tooltip");
  expect(screen.queryByText(/Comissões recebidas|vendedora/)).toBeNull();
});

test("faixa completa usa o vocabulário único, na ordem, com comissão média", () => {
  render(<ResumoTab viagem={VIAGEM} verValores={true} pendencias={[]} onAbrirReserva={noop} onVerPendencias={noop} />);
  const rotulos = screen.getAllByText(
    /^(Total cobrado|Custo das reservas|Receita da agência|Comissão do vendedor|Despesas da viagem|Resultado da viagem)$/,
  );
  // primeiro nó do <small> é o rótulo; o tooltip vem depois
  expect(rotulos.map((el) => el.childNodes[0]?.textContent)).toEqual([
    "Total cobrado",
    "Custo das reservas",
    "Receita da agência",
    "Comissão do vendedor",
    "Despesas da viagem",
    "Resultado da viagem",
  ]);
  expect(screen.getByText("Receita da agência").parentElement).toHaveTextContent("R$ 2.000,00");
  expect(screen.getByText(/^comissão média \d+,?\d* %$/)).toBeInTheDocument();
});

test("faixa reduzida usa Total cobrado, Custo das reservas e Receita da agência", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, resumo: undefined }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  for (const rotulo of ["Total cobrado", "Custo das reservas", "Receita da agência"])
    expect(screen.getByText(rotulo)).toBeInTheDocument();
});

test("U06: sem verValores (nem resumo), Receita da agência some junto com o resto da faixa", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, resumo: undefined }}
      verValores={false}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.queryByText("Receita da agência")).toBeNull();
});

test("passageiro com cpf e dataNascimento mostra a linha secundária 'CPF · nasc. dd/mm/aaaa'", () => {
  render(
    <ResumoTab
      viagem={{
        ...VIAGEM,
        passageiros: [
          { clienteId: "c1", nome: "Carlos Mendes", titular: true, cpf: "11144477735", dataNascimento: "1980-05-05" },
        ],
      }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("111.444.777-35 · nasc. 05/05/1980")).toBeInTheDocument();
});

test("passageiro sem cpf (sem ver_documento) mostra só a data de nascimento", () => {
  render(
    <ResumoTab
      viagem={{
        ...VIAGEM,
        passageiros: [{ clienteId: "c1", nome: "Carlos Mendes", titular: true, dataNascimento: "1980-05-05" }],
      }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("nasc. 05/05/1980")).toBeInTheDocument();
});

test("passageiro sem cpf nem dataNascimento não mostra linha secundária", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, passageiros: [{ clienteId: "c1", nome: "Carlos Mendes", titular: true }] }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("Carlos Mendes")).toBeInTheDocument();
  expect(screen.queryByText(/nasc\./)).toBeNull();
});

test("P02: vendedor externo (sem resumo, sem verValores) vê 'Seu repasse' com valor e status", () => {
  render(
    <ResumoTab
      viagem={{
        ...VIAGEM,
        resumo: undefined,
        repasse: { id: "rp1", valor: 300, percentual: null, status: "bloqueado" },
      }}
      verValores={false}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("Seu repasse")).toBeInTheDocument();
  expect(screen.getByText("R$ 300,00")).toBeInTheDocument();
  expect(screen.getByText("Bloqueado")).toBeInTheDocument();
});
