import { act, render, screen } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

test("nada renderiza antes de 300ms; aparece depois", () => {
  vi.useFakeTimers();
  render(<Skeleton />);
  expect(screen.queryByLabelText("Carregando")).toBeNull();
  act(() => {
    vi.advanceTimersByTime(300);
  });
  expect(screen.getByLabelText("Carregando")).toBeInTheDocument();
  vi.useRealTimers();
});
