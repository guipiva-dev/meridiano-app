import { act, render, screen } from "@testing-library/react";
import { ToastHost } from "./ToastHost";
import { toast } from "./toast";

test("toast.success aparece e some", () => {
  vi.useFakeTimers();
  render(<ToastHost />);
  act(() => {
    toast.success("Viagem salva");
  });
  expect(screen.getByRole("status")).toHaveTextContent("Viagem salva");
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.queryByText("Viagem salva")).toBeNull();
  vi.useRealTimers();
});

test("toast.undo chama desfazer", () => {
  vi.useFakeTimers();
  const desfazer = vi.fn();
  render(<ToastHost />);
  act(() => {
    toast.undo("Reserva cancelada", desfazer);
  });
  screen.getByRole("button", { name: "Desfazer" }).click();
  expect(desfazer).toHaveBeenCalled();
  vi.useRealTimers();
});
