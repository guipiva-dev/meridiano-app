import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Quebra(): never {
  throw new Error("boom");
}

test("filho que lança mostra o fallback", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(
    <ErrorBoundary>
      <Quebra />
    </ErrorBoundary>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Algo deu errado.");
  expect(screen.getByRole("button", { name: "Recarregar" })).toBeInTheDocument();
  vi.restoreAllMocks();
});
