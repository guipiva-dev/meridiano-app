import { Button } from "@/components";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  impact: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  impact,
  confirmLabel,
  tone = "primary",
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- foco inicial no botão seguro (cancelar) é o requisito de acessibilidade aqui */}
          <Button variant="secondary" onClick={onCancel} autoFocus>
            Cancelar
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {impact}
    </Modal>
  );
}
