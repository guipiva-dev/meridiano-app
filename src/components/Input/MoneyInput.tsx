import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type InputHTMLAttributes,
  type MouseEvent,
  useId,
  useRef,
  useState,
} from "react";
import { cx } from "@/lib/cx";
import { formatarDinheiro, parsearDinheiro, textoAmbiguo } from "@/lib/dinheiro";
import { useField } from "../Field/FieldContext";
import s from "./Input.module.css";

export interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "value" | "onChange" | "type"> {
  value: number | null;
  onChange: (valor: number | null) => void;
  calculated?: boolean;
  allowNegative?: boolean;
}

const LIMITE_DIGITOS_INTEIROS = 10;
const MSG_NEGATIVO = "Valor não pode ser negativo";
const MSG_LIMITE = "Valor acima do limite de R$ 9.999.999.999,99";
const MSG_INVALIDO = "Valor inválido";

function cru(v: number | null) {
  return v === null ? "" : v.toFixed(2).replace(".", ",");
}

function digitosParteInteira(t: string): number {
  const semSinal = t.replace(/[-−]/g, "");
  const idx = semSinal.lastIndexOf(",");
  const antes = idx === -1 ? semSinal : semSinal.slice(0, idx);
  return (antes.match(/\d/g) ?? []).length;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, calculated, allowNegative = false, readOnly, className, onFocus, onBlur, onMouseUp, ...rest },
  ref,
) {
  const f = useField();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const ultimoEmitido = useRef(value);
  const acabouDeFocar = useRef(false);
  const erroId = useId();

  function focar(e: FocusEvent<HTMLInputElement>) {
    setTexto(cru(value));
    ultimoEmitido.current = value;
    setEditando(true);
    setErro(null);
    // Clique com mouse foca e, no mouseup nativo, reposiciona o cursor por cima da
    // seleção abaixo — adia para o próximo frame e cancela esse reposicionamento.
    acabouDeFocar.current = true;
    requestAnimationFrame(() => {
      e.target.select();
    });
    onFocus?.(e);
  }
  function mouseUp(e: MouseEvent<HTMLInputElement>) {
    if (acabouDeFocar.current) {
      acabouDeFocar.current = false;
      e.preventDefault();
    }
    onMouseUp?.(e);
  }
  function mudar(e: ChangeEvent<HTMLInputElement>) {
    const t = e.target.value;

    if (!allowNegative && /[-−]/.test(t)) {
      setErro(MSG_NEGATIVO);
      return;
    }
    if (digitosParteInteira(t) > LIMITE_DIGITOS_INTEIROS) {
      setErro(MSG_LIMITE);
      return;
    }
    if (textoAmbiguo(t)) {
      setErro(MSG_INVALIDO);
      return;
    }

    setErro(null);
    setTexto(t);
    const n = t === "" ? null : parsearDinheiro(t);
    if (n !== ultimoEmitido.current) {
      ultimoEmitido.current = n;
      onChange(n);
    }
  }
  function sair(e: FocusEvent<HTMLInputElement>) {
    const n = parsearDinheiro(texto);
    if (n !== ultimoEmitido.current) {
      ultimoEmitido.current = n;
      onChange(n);
    }
    setEditando(false);
    setErro(null);
    onBlur?.(e);
  }

  return (
    <div className={s.wrap}>
      <input
        ref={ref}
        id={f?.id}
        aria-describedby={[f?.describedBy, erro && erroId].filter(Boolean).join(" ") || undefined}
        aria-invalid={erro || f?.invalid ? true : undefined}
        required={f?.required}
        inputMode="decimal"
        readOnly={readOnly}
        value={editando ? texto : formatarDinheiro(value)}
        onChange={mudar}
        onFocus={focar}
        onBlur={sair}
        onMouseUp={mouseUp}
        className={cx(s.control, s.money, calculated && s.calculated, readOnly && s.readOnly, className)}
        {...rest}
      />
      {calculated && !editando && (
        <span className={s.calcBadge} aria-hidden>
          calculado
        </span>
      )}
      {erro && (
        <span id={erroId} role="alert" className={s.erro}>
          {erro}
        </span>
      )}
    </div>
  );
});
