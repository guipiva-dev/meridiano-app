import type { Canal } from "@/api/clientes";
import { apresentacaoStatus } from "@/dominio/status";

export const CANAIS: Canal[] = ["whatsapp", "ligacao", "presencial", "email", "outro"];

export const OPCOES_CANAL = CANAIS.map((c) => ({ value: c, label: apresentacaoStatus("canal", c).texto }));
