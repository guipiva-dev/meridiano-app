import { type ReactNode, useState } from "react";
import { Button } from "@/components";
import { Modal } from "@/components/feedback";
import { useBloqueioSaida } from "@/lib/useBloqueioSaida";
import s from "./Page.module.css";

export function Page({
  children,
  dirty = false,
  titulo,
  onSalvarESair,
}: {
  children: ReactNode;
  dirty?: boolean;
  titulo?: string;
  onSalvarESair?: () => Promise<boolean>;
}) {
  const saida = useBloqueioSaida(dirty);
  const [salvando, setSalvando] = useState(false);

  async function salvarESair() {
    if (!onSalvarESair) return;
    setSalvando(true);
    try {
      if (await onSalvarESair()) saida.confirmar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className={s.page}>
      {children}
      <Modal
        open={saida.bloqueado}
        title="Sair sem salvar?"
        onClose={saida.cancelar}
        footer={
          <>
            <Button variant="secondary" onClick={saida.cancelar}>
              Continuar editando
            </Button>
            <Button variant="danger" onClick={saida.confirmar}>
              Sair sem salvar
            </Button>
            {onSalvarESair && (
              <Button variant="primary" loading={salvando} onClick={() => void salvarESair()}>
                Salvar e sair
              </Button>
            )}
          </>
        }
      >
        {titulo ? `As alterações em "${titulo}" serão perdidas.` : "As alterações serão perdidas."}
      </Modal>
    </main>
  );
}
