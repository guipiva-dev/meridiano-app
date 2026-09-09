import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NetworkError } from "@/api/errors";
import type { ClienteBuscaDto } from "@/api/viagens";
import { PassageirosField } from "./PassageirosField";

function cliente(id: string, nome: string): ClienteBuscaDto {
  return { id, nome, telefone: null };
}

test("buscar 'men' chama buscar com debounce e mostra as opções", async () => {
  vi.useFakeTimers();
  const buscar = vi.fn().mockResolvedValue([cliente("1", "Carlos Mendes"), cliente("2", "Mentor Silva")]);
  render(<PassageirosField value={[]} onChange={vi.fn()} buscar={buscar} onNovaPessoa={vi.fn()} erro={undefined} />);

  const input = screen.getByLabelText("Passageiros");
  fireEvent.change(input, { target: { value: "men" } });
  expect(buscar).not.toHaveBeenCalled();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });

  expect(buscar).toHaveBeenCalledWith("men");
  expect(screen.getAllByRole("option")).toHaveLength(2);
  vi.useRealTimers();
});

test("Enter na primeira opção adiciona como titular quando é a primeira pessoa", async () => {
  vi.useFakeTimers();
  const buscar = vi.fn().mockResolvedValue([cliente("1", "Carlos Mendes")]);
  const onChange = vi.fn();
  render(<PassageirosField value={[]} onChange={onChange} buscar={buscar} onNovaPessoa={vi.fn()} erro={undefined} />);

  const input = screen.getByLabelText("Passageiros");
  fireEvent.change(input, { target: { value: "car" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });

  expect(onChange).toHaveBeenCalledWith([{ clienteId: "1", nome: "Carlos Mendes", titular: true }]);
  vi.useRealTimers();
});

test("buscar rejeitando com NetworkError mostra 'Sem conexão'", async () => {
  vi.useFakeTimers();
  const buscar = vi.fn().mockRejectedValue(new NetworkError());
  render(<PassageirosField value={[]} onChange={vi.fn()} buscar={buscar} onNovaPessoa={vi.fn()} erro={undefined} />);

  const input = screen.getByLabelText("Passageiros");
  fireEvent.change(input, { target: { value: "men" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });

  expect(screen.getByText(/Sem conexão/)).toBeInTheDocument();
  expect(screen.queryByRole("listbox")).toBeNull();
  vi.useRealTimers();
});

test("selecionar dentro da janela do debounce cancela a busca pendente (lista não reabre)", async () => {
  vi.useFakeTimers();
  const buscar = vi.fn().mockResolvedValue([cliente("1", "Carlos Mendes")]);
  const onChange = vi.fn();
  render(<PassageirosField value={[]} onChange={onChange} buscar={buscar} onNovaPessoa={vi.fn()} erro={undefined} />);

  const input = screen.getByLabelText("Passageiros");
  fireEvent.change(input, { target: { value: "car" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  expect(screen.getAllByRole("option")).toHaveLength(1);

  // usuário digita mais mas escolhe a opção já visível antes do novo debounce disparar
  fireEvent.change(input, { target: { value: "carl" } });
  fireEvent.mouseDown(screen.getByRole("option"));
  expect(screen.queryByRole("listbox")).toBeNull();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });

  expect(buscar).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(onChange).toHaveBeenCalledWith([{ clienteId: "1", nome: "Carlos Mendes", titular: true }]);
  vi.useRealTimers();
});

test("Enter sem seta destacada adiciona a primeira opção e nunca envia o formulário", async () => {
  vi.useFakeTimers();
  const buscar = vi.fn().mockResolvedValue([cliente("1", "Carlos Mendes"), cliente("2", "Mentor Silva")]);
  const onChange = vi.fn();
  render(<PassageirosField value={[]} onChange={onChange} buscar={buscar} onNovaPessoa={vi.fn()} erro={undefined} />);

  const input = screen.getByLabelText("Passageiros");
  fireEvent.change(input, { target: { value: "men" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  const evento = fireEvent.keyDown(input, { key: "Enter" });

  expect(evento).toBe(false); // preventDefault() foi chamado
  expect(onChange).toHaveBeenCalledWith([{ clienteId: "1", nome: "Carlos Mendes", titular: true }]);
  vi.useRealTimers();
});

test("clicar em outro chip troca o titular (exatamente um)", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const value = [
    { clienteId: "1", nome: "Carlos Mendes", titular: true },
    { clienteId: "2", nome: "Lúcia Mendes", titular: false },
  ];
  render(
    <PassageirosField value={value} onChange={onChange} buscar={vi.fn()} onNovaPessoa={vi.fn()} erro={undefined} />,
  );

  await user.click(screen.getByRole("button", { name: "Lúcia Mendes" }));

  expect(onChange).toHaveBeenCalledWith([
    { clienteId: "1", nome: "Carlos Mendes", titular: false },
    { clienteId: "2", nome: "Lúcia Mendes", titular: true },
  ]);
});
