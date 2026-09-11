import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api, mensagemDeErro } from "@/api/http";
import { useAuth } from "@/auth/useAuth";
import { Field, Input } from "@/components";
import { Alert } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { AuthLayout } from "./AuthLayout";
import s from "./AuthLayout.module.css";
import { SenhaForm } from "./SenhaForm";

interface TokenInfo {
  nome: string;
  email: string;
  tipo: "convite" | "reset";
}

function TokenPage({ subtitle, title, submitLabel }: { subtitle: string; title: string; submitLabel: string }) {
  const [params, setParams] = useSearchParams();
  // Token fica só em memória: sai da URL (e do histórico) logo após montar.
  const [token] = useState(() => params.get("token") ?? "");
  useEffect(() => {
    if (!params.has("token")) return;
    setParams(
      (p) => {
        p.delete("token");
        return p;
      },
      { replace: true },
    );
  }, [params, setParams]);
  const nav = useNavigate();
  const { entrar } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [senhaDefinida, setSenhaDefinida] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const info = useQuery({
    queryKey: ["auth", "token", token],
    queryFn: () => api.get<TokenInfo>(`/auth/tokens?token=${encodeURIComponent(token)}`),
    enabled: token !== "",
    retry: false,
  });

  async function definir(senha: string) {
    if (!info.data) return;
    setEnviando(true);
    setErro(null);
    try {
      await api.post("/auth/definir-senha", { token, senha });
      setSenhaDefinida(true);
      await entrar(info.data.email, senha);
      await nav("/", { replace: true });
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout subtitle={subtitle}>
      <div className={s.form}>
        <h1 className={s.title}>{title}</h1>
        {info.isPending && token && <Skeleton lines={4} />}
        {(info.isError || !token) && (
          <Alert tone="danger">
            Link inválido ou expirado. Peça um novo em <Link to="/esqueci-senha">"Esqueci minha senha"</Link>.
          </Alert>
        )}
        {info.data && (
          <>
            <Field label="Nome">
              <Input readOnly value={info.data.nome} />
            </Field>
            <Field label="E-mail">
              <Input readOnly autoComplete="username" value={info.data.email} />
            </Field>
            {erro && (
              <Alert tone="danger">
                {erro}
                {senhaDefinida && (
                  <>
                    {" "}
                    <Link to="/login">Ir para o login</Link>
                  </>
                )}
              </Alert>
            )}
            <SenhaForm
              email={info.data.email}
              submitLabel={submitLabel}
              onSubmit={(v) => void definir(v)}
              enviando={enviando}
            />
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export const DefinirSenhaPage = () => (
  <TokenPage
    subtitle="Você foi convidada para a agência. Defina sua senha para começar. O convite vale por 72 horas."
    title="Definir senha"
    submitLabel="Definir senha e entrar"
  />
);
export const RedefinirSenhaPage = () => (
  <TokenPage
    subtitle="Defina uma nova senha. Link válido por 2 horas e de uso único."
    title="Redefinir senha"
    submitLabel="Salvar nova senha e entrar"
  />
);
