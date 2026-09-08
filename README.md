# Meridiano — frontend

React + Vite + TypeScript, build servido pela API em `wwwroot/`. Repo `guipiva-dev/meridiano-app`; irmão de `../backend` (API) e `..` (specs/design).

## Estado (2026-09-08)

Só `src/styles/tokens.css` (tokens v3, congelados). Scaffold do app é a primeira onda da Fase 3 — plano em `../docs/superpowers/plans/`.

## Contrato

- Tokens: `src/styles/tokens.css` é a única fonte de cor, tipografia, espaço e raio. Nenhum hex ou `px` solto fora dele.
- Regras, componentes obrigatórios e ordem de construção: `../docs/design-system-contrato.md`.
- Telas: `../docs/design/prototipo-v1.html` (22 telas) e PNGs em `../docs/design/prototipo-v1/`.
- Tela de lançamento (Nova viagem) é o risco número um: teclado, pré-preenchimento, teste E2E cronometrado.
