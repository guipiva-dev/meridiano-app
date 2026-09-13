import { esperar, montar, reiniciar, stubs, viagemDto } from "./useNovaViagem.harness";

beforeEach(reiniciar);

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("edição carrega cpf e dataNascimento do passageiro vindos da API", async () => {
  stubs.respostaGetViagem = () => ({
    ...viagemDto("7"),
    passageiros: [{ clienteId: "c1", nome: "Carlos", titular: true, cpf: "11144477735", dataNascimento: "1980-05-05" }],
  });
  const { result } = montar("v9");
  await esperar.viagem(result);

  expect(result.current.form.getValues("passageiros")).toEqual([
    { clienteId: "c1", nome: "Carlos", titular: true, cpf: "11144477735", dataNascimento: "1980-05-05" },
  ]);
});

test("edição sem cpf (sem ver_documento) carrega dataNascimento com cpf undefined", async () => {
  stubs.respostaGetViagem = () => ({
    ...viagemDto("7"),
    passageiros: [{ clienteId: "c1", nome: "Carlos", titular: true, dataNascimento: "1980-05-05" }],
  });
  const { result } = montar("v9");
  await esperar.viagem(result);

  expect(result.current.form.getValues("passageiros")).toEqual([
    { clienteId: "c1", nome: "Carlos", titular: true, cpf: undefined, dataNascimento: "1980-05-05" },
  ]);
});
