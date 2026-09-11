import { baixar } from "./download";

test("baixar cria um <a> com href/download, clica e remove", () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.getAttribute("href")).toBe("/x.csv");
    expect(this.download).toBe("x.csv");
    expect(this.rel).toBe("noopener");
    expect(document.body.contains(this)).toBe(true);
  });

  baixar("/x.csv", "x.csv");

  expect(click).toHaveBeenCalledTimes(1);
  expect(document.querySelector("a[href='/x.csv']")).toBeNull();
  click.mockRestore();
});
