import { render, screen } from "@testing-library/react";
import type { EventoAuditoriaDto } from "@/api/auditoria";
import { DetalhesEventoModal } from "./DetalhesEventoModal";

function evento(alteracoes: EventoAuditoriaDto["alteracoes"]): EventoAuditoriaDto {
  return {
    id: 1,
    tabela: "reserva",
    registroId: "r1",
    acao: "UPDATE",
    titulo: "Valores da reserva alterados",
    subtitulo: null,
    alteracoes,
    motivo: null,
    usuarioNome: "Guilherme",
    criadoEm: new Date().toISOString(),
  };
}

test("valor monetário formatado em De/Para", () => {
  render(<DetalhesEventoModal evento={evento({ valor_comissao: { de: 1000, para: 1100 } })} onClose={vi.fn()} />);
  expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 1.100,00")).toBeInTheDocument();
});

test("booleano vira Sim/Não", () => {
  render(<DetalhesEventoModal evento={evento({ emitida: { de: false, para: true } })} onClose={vi.fn()} />);
  expect(screen.getByText("Não")).toBeInTheDocument();
  expect(screen.getByText("Sim")).toBeInTheDocument();
});

test("null vira travessão", () => {
  render(<DetalhesEventoModal evento={evento({ observacao: { de: null, para: "ok" } })} onClose={vi.fn()} />);
  expect(screen.getByText("—")).toBeInTheDocument();
});

test("data ISO formatada", () => {
  render(
    <DetalhesEventoModal evento={evento({ validade: { de: "2026-04-01", para: "2026-05-01" } })} onClose={vi.fn()} />,
  );
  expect(screen.getByText("01/04/2026")).toBeInTheDocument();
  expect(screen.getByText("01/05/2026")).toBeInTheDocument();
});
