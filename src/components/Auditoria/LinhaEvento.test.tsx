import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { EventoAuditoriaDto } from "@/api/auditoria";
import { LinhaEvento } from "./LinhaEvento";

function evento(over: Partial<EventoAuditoriaDto>): EventoAuditoriaDto {
  return {
    id: 1,
    tabela: "reserva",
    registroId: "r1",
    acao: "UPDATE",
    titulo: "Valores da reserva alterados",
    subtitulo: null,
    alteracoes: {},
    motivo: null,
    usuarioNome: "Guilherme",
    criadoEm: new Date().toISOString(),
    ...over,
  };
}

function montar(ev: EventoAuditoriaDto, onDetalhes = vi.fn()) {
  const router = createMemoryRouter([
    { path: "/", element: <LinhaEvento evento={ev} onDetalhes={onDetalhes} /> },
    { path: "/viagens/:id", element: <div /> },
  ]);
  render(<RouterProvider router={router} />);
}

test("título é prefixado pelo nome do usuário", () => {
  montar(evento({}));
  expect(screen.getByText(/Guilherme — Valores da reserva alterados/)).toBeInTheDocument();
});

test("mostra link da viagem quando há viagemId/codigoViagem", () => {
  montar(evento({ viagemId: "v1", codigoViagem: "VG-2026-0042" }));
  const link = screen.getByRole("link", { name: "VG-2026-0042" });
  expect(link).toHaveAttribute("href", "/viagens/v1");
});

test("Ver detalhes ausente quando não há alterações", () => {
  montar(evento({ alteracoes: {} }));
  expect(screen.queryByRole("button", { name: "Ver detalhes" })).toBeNull();
});

test("Ver detalhes presente quando há alterações", () => {
  montar(evento({ alteracoes: { valor_comissao: { de: 1000, para: 1100 } } }));
  expect(screen.getByRole("button", { name: "Ver detalhes" })).toBeInTheDocument();
});

test("evento de acesso usa o ícone de olho (via classe/role acessível não visual — checa pelo título)", () => {
  montar(
    evento({
      tabela: "log_acesso_documento",
      acao: "ACESSO",
      titulo: "Visualizou o passaporte de Lúcia Mendes",
      subtitulo: "documento sensível · LGPD",
      usuarioNome: "Ana Paula",
    }),
  );
  expect(screen.getByText(/Ana Paula — Visualizou o passaporte de Lúcia Mendes/)).toBeInTheDocument();
  expect(screen.getByText("documento sensível · LGPD")).toBeInTheDocument();
});
