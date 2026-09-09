import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ViagemSemelhanteDto } from "@/api/viagens";
import { AvisoViagemSemelhante } from "./AvisoViagemSemelhante";

function item(overrides: Partial<ViagemSemelhanteDto> = {}): ViagemSemelhanteDto {
  return {
    id: "1",
    codigo: "VG-2026-0039",
    destino: "Porto",
    dataIda: "2026-04-18",
    dataVolta: "2026-04-28",
    faseOperacional: "em_emissao",
    sobrepoe: false,
    ...overrides,
  };
}

test("mesmo mês/ano: dd–dd/mm", () => {
  render(
    <AvisoViagemSemelhante
      item={item({ dataIda: "2026-04-18", dataVolta: "2026-04-28" })}
      titularNome="Carlos Mendes"
      onAdicionarNaExistente={vi.fn()}
      onAbrir={vi.fn()}
      onContinuar={vi.fn()}
    />,
  );
  expect(screen.getByText(/18–28\/04/)).toBeInTheDocument();
});

test("meses diferentes: dd/mm–dd/mm", () => {
  render(
    <AvisoViagemSemelhante
      item={item({ dataIda: "2026-04-28", dataVolta: "2026-05-03" })}
      titularNome="Carlos Mendes"
      onAdicionarNaExistente={vi.fn()}
      onAbrir={vi.fn()}
      onContinuar={vi.fn()}
    />,
  );
  expect(screen.getByText(/28\/04–03\/05/)).toBeInTheDocument();
});

test("uma data só: dd/mm; sem datas: omite", () => {
  const { rerender } = render(
    <AvisoViagemSemelhante
      item={item({ dataIda: "2026-04-18", dataVolta: null })}
      titularNome="Carlos Mendes"
      onAdicionarNaExistente={vi.fn()}
      onAbrir={vi.fn()}
      onContinuar={vi.fn()}
    />,
  );
  expect(screen.getByText(/18\/04/)).toBeInTheDocument();

  rerender(
    <AvisoViagemSemelhante
      item={item({ dataIda: null, dataVolta: null })}
      titularNome="Carlos Mendes"
      onAdicionarNaExistente={vi.fn()}
      onAbrir={vi.fn()}
      onContinuar={vi.fn()}
    />,
  );
  expect(screen.queryByText(/\d\d\/\d\d/)).toBeNull();
});

test("os três botões chamam seus callbacks", async () => {
  const user = userEvent.setup();
  const onAdicionarNaExistente = vi.fn();
  const onAbrir = vi.fn();
  const onContinuar = vi.fn();
  render(
    <AvisoViagemSemelhante
      item={item()}
      titularNome="Carlos Mendes"
      onAdicionarNaExistente={onAdicionarNaExistente}
      onAbrir={onAbrir}
      onContinuar={onContinuar}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Adicionar reserva à viagem existente" }));
  await user.click(screen.getByRole("button", { name: "Abrir viagem" }));
  await user.click(screen.getByRole("button", { name: "Continuar criando nova" }));

  expect(onAdicionarNaExistente).toHaveBeenCalledTimes(1);
  expect(onAbrir).toHaveBeenCalledTimes(1);
  expect(onContinuar).toHaveBeenCalledTimes(1);
});
