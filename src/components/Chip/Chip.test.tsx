import { render, screen } from "@testing-library/react";
import { Chip } from "./Chip";
import s from "./Chip.module.css";

test("CSS module exporta .chip e .on (hover depende dessas classes)", () => {
  expect(s.chip).toBeTruthy();
  expect(s.on).toBeTruthy();
});

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
