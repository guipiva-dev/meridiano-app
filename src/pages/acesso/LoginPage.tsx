import { type SubmitEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { UnauthenticatedError } from "@/api/errors";
import { mensagemDeErro } from "@/api/http";
import { useAuth } from "@/auth/useAuth";
import { Button, Field, Input } from "@/components";
import { Alert } from "@/components/display";
import { AuthLayout } from "./AuthLayout";
import s from "./AuthLayout.module.css";

export function LoginPage() {
  const { entrar } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submeter(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
      await nav(params.get("voltar") ?? "/", { replace: true });
    } catch (ex) {
      setErro(ex instanceof UnauthenticatedError ? "E-mail ou senha incorretos." : mensagemDeErro(ex));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout subtitle="Vendas, comissões e operação da agência num só lugar. Lance a viagem em minutos, saiba quanto cada reserva deixa e nunca esqueça uma comissão atrasada.">
      <form
        className={s.form}
        onSubmit={(e) => {
          void submeter(e);
        }}
        noValidate
      >
        <h1 className={s.title}>Entrar</h1>
        {erro && <Alert tone="danger">{erro}</Alert>}
        <Field label="E-mail" required>
          <Input
            type="email"
            autoComplete="username"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- primeiro campo da tela de acesso, sem outro foco em disputa
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </Field>
        <Field label="Senha" required>
          <Input
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
            }}
          />
        </Field>
        <Button variant="primary" type="submit" loading={enviando}>
          Entrar
        </Button>
        <div className={s.links}>
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
