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

test("422 telefone_emergencia_invalido mapeia para o campo telefoneEmergencia", () => {
  const erro = new ValidationError(422, "telefone_emergencia_invalido", "Telefone inválido");
  expect(errosDeCadastro(erro).campos).toEqual({ telefoneEmergencia: "Telefone inválido" });
});

test("422 numero_obrigatorio mapeia para o campo numero", () => {
  const erro = new ValidationError(422, "numero_obrigatorio", "Número é obrigatório");
  expect(errosDeCadastro(erro).campos).toEqual({ numero: "Número é obrigatório" });
});

test("422 site_invalido mapeia para o campo site", () => {
  const erro = new ValidationError(422, "site_invalido", "Site precisa ser um endereço http(s) válido");
  expect(errosDeCadastro(erro).campos).toEqual({ site: "Site precisa ser um endereço http(s) válido" });
});

test("422 whatsapp_invalido mapeia para o campo whatsapp", () => {
  const erro = new ValidationError(422, "whatsapp_invalido", "WhatsApp inválido");
  expect(errosDeCadastro(erro).campos).toEqual({ whatsapp: "WhatsApp inválido" });
});

test("422 texto_longo usa extensions.campo (código genérico, qualquer campo)", () => {
  const erro = new ValidationError(422, "texto_longo", "destino deve ter no máximo 120 caracteres", {
    campo: "destino",
  });
  expect(errosDeCadastro(erro).campos).toEqual({ destino: "destino deve ter no máximo 120 caracteres" });
});

test("422 texto_longo sem extensions.campo cai no erro de bloco", () => {
  const erro = new ValidationError(422, "texto_longo", "Campo muito longo");
  expect(errosDeCadastro(erro)).toEqual({ campos: {}, bloco: "Campo muito longo", conflito: false });
});
