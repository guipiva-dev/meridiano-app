import { UnauthenticatedError, ValidationError } from "./errors";
import { queryClient, registrarNaoAutenticado } from "./queryClient";

test("mutation com UnauthenticatedError aciona o handler registrado; 422 nao aciona", async () => {
  const handler = vi.fn();
  const unregister = registrarNaoAutenticado(handler);

  const mutacao401 = queryClient.getMutationCache().build(queryClient, {
    mutationFn: () => Promise.reject(new UnauthenticatedError(401, "nao_autenticado", "Sessão expirada")),
  });
  await mutacao401.execute(undefined).catch(() => undefined);
  expect(handler).toHaveBeenCalledTimes(1);

  const mutacao422 = queryClient.getMutationCache().build(queryClient, {
    mutationFn: () => Promise.reject(new ValidationError(422, "senha_curta", "Senha curta")),
  });
  await mutacao422.execute(undefined).catch(() => undefined);
  expect(handler).toHaveBeenCalledTimes(1);

  unregister();
});
