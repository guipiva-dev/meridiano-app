import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Paginacao } from "./Paginacao";

test("mostra a faixa da página 1 e desabilita Anterior", () => {
  render(<Paginacao pagina={1} tamanho={25} total={42} onPagina={vi.fn()} />);
  expect(screen.getByText("1–25 de 42")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Próxima/ })).toBeEnabled();
});

test("Próxima chama onPagina(2)", async () => {
  const onPagina = vi.fn();
  render(<Paginacao pagina={1} tamanho={25} total={42} onPagina={onPagina} />);
  await userEvent.click(screen.getByRole("button", { name: /Próxima/ }));
  expect(onPagina).toHaveBeenCalledWith(2);
});

test("última página mostra a faixa final e desabilita Próxima", () => {
  render(<Paginacao pagina={2} tamanho={25} total={42} onPagina={vi.fn()} />);
  expect(screen.getByText("26–42 de 42")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Próxima/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
});
