import { itensSidebar, temPermissao } from "./navegacao";

// P01: o item de menu usa a mesma permissão que protege a rota (`fornecedor.ver`), senão o vendedor
// externo (só `viagem.ver_proprias`) veria o link e cairia num "Sem permissão" ao clicar.
test("Fornecedores exige fornecedor.ver, não viagem.ver", () => {
  const item = itensSidebar.find((i) => i.label === "Fornecedores");
  expect(item?.permission).toBe("fornecedor.ver");
});

test("temPermissao aceita permissão única ou lista (some)", () => {
  expect(temPermissao((p) => p === "a", "a")).toBe(true);
  expect(temPermissao((p) => p === "a", "b")).toBe(false);
  expect(temPermissao((p) => p === "a", ["b", "a"])).toBe(true);
  expect(temPermissao((p) => p === "a", ["b", "c"])).toBe(false);
});
