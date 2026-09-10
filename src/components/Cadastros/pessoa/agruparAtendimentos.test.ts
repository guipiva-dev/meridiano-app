import type { AtendimentoDto } from "@/api/clientes";
import { agruparAtendimentos } from "./agruparAtendimentos";

// O agrupamento é por mês LOCAL; sem fuso fixo o caso da virada do mês seria não determinístico.
// O worker do vitest é reaproveitado entre arquivos, então o fuso volta ao original no fim.
const TZ_ORIGINAL = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});

afterAll(() => {
  if (TZ_ORIGINAL === undefined) delete process.env.TZ;
  else process.env.TZ = TZ_ORIGINAL;
});

function at(id: string, ocorridoEm: string): AtendimentoDto {
  return { id, versao: "1", canal: "whatsapp", resumo: `resumo ${id}`, ocorridoEm, usuarioId: null, usuarioNome: null };
}

const HOJE = new Date("2026-04-20T12:00:00Z");

test("mês do ano corrente vira um grupo aberto; ano anterior vira um grupo recolhido", () => {
  const grupos = agruparAtendimentos(
    [at("a1", "2026-04-18T10:00:00Z"), at("a2", "2026-04-02T09:00:00Z"), at("a3", "2025-11-03T08:00:00Z")],
    HOJE,
  );

  expect(grupos).toHaveLength(2);
  expect(grupos[0]).toMatchObject({ chave: "2026-04", titulo: "Abril de 2026", recolhido: false });
  expect(grupos[0]?.itens.map((i) => i.id)).toEqual(["a1", "a2"]);
  expect(grupos[1]).toMatchObject({ chave: "2025", titulo: "2025", recolhido: true });
  expect(grupos[1]?.itens.map((i) => i.id)).toEqual(["a3"]);
});

test("meses diferentes do ano corrente ficam em grupos separados", () => {
  const grupos = agruparAtendimentos([at("a1", "2026-04-18T10:00:00Z"), at("a2", "2026-03-30T09:00:00Z")], HOJE);

  expect(grupos.map((g) => g.titulo)).toEqual(["Abril de 2026", "Março de 2026"]);
});

test("virada do mês fica no mês local, não no do UTC", () => {
  // 30/04 23:30 BRT = 01/05 02:30 UTC: o fatiamento do ISO cairia em maio.
  const grupos = agruparAtendimentos([at("a1", "2026-04-30T23:30:00-03:00")], HOJE);

  expect(grupos).toHaveLength(1);
  expect(grupos[0]).toMatchObject({ chave: "2026-04", titulo: "Abril de 2026" });
});

test("lista vazia não gera grupo", () => {
  expect(agruparAtendimentos([], HOJE)).toEqual([]);
});
