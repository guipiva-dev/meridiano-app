import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("sem sessão cai no login", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
  window.history.pushState({}, "", "/");
  render(<App />);
  expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
});
