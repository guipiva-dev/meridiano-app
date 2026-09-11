import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type BuscaDto, buscaApi } from "@/api/busca";
import { ViagemCombobox } from "./ViagemCombobox";

const resposta: BuscaDto = {
  clientes: [{ id: "c1", nome: "Carlos Mendes", telefone: null }],
  viagens: [
    {
      id: "v1",
      codigo: "VG-2026-0001",
      destino: "Lisboa",
      titular: "Carlos Mendes",
      dataIda: "2026-05-01",
      faseOperacional: "confirmada",
    },
  ],
  reservas: [{ reservaId: "r1", viagemId: "v1", codigo: "VG-2026-0001", localizador: "K7X2PQ", fornecedorNome: "CVC" }],
};

function stubFetch() {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(resposta), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("digitar busca em /busca e lista só as viagens", async () => {
  const user = userEvent.setup();
  const fetchMock = stubFetch();
  const onChange = vi.fn();
  render(<ViagemCombobox value={null} onChange={onChange} />);

  await user.type(screen.getByRole("combobox"), "Lisboa");

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/busca?q=Lisboa", expect.anything());
  });
  const opcoes = await screen.findAllByRole("option");
  expect(opcoes).toHaveLength(1);
  expect(opcoes[0]).toHaveTextContent("Carlos Mendes · Lisboa · VG-2026-0001");
  expect(screen.queryByText("K7X2PQ")).not.toBeInTheDocument();

  await user.click(opcoes[0]!);
  expect(onChange).toHaveBeenCalledWith({ id: "v1", rotulo: "Carlos Mendes · Lisboa · VG-2026-0001" });
});

test("com viagem escolhida mostra o rótulo e permite limpar", async () => {
  const user = userEvent.setup();
  stubFetch();
  const onChange = vi.fn();
  render(<ViagemCombobox value={{ id: "v1", rotulo: "Carlos · Lisboa · VG-2026-0001" }} onChange={onChange} />);

  expect(screen.getByText("Carlos · Lisboa · VG-2026-0001")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remover viagem" }));
  expect(onChange).toHaveBeenCalledWith(null);
});

test("resposta atrasada de busca anterior não sobrescreve as opções da busca atual", async () => {
  vi.useFakeTimers();
  const viagem = resposta.viagens[0]!;
  let resolverPrimeira: (r: BuscaDto) => void = () => undefined;
  vi.spyOn(buscaApi, "buscar")
    .mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolverPrimeira = res;
        }),
    )
    .mockResolvedValueOnce({ ...resposta, viagens: [{ ...viagem, id: "v2", destino: "Porto" }] });
  render(<ViagemCombobox value={null} onChange={vi.fn()} />);

  const input = screen.getByRole("combobox");
  fireEvent.change(input, { target: { value: "Lis" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  fireEvent.change(input, { target: { value: "Por" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  expect(screen.getByRole("option")).toHaveTextContent("Porto");

  // a primeira resposta chega depois da segunda: deve ser descartada
  await act(async () => {
    resolverPrimeira(resposta);
    await Promise.resolve();
  });

  expect(screen.getByRole("option")).toHaveTextContent("Porto");
  vi.useRealTimers();
});
