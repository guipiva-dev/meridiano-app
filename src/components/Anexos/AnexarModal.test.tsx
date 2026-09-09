import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReservaDto } from "@/api/viagens";
import { AnexarModal } from "./AnexarModal";

const RESERVAS = [{ id: "r1", fornecedorNome: "CVC Operadora" }] as unknown as ReservaDto[];

const chamadas: string[] = [];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function arquivoDe(nome: string, bytes: number): File {
  const f = new File(["x"], nome, { type: "application/pdf" });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

function montar(onEnviado = () => undefined) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AnexarModal open viagemId="v1" reservas={RESERVAS} onClose={() => undefined} onEnviado={onEnviado} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push(`${init?.method ?? "GET"} ${url}`);
    if (url.endsWith("/anexos")) {
      return Promise.resolve(resposta(201, { anexo: { id: "a9" }, urlUpload: "https://r2/upload/a9" }));
    }
    return Promise.resolve(resposta(200, {}));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("arquivo acima de 25 MB vira erro de campo e não chama a API", async () => {
  montar();
  fireEvent.change(screen.getByLabelText(/Arquivo/), {
    target: { files: [arquivoDe("grande.pdf", 26 * 1024 * 1024)] },
  });

  fireEvent.click(screen.getByRole("button", { name: "Anexar" }));

  expect(await screen.findByText("Arquivo maior que 25 MB. Envie uma versão menor.")).toBeInTheDocument();
  expect(chamadas).toEqual([]);
});

test("fluxo feliz: iniciar → PUT na urlUpload → confirmar", async () => {
  const onEnviado = vi.fn();
  montar(onEnviado);
  fireEvent.change(screen.getByLabelText(/Arquivo/), { target: { files: [arquivoDe("voucher.pdf", 1024)] } });

  fireEvent.click(screen.getByRole("button", { name: "Anexar" }));

  await waitFor(() => {
    expect(onEnviado).toHaveBeenCalled();
  });
  expect(chamadas).toEqual(["POST /api/v1/anexos", "PUT https://r2/upload/a9", "POST /api/v1/anexos/a9/confirmar"]);
});
