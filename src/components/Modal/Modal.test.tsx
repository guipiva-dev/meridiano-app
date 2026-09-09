import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

test("dialog acessível, fecha com Esc", async () => {
  const onClose = vi.fn();
  render(
    <Modal open title="Sair sem salvar?" onClose={onClose}>
      corpo
    </Modal>,
  );
  const d = screen.getByRole("dialog", { name: "Sair sem salvar?" });
  expect(d).toHaveAttribute("aria-modal", "true");
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalled();
});

test("fechado não renderiza", () => {
  render(
    <Modal open={false} title="x" onClose={() => undefined}>
      corpo
    </Modal>,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});
