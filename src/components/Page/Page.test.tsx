import { render, screen } from "@testing-library/react";
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
