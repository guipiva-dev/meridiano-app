import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
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

test("foco entra no dialog ao abrir e volta ao disparador ao fechar", async () => {
  function Wrapper() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
        >
          abrir
        </button>
        <Modal
          open={open}
          title="t"
          onClose={() => {
            setOpen(false);
          }}
        >
          <button type="button">dentro</button>
        </Modal>
      </>
    );
  }
  render(<Wrapper />);
  const disparador = screen.getByRole("button", { name: "abrir" });
  await userEvent.click(disparador);
  const dialog = screen.getByRole("dialog");
  expect(dialog).toContainElement(document.activeElement as HTMLElement);
  await userEvent.keyboard("{Escape}");
  expect(disparador).toHaveFocus();
});

test("Tab no último foca o primeiro; Shift+Tab no primeiro foca o último", async () => {
  render(
    <Modal open title="t" onClose={() => undefined}>
      <button type="button">meio</button>
    </Modal>,
  );
  const fechar = screen.getByRole("button", { name: "Fechar" });
  const meio = screen.getByRole("button", { name: "meio" });
  meio.focus();
  await userEvent.tab();
  expect(fechar).toHaveFocus();
  fechar.focus();
  await userEvent.tab({ shift: true });
  expect(meio).toHaveFocus();
});

test("ConfirmModal foca inicialmente o botão cancelar", () => {
  render(
    <ConfirmModal
      open
      title="t"
      impact="i"
      confirmLabel="Confirmar"
      onConfirm={() => undefined}
      onCancel={() => undefined}
    />,
  );
  expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
});

test("aberto trava o scroll do documento e restaura ao fechar", () => {
  document.body.style.overflow = "auto";
  const { rerender } = render(
    <Modal open title="t" onClose={() => undefined}>
      corpo
    </Modal>,
  );
  expect(document.body.style.overflow).toBe("hidden");
  rerender(
    <Modal open={false} title="t" onClose={() => undefined}>
      corpo
    </Modal>,
  );
  expect(document.body.style.overflow).toBe("auto");
});
