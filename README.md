# Meridiano — frontend

React + Vite + TypeScript, build servido pela API em `wwwroot/`. Repo `guipiva-dev/meridiano-app`; irmão de `../backend` (API) e `..` (specs/design).

## Estado (2026-09-08)

Scaffold da Fase 3 concluído (subplano 3.1): cliente HTTP, componentes do contrato, autenticação, shell do app e styleguide dev-only. Próximo: módulos (subplano 3.2, Nova viagem).

## Estrutura

```
src/api          cliente HTTP (fetch + ProblemDetails), queryClient (React Query)
src/auth         AuthProvider/useAuth, RequireAuth, destinoSeguro (redirect pós-login)
src/components   primitivos do contrato (Button, Field/Input/Select/Checkbox/Radio/DateInput/MoneyInput, display, feedback, shell)
src/dominio      regras de apresentação puras (ex.: apresentacaoStatus)
src/lib          utilitários (cx, dinheiro, useSalvamento, useBloqueioSaida, atalhos/useAtalho)
src/pages        telas (acesso: login/definir-senha/esqueci-senha/redefinir-senha; styleguide: dev-only)
src/shell        AppShell, Sidebar (por permissão), GlobalHeader, rotas dos módulos (placeholder)
src/styles       tokens.css (única fonte de cor/tipografia/espaço/raio — contrato §5)
```

## Barrels de `src/components`

Import sempre pelo barrel, nunca pelo arquivo do componente:

- `@/components` (`index.ts`) — primitivos: Button, IconButton, Field, Input, Select, Checkbox, Radio, DateInput, MoneyInput, MoneyValue.
- `@/components/display` — Chip, Badge, StatusBadge, Tooltip, Alert.
- `@/components/feedback` — toast/ToastHost, Modal, ConfirmModal, Skeleton, EmptyState.
- `@/components/shell` — Page, PageHeader, Section, Subnav, Tabs.

## Scripts

- `npm run dev` — Vite dev server (`localhost:5173`).
- `npm run build` — `tsc -b && vite build` (saída em `../backend/src/Meridiano.Api/wwwroot`).
- `npm run preview` — build local.
- `npm run typecheck` — `tsc -b`.
- `npm run lint` — `lint:eslint` (strictTypeChecked + jsx-a11y) + `lint:biome` (formatação) + `lint:tokens` (`scripts/check-tokens.mjs`: proíbe hex/px fora de `tokens.css` e valida breakpoints 700/1024/1280/1366/1440).
- `npm run format` — `biome format --write .`.
- `npm test` / `npm run test:watch` — Vitest.
- `npm run test:e2e` — Playwright (todos os specs; veja abaixo).

## E2E (Playwright)

- `npx playwright test e2e/styleguide.spec.ts` — regressão visual da `/styleguide` contra baseline `e2e/styleguide.spec.ts-snapshots/` (win32 local + linux, este último é o que roda no CI). Requer `npx playwright install` uma vez.
- `e2e/login.spec.ts` — fluxo de login real; **não roda no CI** (precisa da API de pé + seed, `backend/scripts/seed-dev.sql` ainda por criar).
- CI (`.github/workflows/ci.yml`, job `e2e`) roda só `styleguide.spec.ts` contra Chromium headless.
