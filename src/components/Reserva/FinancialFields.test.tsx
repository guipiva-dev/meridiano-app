import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FinancialFields } from "./FinancialFields";
import { type ReservaForm, reservaVazia } from "./tipos";

function Harness() {
  const [v, setV] = useState<ReservaForm>(reservaVazia(0));
  return (
    <FinancialFields
      value={v}
      onChange={(patch) => {
        setV((prev) => ({ ...prev, ...patch }));
      }}
      percentualSugerido={10}
      erros={{}}
    />
  );
}

test("mostra 'Sugerido: 10 %' quando comissaoSugerida", () => {
  render(<Harness />);
  expect(screen.getByText("Sugerido: 10 %")).toBeInTheDocument();
});

test("digitar em Comissão emite comissaoSugerida: false e some o selo", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const input = screen.getByLabelText("Comissão");
  await user.click(input);
  await user.type(input, "300");
  expect(screen.queryByText("Sugerido: 10 %")).not.toBeInTheDocument();
});

test("Observações da reserva tem maxLength 2000", () => {
  render(<Harness />);
  expect(screen.getByLabelText("Observações")).toHaveAttribute("maxLength", "2000");
});

test("Comissão, Taxa de serviço e Fluxo têm tooltip explicando o cálculo com exemplo", () => {
  render(<Harness />);
  const tooltips = screen.getAllByTitle(/ex\.:/i);
  const rotulos = tooltips.map((el) => el.closest("label")?.textContent);
  expect(rotulos).toEqual(
    expect.arrayContaining([
      expect.stringContaining("Comissão"),
      expect.stringContaining("Taxa de serviço"),
      expect.stringContaining("Fluxo"),
    ]),
  );
  expect(tooltips).toHaveLength(3);
});
