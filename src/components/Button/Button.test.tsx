import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

test("variant vira classe, nunca estilo inline", () => {
  render(<Button variant="business">Salvar viagem</Button>);
  const b = screen.getByRole("button", { name: "Salvar viagem" });
  expect(b.className).toContain("business");
  expect(b.getAttribute("style")).toBeNull();
});

test("loading desabilita e anuncia", () => {
  render(
    <Button variant="primary" loading>
      Salvando…
    </Button>,
  );
  const b = screen.getByRole("button");
  expect(b).toBeDisabled();
  expect(b).toHaveAttribute("aria-busy", "true");
});
