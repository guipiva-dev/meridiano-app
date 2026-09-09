import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { TipoServico } from "@/api/viagens";
import { ServiceChips } from "./ServiceChips";

function Harness() {
  const [v, setV] = useState<TipoServico[]>([]);
  return (
    <>
      <ServiceChips value={v} onChange={setV} />
      <output>{v.join(",")}</output>
    </>
  );
}

test("renderiza 9 chips; clicar 'Seguro' adiciona e clicar de novo remove; aria-pressed reflete", async () => {
  const user = userEvent.setup();
  render(<Harness />);

  expect(screen.getAllByRole("button")).toHaveLength(9);

  const seguro = screen.getByRole("button", { name: "Seguro" });
  expect(seguro).toHaveAttribute("aria-pressed", "false");

  await user.click(seguro);
  expect(seguro).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("status")).toHaveTextContent("seguro");

  await user.click(seguro);
  expect(seguro).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("status")).toHaveTextContent("");
});
