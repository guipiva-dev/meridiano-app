import { conferirDatas } from "./conferirDatas";

const viagem = { ida: "2026-10-01", volta: "2026-10-15" };

test("dentro da viagem não avisa", () => {
  expect(conferirDatas({ inicio: "2026-10-02T10:00", fim: "2026-10-14T12:00" }, viagem, "hospedagem")).toEqual([]);
});

test("mesmo dia da ida e da volta não avisa (ignora hora)", () => {
  expect(conferirDatas({ inicio: "2026-10-01T00:30", fim: "2026-10-15T23:59" }, viagem, "aereo")).toEqual([]);
});

test("antes da ida", () => {
  expect(conferirDatas({ inicio: "2026-09-30T22:00", fim: null }, viagem, "aereo")).toEqual([
    "Saída 30/09 é antes da ida da viagem (01/10)",
  ]);
});

test("depois da volta", () => {
  expect(conferirDatas({ inicio: "2026-10-10T14:00", fim: "2026-10-16T12:00" }, viagem, "hospedagem")).toEqual([
    "Check-out 16/10 é depois da volta da viagem (15/10)",
  ]);
});

test("início depois da volta e fim antes da ida usam rótulo genérico", () => {
  expect(conferirDatas({ inicio: "2026-10-20T10:00", fim: "2026-09-01T10:00" }, viagem, "seguro")).toEqual([
    "Início 20/10 é depois da volta da viagem (15/10)",
    "Fim 01/09 é antes da ida da viagem (01/10)",
  ]);
});

test("datas ausentes não avisam", () => {
  expect(conferirDatas({ inicio: null, fim: null }, viagem, "aereo")).toEqual([]);
  expect(conferirDatas({ inicio: "2026-09-01T10:00", fim: null }, { ida: null, volta: null }, "aereo")).toEqual([]);
  expect(conferirDatas({ inicio: "2026-12-01T10:00", fim: null }, { ida: "2026-10-01", volta: null }, "aereo")).toEqual(
    [],
  );
});
