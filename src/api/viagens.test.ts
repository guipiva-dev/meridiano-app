import { qsLista } from "./viagens";

test("qsLista repete a chave para array, omite undefined/vazio", () => {
  expect(qsLista({ aba: "todas", fornecedorId: ["a", "b"], q: "", pagina: 2 })).toBe(
    "aba=todas&fornecedorId=a&fornecedorId=b&pagina=2",
  );
});

test("qsLista sem filtros gera string vazia", () => {
  expect(qsLista({})).toBe("");
});
