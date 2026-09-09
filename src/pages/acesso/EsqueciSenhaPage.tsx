import { type SubmitEvent, useState } from "react";
import { Link } from "react-router";
import { api, mensagemDeErro } from "@/api/http";
import { Button, Field, Input } from "@/components";
import { Alert } from "@/components/display";
import { AuthLayout } from "./AuthLayout";
import s from "./AuthLayout.module.css";

export function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "erro">("idle");
  const [erro, setErro] = useState("");

  async function submeter(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("enviando");
    try {
      await api.post("/auth/esqueci-senha", { email: email.trim() });
      setEstado("enviado");
    } catch (ex) {
      setErro(mensagemDeErro(ex));
      setEstado("erro");
    }
  }

  return (
    <AuthLayout subtitle="Recuperar acesso. Receba um link para redefinir sua senha no e-mail cadastrado. Ele vale por 2 horas.">
      <form
        className={s.form}
        onSubmit={(e) => {
          void submeter(e);
        }}
        noValidate
      >
        <h1 className={s.title}>Esqueci minha senha</h1>
        {estado === "enviado" && (
          <Alert tone="success">
            Se o e-mail existir, você recebe o link em instantes. Não revelamos se um e-mail está cadastrado.
          </Alert>
        )}
        {estado === "erro" && <Alert tone="danger">{erro}</Alert>}
        <Field label="E-mail" required>
          <Input
            type="email"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- primeiro campo da tela de acesso, sem outro foco em disputa
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </Field>
        <Button variant="primary" type="submit" loading={estado === "enviando"}>
          Enviar link de redefinição
        </Button>
        <div className={s.links}>
          <Link to="/login">Voltar ao login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
