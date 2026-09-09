import { Outlet, useNavigate } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components";
import { EmptyState } from "@/components/feedback";
import { Page } from "@/components/shell";
import { temPermissao } from "./navegacao";

export function RotaProtegida({ permissao }: { permissao: string | string[] }) {
  const { pode } = useAuth();
  const nav = useNavigate();

  if (temPermissao(pode, permissao)) return <Outlet />;

  return (
    <Page>
      <EmptyState
        title="Sem permissão"
        description="Seu perfil não acessa esta área."
        action={
          <Button
            variant="secondary"
            onClick={() => {
              void nav("/viagens");
            }}
          >
            Ir para Viagens
          </Button>
        }
      />
    </Page>
  );
}
