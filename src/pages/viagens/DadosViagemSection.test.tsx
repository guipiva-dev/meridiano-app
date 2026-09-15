import { render, renderHook, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { DadosViagemSection } from "./DadosViagemSection";
import type { ViagemForm } from "./useNovaViagem";

function montar(valores: Partial<ViagemForm>, erros: Record<string, string> = {}) {
  const { result } = renderHook(() =>
    useForm<ViagemForm>({
      defaultValues: {
        destino: "",
        tipo: "internacional",
        dataIda: "",
        dataVolta: "",
        vendedorId: "",
        agenteId: "",
        ocasiao: "",
        observacoes: "",
        passageiros: [],
        repasseValor: null,
        repassePercentual: null,
        reservas: [],
        ...valores,
      },
    }),
  );
  render(
    <DadosViagemSection
      form={result.current}
      vendedores={[]}
      mostrarRepasse={false}
      repasseSugerido={null}
      repasseValorMostrado={null}
      onRepassePercentual={() => undefined}
      onRepasseValor={() => undefined}
      erros={erros}
      buscarClientes={() => Promise.resolve([])}
      onNovaPessoa={() => undefined}
    />,
  );
}

test("Ida e Volta são obrigatórias", () => {
  montar({});
  expect(screen.getByLabelText(/^Ida/)).toBeRequired();
  expect(screen.getByLabelText(/^Volta/)).toBeRequired();
});

test("mostra noites calculadas como texto quando as duas datas existem", () => {
  montar({ dataIda: "2026-10-13", dataVolta: "2026-10-25" });
  expect(screen.getByText("12 noites")).toBeInTheDocument();
});

test("erros de data aparecem nos campos", () => {
  montar({}, { dataIda: "Informe a data de ida", dataVolta: "Informe a data de volta" });
  expect(screen.getByLabelText(/^Ida/)).toHaveAccessibleDescription("Informe a data de ida");
  expect(screen.getByLabelText(/^Volta/)).toHaveAccessibleDescription("Informe a data de volta");
});
