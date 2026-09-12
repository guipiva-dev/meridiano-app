import { ConflictError, ValidationError } from "@/api/errors";
import { errosDeCadastro } from "./mapaErrosCadastro";

test("422 fornecedor_duplicado (caminho normal: RegraDeNegocioException) mapeia para o campo nome", () => {
  const erro = new ValidationError(422, "fornecedor_duplicado", "Já existe um fornecedor com esse nome");
  expect(errosDeCadastro(erro)).toEqual({
    campos: { nome: "Já existe um fornecedor com esse nome" },
    bloco: null,
    conflito: false,
  });
});

test("422 grupo_duplicado (caminho normal: RegraDeNegocioException) mapeia para o campo nome", () => {
  const erro = new ValidationError(422, "grupo_duplicado", "Já existe um grupo com esse nome");
  expect(errosDeCadastro(erro)).toEqual({
    campos: { nome: "Já existe um grupo com esse nome" },
    bloco: null,
    conflito: false,
  });
});

test("409 fornecedor_duplicado/grupo_duplicado (corrida do índice único) também mapeia para o campo nome, sem banner de conflito", () => {
  const erroFornecedor = new ConflictError(409, "fornecedor_duplicado", "Já existe um fornecedor com esse nome");
  expect(errosDeCadastro(erroFornecedor)).toEqual({
    campos: { nome: "Já existe um fornecedor com esse nome" },
    bloco: null,
    conflito: false,
  });

  const erroGrupo = new ConflictError(409, "grupo_duplicado", "Já existe um grupo com esse nome");
  expect(errosDeCadastro(erroGrupo)).toEqual({
    campos: { nome: "Já existe um grupo com esse nome" },
    bloco: null,
    conflito: false,
  });
});

test("409 duplicado genérico (índice único, sem código específico) também mapeia para o campo nome", () => {
  const erro = new ConflictError(409, "duplicado", "Já existe um registro com esse nome");
  expect(errosDeCadastro(erro)).toEqual({
    campos: { nome: "Já existe um registro com esse nome" },
    bloco: null,
    conflito: false,
  });
});

test("outro 409 continua tratado como conflito de concorrência (xmin)", () => {
  const erro = new ConflictError(409, "versao_desatualizada", "Alguém alterou");
  expect(errosDeCadastro(erro)).toEqual({ campos: {}, bloco: null, conflito: true });
});

test("422 cpf_invalido continua mapeado para o campo cpf", () => {
  const erro = new ValidationError(422, "cpf_invalido", "CPF inválido");
  expect(errosDeCadastro(erro).campos).toEqual({ cpf: "CPF inválido" });
});

test("422 telefone_invalido mapeia para o campo telefone", () => {
  const erro = new ValidationError(422, "telefone_invalido", "Telefone inválido");
  expect(errosDeCadastro(erro).campos).toEqual({ telefone: "Telefone inválido" });
});
