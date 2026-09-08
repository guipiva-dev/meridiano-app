import { registrarAtalho, tratarTecla } from "./atalhos";

test("ctrl+s chama o último registrado e previne default", () => {
  const a = vi.fn();
  const b = vi.fn();
  registrarAtalho("ctrl+s", a);
  const solta = registrarAtalho("ctrl+s", b);
  const ev = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, cancelable: true });
  tratarTecla(ev);
  expect(b).toHaveBeenCalled();
  expect(a).not.toHaveBeenCalled();
  expect(ev.defaultPrevented).toBe(true);
  solta();
  tratarTecla(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, cancelable: true }));
  expect(a).toHaveBeenCalled();
});

test("escape sem ctrl", () => {
  const h = vi.fn();
  registrarAtalho("escape", h);
  tratarTecla(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(h).toHaveBeenCalled();
});
