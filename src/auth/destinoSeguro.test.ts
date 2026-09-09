import { destinoSeguro } from "./destinoSeguro";

test.each([
  ["//evil.com", "/"],
  ["https://evil.com", "/"],
  ["/\\evil.com", "/"],
  ["/\t/evil.com", "/"],
  ["/viagens/1", "/viagens/1"],
  [null, "/"],
])("destinoSeguro(%s) -> %s", (entrada, esperado) => {
  expect(destinoSeguro(entrada)).toBe(esperado);
});
