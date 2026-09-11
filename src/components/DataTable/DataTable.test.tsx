import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { type Coluna, DataTable, type Ordenacao } from "./DataTable";

interface Linha {
  id: string;
  nome: string;
  idade: number;
}

const linhas: Linha[] = [
  { id: "1", nome: "Ana", idade: 30 },
  { id: "2", nome: "Bruno", idade: 25 },
];

const colunas: Coluna<Linha>[] = [
  { id: "nome", titulo: "Nome", ordenavel: true, render: (l) => l.nome },
  { id: "idade", titulo: "Idade", alinhar: "right", render: (l) => l.idade },
];

test("renderiza colunas x linhas", () => {
  render(<DataTable colunas={colunas} linhas={linhas} chave={(l) => l.id} legenda="Pessoas" />);
  expect(screen.getByText("Ana")).toBeInTheDocument();
  expect(screen.getByText("Bruno")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2
});

test("clicar na linha chama onLinha", async () => {
  const onLinha = vi.fn();
  render(
    <DataTable
      colunas={colunas}
      linhas={linhas}
      chave={(l) => l.id}
      onLinha={onLinha}
      rotuloLinha={(l) => `Abrir ${l.nome}`}
      legenda="Pessoas"
    />,
  );
  await userEvent.click(screen.getByRole("row", { name: "Abrir Ana" }));
  expect(onLinha).toHaveBeenCalledWith(linhas[0]);
});

test("Enter na linha focada chama onLinha", async () => {
  const onLinha = vi.fn();
  render(
    <DataTable
      colunas={colunas}
      linhas={linhas}
      chave={(l) => l.id}
      onLinha={onLinha}
      rotuloLinha={(l) => `Abrir ${l.nome}`}
      legenda="Pessoas"
    />,
  );
  screen.getByRole("row", { name: "Abrir Bruno" }).focus();
  await userEvent.keyboard("{Enter}");
  expect(onLinha).toHaveBeenCalledWith(linhas[1]);
});

test("carregando não renderiza linhas", () => {
  render(<DataTable colunas={colunas} linhas={linhas} chave={(l) => l.id} carregando legenda="Pessoas" />);
  expect(screen.queryByText("Ana")).toBeNull();
});

test("linhas vazias mostra vazio", () => {
  render(
    <DataTable colunas={colunas} linhas={[]} chave={(l) => l.id} vazio={<span>Nada aqui</span>} legenda="Pessoas" />,
  );
  expect(screen.getByText("Nada aqui")).toBeInTheDocument();
});

function Ordenavel() {
  const [ordenacao, setOrdenacao] = useState<Ordenacao | undefined>(undefined);
  return (
    <DataTable
      colunas={colunas}
      linhas={linhas}
      chave={(l) => l.id}
      legenda="Pessoas"
      ordenacao={ordenacao}
      onOrdenar={setOrdenacao}
    />
  );
}

test("clicar em cabeçalho ordenável alterna asc/desc e reflete em aria-sort", async () => {
  render(<Ordenavel />);
  const botao = screen.getByRole("button", { name: "Nome" });
  await userEvent.click(botao);
  expect(screen.getByRole("columnheader", { name: /Nome/ })).toHaveAttribute("aria-sort", "ascending");
  await userEvent.click(botao);
  expect(screen.getByRole("columnheader", { name: /Nome/ })).toHaveAttribute("aria-sort", "descending");
});

test("Espaço na linha focada chama onLinha sem rolar a página", () => {
  const onLinha = vi.fn();
  render(
    <DataTable
      colunas={colunas}
      linhas={linhas}
      chave={(l) => l.id}
      onLinha={onLinha}
      rotuloLinha={(l) => `Abrir ${l.nome}`}
      legenda="Pessoas"
    />,
  );
  const evento = fireEvent.keyDown(screen.getByRole("row", { name: "Abrir Bruno" }), { key: " " });
  expect(evento).toBe(false); // preventDefault() foi chamado
  expect(onLinha).toHaveBeenCalledWith(linhas[1]);
});
