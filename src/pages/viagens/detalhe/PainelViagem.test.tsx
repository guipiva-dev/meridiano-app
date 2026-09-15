import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { PendenciaDto } from "@/api/pendencias";
import { VIAGEM } from "./fixtures";
import { PainelViagem } from "./PainelViagem";

const noop = vi.fn();

function pendencia(overrides: Partial<PendenciaDto>): PendenciaDto {
  return {
    id: "p1",
    versao: "1",
    titulo: "Enviar passaporte",
    descricao: null,
    dataPrevista: "2026-05-01",
    responsavelId: null,
    responsavelNome: null,
    clienteId: null,
    clienteNome: null,
    viagemId: "v1",
    codigoViagem: "VG-2026-0042",
    status: "aberta",
    origem: "manual",
    prioridade: "normal",
    adiadaDe: null,
    concluidaEm: null,
    atrasada: false,
    ...overrides,
  };
}

test("sem resumo, com verValores, mostra a faixa reduzida (Receita da agência, sem Resultado da viagem)", () => {
  render(
    <PainelViagem viagem={{ ...VIAGEM, resumo: undefined }} verValores={true} pendencias={[]} onVerPendencias={noop} />,
  );
  expect(screen.getByText("Receita da agência")).toBeInTheDocument();
  expect(screen.queryByText("Resultado da viagem")).toBeNull();
});

test("faixa completa: Receita recebida e Comissão do vendedor", () => {
  render(<PainelViagem viagem={VIAGEM} verValores={true} pendencias={[]} onVerPendencias={noop} />);
  expect(screen.getByText("Receita recebida")).toBeInTheDocument();
  expect(screen.getByText("Comissão do vendedor")).toBeInTheDocument();
  expect(screen.getByText(/Comissões, RAV e taxas que já entraram/)).toHaveAttribute("role", "tooltip");
});

test("faixa completa usa o vocabulário único, na ordem, com comissão média", () => {
  render(<PainelViagem viagem={VIAGEM} verValores={true} pendencias={[]} onVerPendencias={noop} />);
  const rotulos = screen.getAllByText(
    /^(Total cobrado|Custo das reservas|Receita da agência|Comissão do vendedor|Despesas da viagem|Resultado da viagem|Receita recebida)$/,
  );
  expect(rotulos.map((el) => el.childNodes[0]?.textContent)).toEqual([
    "Total cobrado",
    "Custo das reservas",
    "Receita da agência",
    "Comissão do vendedor",
    "Despesas da viagem",
    "Resultado da viagem",
    "Receita recebida",
  ]);
  expect(screen.getByText(/^comissão média \d+,?\d* %$/)).toBeInTheDocument();
});

test("U06: sem verValores (nem resumo), Receita da agência some junto com o resto da faixa", () => {
  render(
    <PainelViagem
      viagem={{ ...VIAGEM, resumo: undefined }}
      verValores={false}
      pendencias={[]}
      onVerPendencias={noop}
    />,
  );
  expect(screen.queryByText("Receita da agência")).toBeNull();
});

test("passageiro com cpf e dataNascimento mostra a linha secundária 'CPF · nasc. dd/mm/aaaa', badge Titular", () => {
  render(
    <PainelViagem
      viagem={{
        ...VIAGEM,
        passageiros: [
          { clienteId: "c1", nome: "Carlos Mendes", titular: true, cpf: "11144477735", dataNascimento: "1980-05-05" },
        ],
      }}
      verValores={true}
      pendencias={[]}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("111.444.777-35 · nasc. 05/05/1980")).toBeInTheDocument();
  expect(screen.getByText("Titular")).toBeInTheDocument();
});

test("passageiro sem cpf (sem ver_documento) mostra só a data de nascimento", () => {
  render(
    <PainelViagem
      viagem={{
        ...VIAGEM,
        passageiros: [{ clienteId: "c1", nome: "Carlos Mendes", titular: true, dataNascimento: "1980-05-05" }],
      }}
      verValores={true}
      pendencias={[]}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("nasc. 05/05/1980")).toBeInTheDocument();
});

test("passageiro sem cpf nem dataNascimento não mostra linha secundária", () => {
  render(
    <PainelViagem
      viagem={{ ...VIAGEM, passageiros: [{ clienteId: "c1", nome: "Carlos Mendes", titular: true }] }}
      verValores={true}
      pendencias={[]}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("Carlos Mendes")).toBeInTheDocument();
  expect(screen.queryByText(/nasc\./)).toBeNull();
});

test("P02: vendedor externo (sem resumo, sem verValores) vê 'Seu repasse' com valor e status", () => {
  render(
    <PainelViagem
      viagem={{
        ...VIAGEM,
        resumo: undefined,
        repasse: { id: "rp1", valor: 300, percentual: null, status: "bloqueado" },
      }}
      verValores={false}
      pendencias={[]}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("Seu repasse")).toBeInTheDocument();
  expect(screen.getByText("R$ 300,00")).toBeInTheDocument();
  expect(screen.getByText("Bloqueado")).toBeInTheDocument();
});

test("pendências: mostra só as 2 abertas mais próximas por dataPrevista", () => {
  render(
    <PainelViagem
      viagem={VIAGEM}
      verValores={true}
      pendencias={[
        pendencia({ id: "p1", titulo: "Enviar voucher", dataPrevista: "2026-06-01" }),
        pendencia({ id: "p2", titulo: "Confirmar hotel", dataPrevista: "2026-05-01" }),
        pendencia({ id: "p3", titulo: "Emitir bilhete", dataPrevista: "2026-04-01" }),
        pendencia({ id: "p4", titulo: "Concluída", dataPrevista: "2026-03-01", status: "concluida" }),
      ]}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("Emitir bilhete")).toBeInTheDocument();
  expect(screen.getByText("Confirmar hotel")).toBeInTheDocument();
  expect(screen.queryByText("Enviar voucher")).toBeNull();
  expect(screen.queryByText("Concluída")).toBeNull();
});

test("pendências: mostra mensagem vazia quando não há pendências abertas", () => {
  render(<PainelViagem viagem={VIAGEM} verValores={true} pendencias={[]} onVerPendencias={noop} />);
  expect(screen.getByText("Nenhuma pendência aberta nesta viagem.")).toBeInTheDocument();
});

test("pendências: botão Ver todas chama onVerPendencias", () => {
  const onVerPendencias = vi.fn();
  render(<PainelViagem viagem={VIAGEM} verValores={true} pendencias={[]} onVerPendencias={onVerPendencias} />);
  screen.getByRole("button", { name: "Ver todas" }).click();
  expect(onVerPendencias).toHaveBeenCalled();
});

test("raiz é complementary com nome 'Resumo da viagem'", () => {
  render(<PainelViagem viagem={VIAGEM} verValores={true} pendencias={[]} onVerPendencias={noop} />);
  expect(screen.getByRole("complementary", { name: "Resumo da viagem" })).toBeInTheDocument();
});
