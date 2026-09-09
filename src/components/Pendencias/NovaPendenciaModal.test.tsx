import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PassageiroDto, VendedorDto } from "@/api/viagens";
import { NovaPendenciaModal } from "./NovaPendenciaModal";

const PASSAGEIROS: PassageiroDto[] = [
  { clienteId: "c1", nome: "Carlos Mendes", titular: true },
  { clienteId: "c2", nome: "Lúcia Mendes", titular: false },
  { clienteId: "c3", nome: "Pedro Mendes", titular: false },
];
const VENDEDORES: VendedorDto[] = [
  { id: "u1", nome: "Guilherme", perfil: "dono", geraRepasse: false, percentualPadrao: 0 },
];

const chamadas: { url: string; method: string; body: unknown }[] = [];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <NovaPendenciaModal
        open
        viagemId="v1"
        passageiros={PASSAGEIROS}
        vendedores={VENDEDORES}
        onClose={() => undefined}
        onSalva={() => undefined}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      url,
      method: init?.method ?? "GET",
      body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
    });
    return Promise.resolve(resposta(201, []));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("selecionar 2 passageiros muda o botão e envia clienteIds com 2", async () => {
  montar();
  expect(screen.getByRole("button", { name: "Criar 1 pendência" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Carlos Mendes" }));
  fireEvent.click(screen.getByRole("button", { name: "Lúcia Mendes" }));
  fireEvent.change(screen.getByLabelText(/O que precisa ser feito/), { target: { value: "Enviar voucher" } });

  const criar = screen.getByRole("button", { name: "Criar 2 pendências" });
  fireEvent.click(criar);

  await waitFor(() => {
    const c = chamadas.find((x) => x.method === "POST");
    expect(c?.url).toContain("/viagens/v1/pendencias");
    expect((c?.body as { clienteIds: string[] }).clienteIds).toEqual(["c1", "c2"]);
  });
});

test("Enter no formulário salva: o botão é o submit do form (que é o do modal)", async () => {
  montar();
  const form = document.querySelector("form");
  const botao = screen.getByRole("button", { name: "Criar 1 pendência" });
  expect(botao).toHaveAttribute("type", "submit");
  expect(botao.getAttribute("form")).toBe(form?.id);

  fireEvent.change(screen.getByLabelText(/O que precisa ser feito/), { target: { value: "Enviar voucher" } });
  fireEvent.submit(form!);

  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "POST")).toBe(true);
  });
});

test("sem título mostra erro local e não chama a API", async () => {
  montar();

  fireEvent.click(screen.getByRole("button", { name: "Criar 1 pendência" }));

  expect(await screen.findByText("Descreva o que precisa ser feito")).toBeInTheDocument();
  expect(chamadas.some((c) => c.method === "POST")).toBe(false);
});
