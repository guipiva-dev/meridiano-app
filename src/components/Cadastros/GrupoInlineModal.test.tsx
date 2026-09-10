import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GrupoInlineModal } from "./GrupoInlineModal";

const chamadas: { url: string; method: string; body: unknown }[] = [];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      url,
      method: init?.method ?? "GET",
      body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
    });
    return Promise.resolve(
      resposta(201, {
        id: "g1",
        versao: "1",
        nome: "Mendes",
        tipo: "familia",
        cnpj: null,
        observacoes: null,
        pessoas: [],
        viagens: 0,
      }),
    );
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("submit sem nome mostra erro de campo e não chama a API", async () => {
  const user = userEvent.setup();
  render(<GrupoInlineModal open onClose={vi.fn()} onCriado={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Criar" }));

  expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
  expect(chamadas).toHaveLength(0);
});

test("422 nome_obrigatorio do servidor cai no campo Nome (via errosDeCadastro)", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", () =>
    Promise.resolve({
      ok: false,
      status: 422,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ codigo: "nome_obrigatorio", detail: "Nome é obrigatório" }),
    } as unknown as Response),
  );
  render(<GrupoInlineModal open onClose={vi.fn()} onCriado={vi.fn()} />);

  // Digita um espaço para passar da validação local (client-side) e forçar a ida ao servidor.
  await user.type(screen.getByLabelText(/Nome/), " a");
  await user.click(screen.getByRole("button", { name: "Criar" }));

  const campoNome = await screen.findByLabelText(/Nome/);
  await waitFor(() => {
    expect(campoNome).toHaveAttribute("aria-invalid", "true");
  });
  expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
});

test("submit com nome chama POST /grupos e onCriado", async () => {
  const user = userEvent.setup();
  const onCriado = vi.fn();
  render(<GrupoInlineModal open onClose={vi.fn()} onCriado={onCriado} />);

  await user.type(screen.getByLabelText(/Nome/), "Mendes");
  await user.click(screen.getByRole("button", { name: "Criar" }));

  await waitFor(() => {
    expect(chamadas).toHaveLength(1);
  });
  expect(chamadas[0]?.url).toContain("/grupos");
  expect(chamadas[0]?.method).toBe("POST");
  expect((chamadas[0]?.body as { nome: string }).nome).toBe("Mendes");
  expect(onCriado).toHaveBeenCalledWith(expect.objectContaining({ id: "g1", nome: "Mendes" }));
});
