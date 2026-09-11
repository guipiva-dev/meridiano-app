import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { hojeIso } from "@/lib/datas";
import { NovaVersaoRegraModal } from "./NovaVersaoRegraModal";

const chamadas: { metodo: string; url: string; body: unknown }[] = [];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function montar(onSalva = () => undefined) {
  render(<NovaVersaoRegraModal open fornecedorId="f1" onClose={() => undefined} onSalva={onSalva} />);
}

function preencher(janela: number, valores: [number, number, number, number]) {
  const rotulos = ["Dia inicial", "Dia final", "Dia do pagamento", "Meses à frente"];
  rotulos.forEach((rotulo, i) => {
    fireEvent.change(screen.getByLabelText(`${rotulo} da janela ${janela}`), {
      target: { value: String(valores[i]) },
    });
  });
}

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      metodo: init?.method ?? "GET",
      url,
      body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
    });
    return Promise.resolve(resposta(200, { id: "f1" }));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("duas janelas viram um POST de nova versão da regra", async () => {
  const onSalva = vi.fn();
  montar(onSalva);

  preencher(1, [1, 14, 20, 0]);
  fireEvent.click(screen.getByRole("button", { name: "+ Janela" }));
  preencher(2, [15, 31, 5, 1]);
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

  await waitFor(() => {
    expect(chamadas).toHaveLength(1);
  });
  expect(chamadas[0]?.metodo).toBe("POST");
  expect(chamadas[0]?.url).toBe("/api/v1/fornecedores/f1/regras");
  expect(chamadas[0]?.body).toEqual({
    vigenteDesde: hojeIso(),
    janelas: [
      { diaInicial: 1, diaFinal: 14, diaPagamento: 20, mesesAFrente: 0 },
      { diaInicial: 15, diaFinal: 31, diaPagamento: 5, mesesAFrente: 1 },
    ],
  });
  expect(onSalva).toHaveBeenCalled();
});

test("dia final menor que o inicial bloqueia antes de chamar a API", async () => {
  montar();

  preencher(1, [10, 5, 20, 0]);
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

  expect(await screen.findByText("Na janela 1, o dia final não pode ser menor que o dia inicial.")).toBeInTheDocument();
  expect(chamadas).toHaveLength(0);
});

test("janela sem dias preenchidos também é barrada localmente", async () => {
  montar();

  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

  expect(await screen.findByText("Na janela 1, preencha dias entre 1 e 31.")).toBeInTheDocument();
  expect(chamadas).toHaveLength(0);
});
