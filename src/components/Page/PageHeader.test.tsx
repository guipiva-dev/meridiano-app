import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

test("com dirty mostra o aviso de alterações não salvas e esconde o salvo", () => {
  render(<PageHeader title="Nova viagem" dirty salvoEm={new Date(2026, 3, 18, 9, 5)} />);
  expect(screen.getByText("● Alterações não salvas")).toBeInTheDocument();
  expect(screen.queryByText(/✓ Salvo/)).toBeNull();
});

test("sem dirty e com salvoEm mostra a hora do último save", () => {
  render(<PageHeader title="Nova viagem" salvoEm={new Date(2026, 3, 18, 9, 5)} />);
  expect(screen.getByText("✓ Salvo às 09:05")).toBeInTheDocument();
});

test("sem dirty e sem salvoEm não mostra nenhum dos dois", () => {
  render(<PageHeader title="Nova viagem" />);
  expect(screen.queryByText(/✓ Salvo/)).toBeNull();
  expect(screen.queryByText(/Alterações não salvas/)).toBeNull();
});

// I3: toda página com PageHeader ganha título na aba, sem cada tela repetir `titulo` no Page.
test("title define o título da aba; desmontar volta ao nome do app", () => {
  const { unmount } = render(<PageHeader title="Relatórios" />);
  expect(document.title).toBe("Relatórios · Meridiano");
  unmount();
  expect(document.title).toBe("Meridiano");
});

test("título de 150 caracteres mantém a classe que permite quebra (ALT-12)", () => {
  const titulo = "A".repeat(150);
  render(<PageHeader title={titulo} />);
  const h1 = screen.getByRole("heading", { level: 1 });
  expect(h1.className).toContain("titulo");
  expect(h1).toHaveTextContent(titulo);
});
