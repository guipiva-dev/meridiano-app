import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { FornecedorDto } from "@/api/viagens";
import { BookingFields } from "./BookingFields";
import { type ReservaForm, reservaVazia } from "./tipos";

const fornecedores: FornecedorDto[] = [
  { id: "f1", nome: "Decolar", tipo: "operadora", percentualComissaoPadrao: 10, prazoComissaoDias: 30, ativo: true },
];

function Harness() {
  const [v, setV] = useState<ReservaForm>(reservaVazia(0));
  return (
    <BookingFields
      value={v}
      onChange={(patch) => {
        setV((prev) => ({ ...prev, ...patch }));
      }}
      fornecedores={fornecedores}
      onNovoFornecedor={() => undefined}
      erros={{}}
    />
  );
}

test("A04: sair do campo Fornecedor sem escolher marca fornecedorTocado", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <BookingFields
      value={reservaVazia(0)}
      onChange={onChange}
      fornecedores={fornecedores}
      onNovoFornecedor={() => undefined}
      erros={{}}
    />,
  );
  await user.click(screen.getByLabelText("Fornecedor"));
  await user.tab();
  expect(onChange).toHaveBeenCalledWith({ fornecedorTocado: true });
});

test("escolher um fornecedor não perde o estado ao tocar o campo depois", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.selectOptions(screen.getByLabelText("Fornecedor"), "f1");
  await user.tab();
  expect(screen.getByLabelText("Fornecedor")).toHaveValue("f1");
});
