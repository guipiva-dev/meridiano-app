import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KpiCard } from "./KpiCard";

test("informativo não mostra botão", () => {
  render(<KpiCard label="Comissões a receber" value="R$ 4.200,00" contexto="8 viagens" />);
  expect(screen.getByText("Comissões a receber")).toBeInTheDocument();
  expect(screen.getByText("R$ 4.200,00")).toBeInTheDocument();
  expect(screen.getByText("8 viagens")).toBeInTheDocument();
  expect(screen.queryByRole("button")).toBeNull();
});

test("acionável mostra botão que chama onAction", async () => {
  const onAction = vi.fn();
  render(<KpiCard label="Comissão atrasada" value="R$ 900,00" actionLabel="Ver detalhes" onAction={onAction} />);
  await userEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
  expect(onAction).toHaveBeenCalled();
});
