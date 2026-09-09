import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useNavigate } from "react-router";
import { Page } from "./Page";

function Tela() {
  const nav = useNavigate();
  return (
    <Page dirty titulo="Viagem 123">
      <button type="button" onClick={() => void nav("/b")}>
        ir para B
      </button>
    </Page>
  );
}

function montar() {
  const router = createMemoryRouter(
    [
      { path: "/a", element: <Tela /> },
      { path: "/b", element: <p>B</p> },
    ],
    { initialEntries: ["/a"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

test("navegar com dirty abre o modal; continuar editando fecha sem navegar", async () => {
  const user = userEvent.setup();
  const router = montar();
  await user.click(screen.getByRole("button", { name: "ir para B" }));
  expect(await screen.findByRole("dialog", { name: "Sair sem salvar?" })).toBeInTheDocument();
  expect(screen.getByText(/Viagem 123/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Continuar editando" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(router.state.location.pathname).toBe("/a");
});

function TelaComSalvar({ onSalvarESair }: { onSalvarESair: () => Promise<boolean> }) {
  const nav = useNavigate();
  return (
    <Page dirty titulo="Viagem 123" onSalvarESair={onSalvarESair}>
      <button type="button" onClick={() => void nav("/b")}>
        ir para B
      </button>
    </Page>
  );
}

function montarComSalvar(onSalvarESair: () => Promise<boolean>) {
  const router = createMemoryRouter(
    [
      { path: "/a", element: <TelaComSalvar onSalvarESair={onSalvarESair} /> },
      { path: "/b", element: <p>B</p> },
    ],
    { initialEntries: ["/a"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

test("com onSalvarESair, modal tem 3 botões; Salvar e sair chama o callback e navega quando resolve true", async () => {
  const user = userEvent.setup();
  const onSalvarESair = vi.fn().mockResolvedValue(true);
  const router = montarComSalvar(onSalvarESair);
  await user.click(screen.getByRole("button", { name: "ir para B" }));
  const dialog = await screen.findByRole("dialog", { name: "Sair sem salvar?" });
  const footer = dialog.querySelector("footer");
  if (!footer) throw new Error("modal sem footer");
  expect(within(footer).getAllByRole("button")).toHaveLength(3);
  await user.click(within(footer).getByRole("button", { name: "Salvar e sair" }));
  expect(onSalvarESair).toHaveBeenCalledTimes(1);
  await waitFor(() => {
    expect(router.state.location.pathname).toBe("/b");
  });
});

test("Salvar e sair não navega quando o callback resolve false", async () => {
  const user = userEvent.setup();
  const onSalvarESair = vi.fn().mockResolvedValue(false);
  const router = montarComSalvar(onSalvarESair);
  await user.click(screen.getByRole("button", { name: "ir para B" }));
  const dialog = await screen.findByRole("dialog", { name: "Sair sem salvar?" });
  const footer = dialog.querySelector("footer");
  if (!footer) throw new Error("modal sem footer");
  await user.click(within(footer).getByRole("button", { name: "Salvar e sair" }));
  expect(onSalvarESair).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/a");
});
