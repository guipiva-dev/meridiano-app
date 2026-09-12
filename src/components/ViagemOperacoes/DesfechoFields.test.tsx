import { fireEvent, render, screen } from "@testing-library/react";
import { hojeIso } from "@/lib/datas";
import { DesfechoFields, type DesfechoValue } from "./DesfechoFields";

const passageiros = [{ clienteId: "c1", nome: "Carlos Mendes", titular: true }];

function credito(validade: string | null): DesfechoValue {
  return {
    desfecho: "credito",
    valorReembolso: null,
    comissaoMantida: false,
    credito: { valor: 100, validade, clienteId: "c1" },
  };
}

test("validade do crédito tem min = hoje", () => {
  render(<DesfechoFields value={credito(null)} onChange={vi.fn()} erros={{}} passageiros={passageiros} />);
  expect(screen.getByLabelText("Validade")).toHaveAttribute("min", hojeIso());
});

test("validade no passado mostra erro local", () => {
  render(<DesfechoFields value={credito("2020-01-01")} onChange={vi.fn()} erros={{}} passageiros={passageiros} />);
  expect(screen.getByText("Validade não pode estar no passado")).toBeInTheDocument();
});

test("validade hoje ou futura não mostra erro", () => {
  render(<DesfechoFields value={credito(hojeIso())} onChange={vi.fn()} erros={{}} passageiros={passageiros} />);
  expect(screen.queryByText("Validade não pode estar no passado")).toBeNull();
});

test("erro do servidor credito.validade aparece sob o campo", () => {
  render(
    <DesfechoFields
      value={credito(hojeIso())}
      onChange={vi.fn()}
      erros={{ "credito.validade": "Validade do crédito já passou" }}
      passageiros={passageiros}
    />,
  );
  expect(screen.getByText("Validade do crédito já passou")).toBeInTheDocument();
});

test("mudar a validade propaga onChange", () => {
  const onChange = vi.fn();
  render(<DesfechoFields value={credito(null)} onChange={onChange} erros={{}} passageiros={passageiros} />);
  fireEvent.change(screen.getByLabelText("Validade"), { target: { value: "2030-01-01" } });
  expect(onChange).toHaveBeenCalledWith({ ...credito("2030-01-01") });
});
