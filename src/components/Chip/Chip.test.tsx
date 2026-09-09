import { render, screen } from "@testing-library/react";
import { Chip } from "./Chip";

test("chip selecionado tem ✓ e aria-pressed", () => {
  render(
    <Chip selected onClick={() => undefined}>
      Aéreo
    </Chip>,
  );
  const b = screen.getByRole("button", { name: /Aéreo/ });
  expect(b).toHaveAttribute("aria-pressed", "true");
  expect(b).toHaveTextContent("✓");
});
