import { render, screen } from "@testing-library/react";
import { Info } from "lucide-react";
import { Tooltip } from "./Tooltip";

test("trigger ícone-only ganha aria-label do texto do tooltip", () => {
  render(
    <Tooltip text="Como é calculado">
      <Info aria-hidden />
    </Tooltip>,
  );
  expect(screen.getByRole("button", { name: "Como é calculado" })).toBeInTheDocument();
});

test("trigger com texto visível não ganha aria-label redundante", () => {
  render(<Tooltip text="Como é calculado">Total</Tooltip>);
  expect(screen.getByRole("button", { name: "Total" })).toBeInTheDocument();
});
