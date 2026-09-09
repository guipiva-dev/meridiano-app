import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Tabs } from "./Tabs";

function Harness() {
  const [a, setA] = useState("reservas");
  return (
    <Tabs
      tabs={[
        { id: "reservas", label: "Reservas", count: 3 },
        { id: "financeiro", label: "Financeiro" },
      ]}
      active={a}
      onChange={setA}
    >
      <Tabs.Panel id="reservas" active={a}>
        R
      </Tabs.Panel>
      <Tabs.Panel id="financeiro" active={a}>
        F
      </Tabs.Panel>
    </Tabs>
  );
}

test("tab acessível com setas e painel único", async () => {
  render(<Harness />);
  expect(screen.getByRole("tab", { name: /Reservas/ })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("R");
  screen.getByRole("tab", { name: /Reservas/ }).focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("F");
});
