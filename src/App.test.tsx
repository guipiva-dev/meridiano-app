import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renderiza o nome do produto", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Meridiano" })).toBeInTheDocument();
});
