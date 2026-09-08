export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    public readonly detalhe: string,
    public readonly extensions: Record<string, unknown> = {},
  ) {
    super(detalhe);
    this.name = new.target.name;
  }
}
export class ValidationError extends ApiError {}
export class ConflictError extends ApiError {}
export class PermissionError extends ApiError {}
export class UnauthenticatedError extends ApiError {}
export class NotFoundError extends ApiError {}
export class NetworkError extends Error {
  constructor() {
    super("Sem conexão");
    this.name = "NetworkError";
  }
}

interface ProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  codigo?: string;
  [k: string]: unknown;
}

export function erroDeResposta(status: number, problem: ProblemDetails | null): ApiError {
  const codigo = problem?.codigo ?? "erro";
  const detalhe = problem?.detail ?? problem?.title ?? "Erro inesperado";
  const conhecidos = new Set(["status", "title", "detail", "codigo"]);
  const extensions = Object.fromEntries(Object.entries(problem ?? {}).filter(([chave]) => !conhecidos.has(chave)));
  switch (status) {
    case 401:
      return new UnauthenticatedError(status, "nao_autenticado", "Sessão expirada", extensions);
    case 403:
      return new PermissionError(status, codigo, detalhe, extensions);
    case 404:
      return new NotFoundError(status, codigo, detalhe, extensions);
    case 409:
      return new ConflictError(status, codigo, detalhe, extensions);
    case 422:
      return new ValidationError(status, codigo, detalhe, extensions);
    default:
      return new ApiError(status, codigo, detalhe, extensions);
  }
}

export function mensagemDeErro(e: unknown): string {
  if (e instanceof NetworkError) return "Sem conexão. Verifique a internet e tente de novo.";
  if (e instanceof ConflictError)
    return "Alguém alterou este registro enquanto você editava. Recarregue e tente de novo.";
  if (e instanceof PermissionError) return "Você não tem permissão para isso.";
  if (e instanceof UnauthenticatedError) return "Sua sessão expirou. Entre de novo.";
  if (e instanceof ApiError) return e.detalhe;
  return "Erro inesperado. Tente de novo.";
}
