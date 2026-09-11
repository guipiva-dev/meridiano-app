import { Component, type ReactNode } from "react";
import { Button } from "@/components/Button/Button";
import { Alert } from "@/components/display";

// Rede de segurança: erro de render em qualquer tela vira um aviso em vez de tela branca.
export class ErrorBoundary extends Component<{ children: ReactNode }, { erro: boolean }> {
  state = { erro: false };

  static getDerivedStateFromError() {
    return { erro: true };
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <Alert
        tone="danger"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.reload();
            }}
          >
            Recarregar
          </Button>
        }
      >
        Algo deu errado.
      </Alert>
    );
  }
}
