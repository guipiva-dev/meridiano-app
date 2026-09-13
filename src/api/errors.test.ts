import { ApiError, ConflictError, erroDeResposta, mensagemDeErro, NetworkError, ValidationError } from "./errors";

test("5xx sem detalhe (corpo vazio/não-JSON) vira mensagem genérica de servidor com o status", () => {
  expect(mensagemDeErro(erroDeResposta(502, null))).toBe(
    "O servidor não respondeu (erro 502). Tente de novo em instantes.",
  );
  expect(mensagemDeErro(erroDeResposta(500, null))).toBe(
    "O servidor não respondeu (erro 500). Tente de novo em instantes.",
  );
});

test("5xx com detail específico do ProblemDetails mantém esse detail (não é 'silêncio', já é claro)", () => {
  expect(mensagemDeErro(new ApiError(500, "erro", "Falha ao excluir"))).toBe("Falha ao excluir");
});

test("erro de rede vira 'Sem conexão com o servidor.'", () => {
  expect(mensagemDeErro(new NetworkError())).toBe("Sem conexão com o servidor.");
});

test("422 usa o detail do ProblemDetails", () => {
  expect(mensagemDeErro(new ValidationError(422, "valor_invalido", "Valor inválido"))).toBe("Valor inválido");
});

test("409 e demais tipos conhecidos mantêm suas mensagens próprias", () => {
  expect(mensagemDeErro(new ConflictError(409, "conflito", "Alguém alterou"))).toBe(
    "Alguém alterou este registro enquanto você editava. Recarregue e tente de novo.",
  );
});
