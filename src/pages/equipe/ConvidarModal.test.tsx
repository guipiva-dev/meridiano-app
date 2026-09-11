import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type * as EquipeApi from "@/api/equipe";
import { equipeApi } from "@/api/equipe";
import { ValidationError } from "@/api/errors";
import { ConvidarModal } from "./ConvidarModal";

vi.mock("@/api/equipe", async (importar) => {
  const real = await importar<typeof EquipeApi>();
  return { ...real, equipeApi: { ...real.equipeApi, convidarNovo: vi.fn() } };
});

afterEach(() => {
  vi.clearAllMocks();
});

test("envia nome, e-mail e perfil para POST /auth/convites", async () => {
  const convidado = vi.fn();
  vi.mocked(equipeApi.convidarNovo).mockResolvedValue({ usuarioId: "u9" });
  render(<ConvidarModal open onClose={() => undefined} onConvidado={convidado} />);

  fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Nova Pessoa" } });
  fireEvent.change(screen.getByLabelText(/E-mail/), { target: { value: "nova@x.com" } });
  fireEvent.change(screen.getByLabelText(/Perfil/), { target: { value: "financeiro" } });
  fireEvent.click(screen.getByRole("button", { name: "Convidar" }));

  await waitFor(() => {
    expect(equipeApi.convidarNovo).toHaveBeenCalledWith({
      nome: "Nova Pessoa",
      email: "nova@x.com",
      perfil: "financeiro",
    });
  });
  expect(convidado).toHaveBeenCalled();
});

test("422 email_ja_cadastrado mostra o erro no campo e-mail", async () => {
  vi.mocked(equipeApi.convidarNovo).mockRejectedValue(
    new ValidationError(422, "email_ja_cadastrado", "E-mail já cadastrado"),
  );
  render(<ConvidarModal open onClose={() => undefined} onConvidado={() => undefined} />);

  fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Nova Pessoa" } });
  fireEvent.change(screen.getByLabelText(/E-mail/), { target: { value: "ja@existe.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Convidar" }));

  expect(await screen.findByText("E-mail já cadastrado")).toBeInTheDocument();
});
