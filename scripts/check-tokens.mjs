// Lint do contrato de design (§5): sem hex, font-size solto ou @media fora dos breakpoints
// em qualquer arquivo de src/ exceto src/styles/tokens.css.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ISENTO = /styles[\\/]tokens\.css$/;
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FONT_SIZE = /font-size\s*:/g;
const MEDIA = /@media[^{]*?(\d+)px/g;
const BREAKPOINTS = new Set(["700", "1024", "1280", "1366", "1440"]); // DECISÃO D2

export function violacoes(caminho, conteudo) {
  if (ISENTO.test(caminho)) return [];
  const achados = [];
  for (const m of conteudo.matchAll(HEX)) achados.push(`${caminho}: hex ${m[0]} — use var(--color-*)`);
  if (/\.css$/.test(caminho)) {
    for (const _ of conteudo.matchAll(FONT_SIZE)) achados.push(`${caminho}: font-size solto — use font: var(--type-*)`);
    for (const m of conteudo.matchAll(MEDIA)) {
      if (!BREAKPOINTS.has(m[1])) achados.push(`${caminho}: @media ${m[1]}px — só ${[...BREAKPOINTS].join(", ")}`);
    }
  }
  return achados;
}

function* arquivos(dir) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) yield* arquivos(p);
    else if (/\.(css|tsx?)$/.test(nome) && !/\.test\.tsx?$/.test(nome)) yield p;
  }
}

if (process.argv[1] && /check-tokens\.mjs$/.test(process.argv[1])) {
  const todas = [];
  for (const arq of arquivos("src")) todas.push(...violacoes(arq, readFileSync(arq, "utf8")));
  if (todas.length) {
    console.error(todas.join("\n"));
    process.exit(1);
  }
  // biome-ignore lint/suspicious/noConsole: CLI de lint precisa reportar sucesso no stdout
  console.log("tokens ok");
}
