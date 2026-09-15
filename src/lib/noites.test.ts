import { noites } from "./noites";

test("conta noites entre ida e volta", () => {
  expect(noites("2026-10-13", "2026-10-25")).toBe(12);
  expect(noites("2026-10-13", "2026-10-13")).toBe(0);
});

test("null com data vazia ou volta antes da ida", () => {
  expect(noites("", "2026-10-25")).toBeNull();
  expect(noites("2026-10-25", "2026-10-13")).toBeNull();
});

test("atravessa horário de verão sem erro de arredondamento", () => {
  expect(noites("2026-02-20", "2026-02-23")).toBe(3);
});
