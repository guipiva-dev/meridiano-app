import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Select } from "./Select";

test("renderiza opções e encaminha ref", () => {
  const ref = createRef<HTMLSelectElement>();
  render(
    <Select
      ref={ref}
      aria-label="País"
      placeholder="Selecione"
      options={[
        { value: "br", label: "Brasil" },
        { value: "pt", label: "Portugal" },
      ]}
    />,
  );
  const select = screen.getByLabelText("País");
  expect(select).toBe(ref.current);
  expect(screen.getByRole("option", { name: "Brasil" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Selecione" })).toBeInTheDocument();
});
