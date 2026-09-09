import type { ReactNode } from "react";
import { Button } from "@/components";
import { Modal } from "@/components/feedback";
import { useBloqueioSaida } from "@/lib/useBloqueioSaida";
import s from "./Page.module.css";

export function Page({ children, dirty = false, titulo }: { children: ReactNode; dirty?: boolean; titulo?: string }) {
  const saida = useBloqueioSaida(dirty);
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
          </>
        }
      >
        {titulo ? `As alterações em "${titulo}" serão perdidas.` : "As alterações serão perdidas."}
      </Modal>
    </main>
  );
}
