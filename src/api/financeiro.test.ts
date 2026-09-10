import { qsDespesas } from "./despesas";
import { qsConciliacao } from "./financeiro";

test("qsConciliacao omite o que não foi filtrado", () => {
  expect(qsConciliacao({ aba: "atrasadas", fornecedorId: "x" })).toBe("aba=atrasadas&fornecedorId=x");
});

test("qsConciliacao sem filtros gera string vazia", () => {
  expect(qsConciliacao({})).toBe("");
});

test("qsDespesas manda booleano só quando verdadeiro", () => {
  expect(qsDespesas({ mes: "2026-04", soVinculadas: true })).toBe("mes=2026-04&soVinculadas=true");
  expect(qsDespesas({ mes: "2026-04", soVinculadas: false })).toBe("mes=2026-04");
});

test("qsDespesas repassa paginação e situação", () => {
  expect(qsDespesas({ situacao: "vencida", pagina: 2, tamanho: 50 })).toBe("situacao=vencida&pagina=2&tamanho=50");
});
