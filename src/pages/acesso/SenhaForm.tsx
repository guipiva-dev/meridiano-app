import { useForm } from "react-hook-form";
import { Button, Field, Input } from "@/components";
import s from "./AuthLayout.module.css";

interface Valores {
  senha: string;
  confirmar: string;
}

export function SenhaForm({
  email,
  submitLabel,
  onSubmit,
  enviando,
}: {
  email: string;
  submitLabel: string;
  onSubmit: (senha: string) => void;
  enviando?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Valores>({ mode: "onSubmit" });
  const senha = watch("senha", "");
  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        void handleSubmit((v) => {
          onSubmit(v.senha);
        })(e);
      }}
      noValidate
    >
      <Field
        label="Nova senha"
        required
        helper="✓ Pelo menos 8 caracteres · ✓ Diferente do e-mail"
        error={errors.senha?.message}
      >
        <Input
          type="password"
          autoComplete="new-password"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- primeiro campo do formulário de senha, sem outro foco em disputa
          autoFocus
          {...register("senha", {
            required: "Informe a senha",
            minLength: { value: 8, message: "Pelo menos 8 caracteres" },
            validate: (v) => v.toLowerCase() !== email.toLowerCase() || "A senha não pode ser igual ao e-mail",
          })}
        />
      </Field>
      <Field label="Confirmar senha" required error={errors.confirmar?.message}>
        <Input
          type="password"
          autoComplete="new-password"
          {...register("confirmar", { validate: (v) => v === senha || "As senhas não conferem" })}
        />
      </Field>
      <Button variant="primary" type="submit" loading={enviando}>
        {submitLabel}
      </Button>
    </form>
  );
}
