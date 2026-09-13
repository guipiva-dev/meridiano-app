import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReservaDto } from "@/api/viagens";
import { AnexarModal } from "./AnexarModal";

const RESERVAS = [{ id: "r1", fornecedorNome: "CVC Operadora" }] as unknown as ReservaDto[];

const chamadas: string[] = [];
const corpos: unknown[] = [];

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
      <AnexarModal
        open
        escopo={{ viagemId: "v1", reservas: RESERVAS }}
        onClose={() => undefined}
        onEnviado={onEnviado}
      />
    </QueryClientProvider>,
  );
}

function montarPessoa() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AnexarModal open escopo={{ clienteId: "c1" }} onClose={() => undefined} onEnviado={() => undefined} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chamadas.length = 0;
  corpos.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push(`${init?.method ?? "GET"} ${url}`);
    if (typeof init?.body === "string") corpos.push(JSON.parse(init.body));
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

test("escopo pessoa: sem Select de vínculo, sensível marcado e clienteId no payload", async () => {
  montarPessoa();
  expect(screen.queryByLabelText("Vínculo")).toBeNull();
  expect(screen.getByLabelText("Documento pessoal (sensível)")).toBeChecked();
  fireEvent.change(screen.getByLabelText(/Arquivo/), { target: { files: [arquivoDe("rg.pdf", 1024)] } });

  fireEvent.click(screen.getByRole("button", { name: "Anexar" }));

  await waitFor(() => {
    expect(corpos[0]).toMatchObject({ clienteId: "c1", sensivel: true });
  });
  expect((corpos[0] as { dataDescarte: string }).dataDescarte).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("campo Arquivo limita os tipos (accept) e .exe vira erro local sem chamar a API", async () => {
  montar();
  const input = screen.getByLabelText(/Arquivo/);
  expect(input).toHaveAttribute("accept", expect.stringContaining(".pdf"));
  expect(input.getAttribute("accept")).not.toContain(".exe");
  const exe = new File(["x"], "malware.exe", { type: "application/x-msdownload" });
  fireEvent.change(input, { target: { files: [exe] } });

  fireEvent.click(screen.getByRole("button", { name: "Anexar" }));

  expect(await screen.findByText("Tipo de arquivo não permitido (PDF, imagens, Office)")).toBeInTheDocument();
  expect(chamadas).toEqual([]);
});

test("422 tipo_arquivo_nao_permitido do iniciar vai para o campo Arquivo", async () => {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push(`${init?.method ?? "GET"} ${url}`);
    return Promise.resolve(
      resposta(422, { status: 422, codigo: "tipo_arquivo_nao_permitido", detail: "Tipo de arquivo não permitido" }),
    );
  });
  montar();
  const input = screen.getByLabelText(/Arquivo/);
  fireEvent.change(input, { target: { files: [arquivoDe("voucher.pdf", 1024)] } });

  fireEvent.click(screen.getByRole("button", { name: "Anexar" }));

  expect(await screen.findByText("Tipo de arquivo não permitido")).toBeInTheDocument();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(chamadas).toEqual(["POST /api/v1/anexos"]);
});

test("PUT falha: mensagem com o motivo e 'Tentar de novo' repete só o PUT e o confirmar", async () => {
  let putFalha = true;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push(`${init?.method ?? "GET"} ${url}`);
    if (url.endsWith("/anexos")) {
      return Promise.resolve(resposta(201, { anexo: { id: "a9" }, urlUpload: "https://r2/upload/a9" }));
    }
    if (init?.method === "PUT" && putFalha) return Promise.reject(new TypeError("Failed to fetch"));
    return Promise.resolve(resposta(200, {}));
  });
  const onEnviado = vi.fn();
  montar(onEnviado);
  fireEvent.change(screen.getByLabelText(/Arquivo/), { target: { files: [arquivoDe("voucher.pdf", 1024)] } });

  fireEvent.click(screen.getByRole("button", { name: "Anexar" }));

  expect(
    await screen.findByText("Não foi possível enviar o arquivo ao armazenamento (sem conexão com r2). Tente de novo."),
  ).toBeInTheDocument();
  expect(onEnviado).not.toHaveBeenCalled();
  expect(chamadas).toEqual(["POST /api/v1/anexos", "PUT https://r2/upload/a9"]);

  putFalha = false;
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

  await waitFor(() => {
    expect(onEnviado).toHaveBeenCalled();
  });
  expect(chamadas).toEqual([
    "POST /api/v1/anexos",
    "PUT https://r2/upload/a9",
    "PUT https://r2/upload/a9",
    "POST /api/v1/anexos/a9/confirmar",
  ]);
});

test("depois de 2 falhas de envio, a mensagem sugere contatar o suporte", async () => {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push(`${init?.method ?? "GET"} ${url}`);
    if (url.endsWith("/anexos")) {
      return Promise.resolve(resposta(201, { anexo: { id: "a9" }, urlUpload: "https://r2/upload/a9" }));
    }
    if (init?.method === "PUT") return Promise.reject(new TypeError("Failed to fetch"));
    return Promise.resolve(resposta(200, {}));
  });
  montar();
  fireEvent.change(screen.getByLabelText(/Arquivo/), { target: { files: [arquivoDe("voucher.pdf", 1024)] } });

  fireEvent.click(screen.getByRole("button", { name: "Anexar" }));
  await screen.findByText(/sem conexão com r2/);
  expect(screen.queryByText(/fale com o suporte/)).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

  expect(await screen.findByText(/fale com o suporte/)).toBeInTheDocument();
});
