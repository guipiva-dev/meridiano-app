import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { ConflictError, ValidationError } from "@/api/errors";
import { useFormularioCadastro } from "./useFormularioCadastro";

interface FormTeste {
  nome: string;
}
interface DtoTeste {
  id: string;
  versao: string;
  nome: string;
}

function montar(opts: {
  id?: string;
  carregar?: (id: string) => Promise<DtoTeste>;
  criar?: (req: unknown) => Promise<DtoTeste>;
  atualizar?: (id: string, req: unknown) => Promise<DtoTeste>;
}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, createElement(MemoryRouter, null, children));
  const carregar = opts.carregar ?? (() => Promise.reject(new Error("não usado")));
  const criar = opts.criar ?? (() => Promise.reject(new Error("não usado")));
  const atualizar = opts.atualizar ?? (() => Promise.reject(new Error("não usado")));
  const resultado = renderHook(
    () =>
      useFormularioCadastro<FormTeste, DtoTeste>({
        id: opts.id,
        carregar,
        chave: (id) => ["teste", id] as const,
        chaveLista: ["teste", "lista"],
        paraForm: (dto) => ({ nome: dto.nome }),
        paraRequest: (f, versao) => ({ nome: f.nome, versao }),
        criar,
        atualizar,
        rotaDepoisDeCriar: (dto) => `/teste/${dto.id}`,
        versaoDe: (dto) => dto.versao,
      }),
    { wrapper },
  );
  return { qc, ...resultado };
}

test("sem id: salvar() chama criar e navega", async () => {
  const criar = vi.fn().mockResolvedValue({ id: "novo", versao: "1", nome: "Ana" });
  const { result } = montar({ criar });

  act(() => {
    result.current.form.setValue("nome", "Ana");
  });

  let ok: boolean | undefined;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(true);
  expect(criar).toHaveBeenCalledWith({ nome: "Ana", versao: undefined });
});

test("com id: carrega, reseta o form e salvar() chama atualizar com a versão do dto", async () => {
  const carregar = vi.fn().mockResolvedValue({ id: "c1", versao: "7", nome: "Bia" });
  const atualizar = vi.fn().mockResolvedValue({ id: "c1", versao: "8", nome: "Bia Nova" });
  const { result } = montar({ id: "c1", carregar, atualizar });

  await waitFor(() => {
    expect(result.current.form.getValues("nome")).toBe("Bia");
  });

  act(() => {
    result.current.form.setValue("nome", "Bia Nova");
  });

  await act(async () => {
    await result.current.salvar();
  });

  expect(atualizar).toHaveBeenCalledWith("c1", { nome: "Bia Nova", versao: "7" });
});

test("409 na atualização vira conflito", async () => {
  const carregar = vi.fn().mockResolvedValue({ id: "c1", versao: "7", nome: "Bia" });
  const atualizar = vi.fn().mockRejectedValue(new ConflictError(409, "conflito", "Alguém alterou"));
  const { result } = montar({ id: "c1", carregar, atualizar });

  await waitFor(() => {
    expect(result.current.form.getValues("nome")).toBe("Bia");
  });

  await act(async () => {
    await result.current.salvar();
  });

  expect(result.current.conflito).toBe(true);
});

test("422 cpf_duplicado vira erro no campo cpf", async () => {
  const criar = vi.fn().mockRejectedValue(new ValidationError(422, "cpf_duplicado", "CPF já cadastrado"));
  const { result } = montar({ criar });

  await act(async () => {
    await result.current.salvar();
  });

  expect(result.current.erros.cpf).toBe("CPF já cadastrado");
});

test("criar invalida a lista e o detalhe do novo id (substitui o dto sintético pelo GET real)", async () => {
  const criar = vi.fn().mockResolvedValue({ id: "novo", versao: "", nome: "Ana" });
  const { qc, result } = montar({ criar });
  const invalidar = vi.spyOn(qc, "invalidateQueries");

  await act(async () => {
    await result.current.salvar();
  });

  expect(invalidar).toHaveBeenCalledWith({ queryKey: ["teste", "lista"] });
  expect(invalidar).toHaveBeenCalledWith({ queryKey: ["teste", "novo"] });
});

test("atualizar invalida a lista", async () => {
  const carregar = vi.fn().mockResolvedValue({ id: "c1", versao: "7", nome: "Bia" });
  const atualizar = vi.fn().mockResolvedValue({ id: "c1", versao: "8", nome: "Bia" });
  const { qc, result } = montar({ id: "c1", carregar, atualizar });
  await waitFor(() => {
    expect(result.current.form.getValues("nome")).toBe("Bia");
  });
  const invalidar = vi.spyOn(qc, "invalidateQueries");

  await act(async () => {
    await result.current.salvar();
  });

  expect(invalidar).toHaveBeenCalledWith({ queryKey: ["teste", "lista"] });
});
