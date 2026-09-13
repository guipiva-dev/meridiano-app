import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as ClientesApi from "@/api/clientes";
import type { AtendimentoDto, AtendimentoRequest } from "@/api/clientes";
import { ApiError, NetworkError } from "@/api/errors";
import { AtendimentoModal } from "./AtendimentoModal";

const criarAtendimento = vi.fn<(id: string, a: AtendimentoRequest) => Promise<AtendimentoDto>>();
vi.mock("@/api/clientes", async (importOriginal) => {
  const mod = await importOriginal<typeof ClientesApi>();
  return {
    ...mod,
    clientesApi: {
      ...mod.clientesApi,
      criarAtendimento: (...args: Parameters<typeof criarAtendimento>) => criarAtendimento(...args),
    },
  };
});

afterEach(() => {
  criarAtendimento.mockReset();
});

test("502 do servidor (F01): Alert com a mensagem e o dialog continua aberto com os dados preenchidos", async () => {
  const user = userEvent.setup();
  criarAtendimento.mockRejectedValue(new ApiError(502, "erro", "Erro inesperado"));
  render(<AtendimentoModal open clienteId="c1" onClose={vi.fn()} onSalvo={vi.fn()} />);

  await user.type(screen.getByLabelText(/Resumo/), "Confirmou o embarque");
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "O servidor não respondeu (erro 502). Tente de novo em instantes.",
  );
  expect(screen.getByLabelText(/Resumo/)).toHaveValue("Confirmou o embarque");
});

test("erro de rede (F01): Alert com a mensagem e o dialog continua aberto", async () => {
  const user = userEvent.setup();
  criarAtendimento.mockRejectedValue(new NetworkError());
  render(<AtendimentoModal open clienteId="c1" onClose={vi.fn()} onSalvo={vi.fn()} />);

  await user.type(screen.getByLabelText(/Resumo/), "Confirmou o embarque");
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Sem conexão com o servidor.");
  expect(screen.getByLabelText(/Resumo/)).toHaveValue("Confirmou o embarque");
});
