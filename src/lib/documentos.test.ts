import {
  cnpjValido,
  cpfValido,
  formatarCnpj,
  formatarCpf,
  formatarTelefone,
  siteValido,
  situacaoValidade,
  somenteDigitos,
  telefoneValido,
  UFS,
} from "./documentos";

test("UFS tem as 27 unidades federativas", () => {
  expect(UFS.length).toBe(27);
});

test("somenteDigitos remove tudo que não é dígito", () => {
  expect(somenteDigitos("123.456.789-01")).toBe("12345678901");
});

test("formatarCpf formata 11 dígitos", () => {
  expect(formatarCpf("12345678901")).toBe("123.456.789-01");
});

test("formatarCpf vazio devolve string vazia", () => {
  expect(formatarCpf("")).toBe("");
  expect(formatarCpf(null)).toBe("");
  expect(formatarCpf(undefined)).toBe("");
});

test("formatarCnpj formata 14 dígitos", () => {
  expect(formatarCnpj("12345678000190")).toBe("12.345.678/0001-90");
});

test("formatarTelefone formata celular (11 dígitos)", () => {
  expect(formatarTelefone("11998765678")).toBe("(11) 99876-5678");
});

test("formatarTelefone formata fixo (10 dígitos)", () => {
  expect(formatarTelefone("1130039282")).toBe("(11) 3003-9282");
});

test("formatarTelefone devolve como está quando não bate 10 nem 11 dígitos", () => {
  expect(formatarTelefone("123")).toBe("123");
});

test("situacaoValidade sem dias", () => {
  expect(situacaoValidade(null)).toEqual({ texto: "—", tone: "neutral" });
});

test("situacaoValidade negativo: vencido", () => {
  expect(situacaoValidade(-3)).toEqual({ texto: "vencido há 3 dias", tone: "danger" });
});

test("situacaoValidade <= 180 dias: warning", () => {
  expect(situacaoValidade(32).tone).toBe("warning");
  expect(situacaoValidade(180).tone).toBe("warning");
});

test("situacaoValidade > 180 dias: neutral", () => {
  expect(situacaoValidade(181).tone).toBe("neutral");
});

test("cpfValido aceita CPF com dígitos verificadores corretos", () => {
  expect(cpfValido("529.982.247-25")).toBe(true);
});

test("cpfValido rejeita dígito verificador errado", () => {
  expect(cpfValido("123.456.789-00")).toBe(false);
});

test("cpfValido rejeita sequência repetida", () => {
  expect(cpfValido("111.111.111-11")).toBe(false);
});

test("cpfValido rejeita tamanho errado e valores vazios", () => {
  expect(cpfValido("123")).toBe(false);
  expect(cpfValido("")).toBe(false);
  expect(cpfValido(null)).toBe(false);
  expect(cpfValido(undefined)).toBe(false);
});

test("cnpjValido aceita CNPJ com dígitos verificadores corretos", () => {
  expect(cnpjValido("11.222.333/0001-81")).toBe(true);
});

test("cnpjValido rejeita dígito verificador errado", () => {
  expect(cnpjValido("12.345.678/0001-00")).toBe(false);
});

test("cnpjValido rejeita sequência repetida", () => {
  expect(cnpjValido("11.111.111/1111-11")).toBe(false);
});

test("telefoneValido aceita dígitos, espaços, parênteses, + . e - com pelo menos 10 caracteres", () => {
  expect(telefoneValido("(11) 99876-5678")).toBe(true);
  expect(telefoneValido("+55 11 998765678")).toBe(true);
});

test("telefoneValido faz trim antes de validar", () => {
  expect(telefoneValido("  (11) 99876-5678  ")).toBe(true);
});

test("telefoneValido rejeita letras", () => {
  expect(telefoneValido("11a998765678")).toBe(false);
});

test("telefoneValido rejeita menos de 10 caracteres", () => {
  expect(telefoneValido("123456789")).toBe(false);
});

test("telefoneValido rejeita vazio e valores nulos", () => {
  expect(telefoneValido("")).toBe(false);
  expect(telefoneValido(null)).toBe(false);
  expect(telefoneValido(undefined)).toBe(false);
});

test("siteValido aceita URL com esquema http/https", () => {
  expect(siteValido("https://exemplo.com.br")).toBe(true);
  expect(siteValido("http://exemplo.com")).toBe(true);
});

test("siteValido aceita domínio simples sem esquema (mesma tolerância do back)", () => {
  expect(siteValido("exemplo.com.br")).toBe(true);
});

test("siteValido rejeita esquema que não é http/https", () => {
  expect(siteValido("ftp://exemplo.com")).toBe(false);
});

test("siteValido rejeita string sem domínio válido", () => {
  expect(siteValido("não é site")).toBe(false);
  expect(siteValido("exemplo")).toBe(false);
});

test("siteValido rejeita vazio e valores nulos", () => {
  expect(siteValido("")).toBe(false);
  expect(siteValido(null)).toBe(false);
  expect(siteValido(undefined)).toBe(false);
});
