import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentoModal } from "./DocumentoModal";

const chamadas: { url: string; method: string; body: unknown }[] = [];
let proxima: { status: number; body: unknown } = { status: 201, body: {} };

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/problem+json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function montar(onSalvo = () => undefined) {
  render(<DocumentoModal open clienteId="c1" onClose={() => undefined} onSalvo={onSalvo} />);
}

beforeEach(() => {
  chamadas.length = 0;
  proxima = { status: 201, body: {} };
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      url,
      method: init?.method ?? "GET",
      body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
    });
    return Promise.resolve(resposta(proxima.status, proxima.body));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("salvar envia tipo, número e datas", async () => {
  const onSalvo = vi.fn();
  montar(onSalvo);
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "passaporte" } });
  fireEvent.change(screen.getByLabelText("Número"), { target: { value: "FX123456" } });
  fireEvent.change(screen.getByLabelText("Emissão"), { target: { value: "2018-05-10" } });
  fireEvent.change(screen.getByLabelText("Validade"), { target: { value: "2026-05-22" } });
  fireEvent.change(screen.getByLabelText("País emissor"), { target: { value: "Brasil" } });

  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

  await waitFor(() => {
    expect(onSalvo).toHaveBeenCalled();
  });
  const c = chamadas[0];
  expect(c?.method).toBe("POST");
  expect(c?.url).toContain("/clientes/c1/documentos");
  expect(c?.body).toMatchObject({
    tipo: "passaporte",
    numero: "FX123456",
    emissao: "2018-05-10",
    validade: "2026-05-22",
    paisEmissor: "Brasil",
  });
});

test("422 validade_invalida vira erro no campo Validade", async () => {
  proxima = { status: 422, body: { codigo: "validade_invalida", detail: "Validade anterior à emissão" } };
  montar();
  fireEvent.change(screen.getByLabelText("Validade"), { target: { value: "2010-01-01" } });

  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

  expect(await screen.findByText("Validade anterior à emissão")).toBeInTheDocument();
});
