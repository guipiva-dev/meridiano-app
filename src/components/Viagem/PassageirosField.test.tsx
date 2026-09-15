import { act, fireEvent, render, screen, within } from "@testing-library/react";
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

test("Enter na primeira opção carrega cpf e dataNascimento do resultado da busca", async () => {
  vi.useFakeTimers();
  const buscar = vi
    .fn()
    .mockResolvedValue([
      { id: "1", nome: "Carlos Mendes", telefone: null, cpf: "11144477735", dataNascimento: "1980-05-05" },
    ]);
  const onChange = vi.fn();
  render(<PassageirosField value={[]} onChange={onChange} buscar={buscar} onNovaPessoa={vi.fn()} erro={undefined} />);

  const input = screen.getByLabelText("Passageiros");
  fireEvent.change(input, { target: { value: "car" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });

  expect(onChange).toHaveBeenCalledWith([
    { clienteId: "1", nome: "Carlos Mendes", titular: true, cpf: "11144477735", dataNascimento: "1980-05-05" },
  ]);
  vi.useRealTimers();
});

test("chip do passageiro selecionado mostra CPF e data de nascimento na linha secundária", () => {
  const value = [
    { clienteId: "1", nome: "Carlos Mendes", titular: true, cpf: "11144477735", dataNascimento: "1980-05-05" },
  ];
  render(
    <PassageirosField
      value={value}
      onChange={vi.fn()}
      buscar={vi.fn()}
      onNovaPessoa={vi.fn()}
      erro={undefined}
      dataIda="2026-10-01"
    />,
  );

  expect(screen.getByText("111.444.777-35 · nasc. 05/05/1980 · 46 anos")).toBeInTheDocument();
});

test("chip do passageiro sem permissão de ver CPF mostra só a data de nascimento", () => {
  const value = [
    { clienteId: "1", nome: "Carlos Mendes", titular: true, cpf: undefined, dataNascimento: "1980-05-05" },
  ];
  render(
    <PassageirosField
      value={value}
      onChange={vi.fn()}
      buscar={vi.fn()}
      onNovaPessoa={vi.fn()}
      erro={undefined}
      dataIda="2026-10-01"
    />,
  );

  expect(screen.getByText("nasc. 05/05/1980 · 46 anos")).toBeInTheDocument();
});

test("chip mostra idade e faixa na data de ida; sem nascimento não mostra idade", () => {
  const value = [
    { clienteId: "1", nome: "Ana Mendes", titular: true, dataNascimento: "2019-10-01" },
    { clienteId: "2", nome: "Bia Mendes", titular: false, dataNascimento: "2024-10-02" },
    { clienteId: "3", nome: "Carlos Mendes", titular: false },
  ];
  render(
    <PassageirosField
      value={value}
      onChange={vi.fn()}
      buscar={vi.fn()}
      onNovaPessoa={vi.fn()}
      erro={undefined}
      dataIda="2026-10-01"
    />,
  );
  const itens = within(screen.getByRole("list", { name: "Passageiros adicionados" })).getAllByRole("listitem");
  expect(itens[0]).toHaveTextContent("nasc. 01/10/2019 · 7 anos · criança");
  expect(itens[1]).toHaveTextContent("nasc. 02/10/2024 · 1 ano · bebê");
  expect(itens[2]).not.toHaveTextContent("ano");
});

test("chip sem data de ida calcula a idade em hoje", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 14, 12));
  const value = [{ clienteId: "1", nome: "Ana Mendes", titular: true, dataNascimento: "2024-09-14" }];
  render(
    <PassageirosField value={value} onChange={vi.fn()} buscar={vi.fn()} onNovaPessoa={vi.fn()} erro={undefined} />,
  );
  expect(screen.getByText("nasc. 14/09/2024 · 2 anos · criança")).toBeInTheDocument();
  vi.useRealTimers();
});

test("X09: opção mostra telefone e CPF mascarado para distinguir homônimos", async () => {
  vi.useFakeTimers();
  const buscar = vi.fn().mockResolvedValue([
    { id: "1", nome: "Carlos Mendes", telefone: "11988887777", cpf: "12345678900" },
    { id: "2", nome: "Carlos Mendes", telefone: null, cpf: "98765432100" },
  ] satisfies ClienteBuscaDto[]);
  render(<PassageirosField value={[]} onChange={vi.fn()} buscar={buscar} onNovaPessoa={vi.fn()} erro={undefined} />);

  const input = screen.getByLabelText("Passageiros");
  fireEvent.change(input, { target: { value: "car" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });

  const opcoes = screen.getAllByRole("option");
  expect(opcoes[0]).toHaveTextContent("(11) 98888-7777");
  expect(opcoes[0]).toHaveTextContent("123.456.789-00");
  expect(opcoes[1]).toHaveTextContent("987.654.321-00");
  vi.useRealTimers();
});

test("resposta atrasada de busca anterior não sobrescreve as opções da busca atual", async () => {
  vi.useFakeTimers();
  let resolverPrimeira: (r: ClienteBuscaDto[]) => void = () => undefined;
  const buscar = vi
    .fn<(q: string) => Promise<ClienteBuscaDto[]>>()
    .mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolverPrimeira = res;
        }),
    )
    .mockResolvedValueOnce([cliente("2", "Lúcia Mendes")]);
  render(<PassageirosField value={[]} onChange={vi.fn()} buscar={buscar} onNovaPessoa={vi.fn()} erro={undefined} />);

  const input = screen.getByLabelText("Passageiros");
  fireEvent.change(input, { target: { value: "ca" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  fireEvent.change(input, { target: { value: "lu" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  expect(screen.getByRole("option")).toHaveTextContent("Lúcia Mendes");

  // a primeira resposta chega depois da segunda: deve ser descartada
  await act(async () => {
    resolverPrimeira([cliente("1", "Carlos Mendes")]);
    await Promise.resolve();
  });

  expect(buscar).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("option")).toHaveTextContent("Lúcia Mendes");
  vi.useRealTimers();
});

test("cartão do passageiro mostra iniciais (ignora tokens numéricos), documento e nascimento; badge só no titular", () => {
  const value = [
    {
      clienteId: "1",
      nome: "QA Nova Auditoria 20260912 1205",
      titular: true,
      cpf: "52998224725",
      dataNascimento: "1990-01-15",
    },
    { clienteId: "2", nome: "Carlos Mendes", titular: false },
  ];
  render(
    <PassageirosField value={value} onChange={vi.fn()} buscar={vi.fn()} onNovaPessoa={vi.fn()} erro={undefined} />,
  );
  const lista = screen.getByRole("list", { name: "Passageiros adicionados" });
  const itens = within(lista).getAllByRole("listitem");
  expect(itens[0]).toHaveTextContent(/^QA/); // iniciais "QA" (ignora "20260912"/"1205")
  expect(itens[0]).toHaveTextContent("529.982.247-25 · nasc. 15/01/1990 ·"); // + idade em hoje
  expect(itens[1]).toHaveTextContent(/^CM/);
  expect(within(itens[0]!).getByText("Titular")).toBeInTheDocument();
  expect(within(itens[1]!).queryByText("Titular")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remover Carlos Mendes" })).toBeInTheDocument();
});
