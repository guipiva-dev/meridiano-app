import { act, render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useNavigate } from "react-router";
import { useBloqueioSaida } from "./useBloqueioSaida";

test("navegar com ativo bloqueia; cancelar reseta", async () => {
  let api!: ReturnType<typeof useBloqueioSaida> & { navigate: ReturnType<typeof useNavigate> };
  function A() {
    const bloqueio = useBloqueioSaida(true);
    api = { ...bloqueio, navigate: useNavigate() };
    return <p>A</p>;
  }
  const router = createMemoryRouter(
    [
      { path: "/a", element: <A /> },
      { path: "/b", element: <p>B</p> },
    ],
    { initialEntries: ["/a"] },
  );
  render(<RouterProvider router={router} />);
  await act(async () => {
    await api.navigate("/b");
  });
  expect(api.bloqueado).toBe(true);
  expect(router.state.location.pathname).toBe("/a");
  act(() => api.cancelar());
  expect(api.bloqueado).toBe(false);
});
