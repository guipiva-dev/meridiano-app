import { mensagemDaPendencia, montarLinkWhatsapp } from "./mensagemWhatsapp";

test("prefixa 55 e codifica o texto", () => {
  expect(montarLinkWhatsapp({ whatsapp: "(11) 98888-7777", texto: "Olá, Ana! 48 h & tal" })).toBe(
    "https://wa.me/5511988887777?text=Ol%C3%A1%2C%20Ana!%2048%20h%20%26%20tal",
  );
});

test("não duplica 55 quando o número já tem DDI (12–13 dígitos)", () => {
  expect(montarLinkWhatsapp({ whatsapp: "+55 11 98888-7777", texto: "x" })).toBe("https://wa.me/5511988887777?text=x");
  expect(montarLinkWhatsapp({ whatsapp: "551133334444", texto: "x" })).toBe("https://wa.me/551133334444?text=x");
  // DDD 55 sem DDI (11 dígitos) ainda recebe o 55.
  expect(montarLinkWhatsapp({ whatsapp: "55999998888", texto: "x" })).toBe("https://wa.me/5555999998888?text=x");
});

const base = {
  mensagemTipo: "checkin" as const,
  titularId: "c1",
  titularNome: "Carlos Mendes",
  titularWhatsapp: "11988887777",
  destino: "Lisboa",
  dataIda: "2026-10-05",
  dataVolta: "2026-10-15",
};

test("check-in: primeiro nome, destino e data dd/mm/aaaa", () => {
  expect(mensagemDaPendencia(base)).toEqual({
    texto:
      "Olá, Carlos! Sua viagem para Lisboa é em 05/10/2026. O check-in online costuma abrir 48 h antes do voo. Qualquer dúvida, estou à disposição.",
    resumo: "Mensagem de check-in enviada pelo sistema",
  });
});

test("pós-viagem", () => {
  expect(mensagemDaPendencia({ ...base, mensagemTipo: "posviagem" as const })).toEqual({
    texto: "Olá, Carlos! Que bom ter você de volta de Lisboa. Como foi a viagem? Sua opinião nos ajuda muito.",
    resumo: "Mensagem de pós-viagem enviada pelo sistema",
  });
});

test("sem mensagemTipo (manual, recompra ou sem permissão) não há mensagem, mesmo com título de check-in", () => {
  expect(mensagemDaPendencia({ ...base, mensagemTipo: null })).toBeNull();
  expect(mensagemDaPendencia({ ...base, mensagemTipo: undefined })).toBeNull();
});
