import assert from "node:assert/strict";
import { test } from "node:test";
import { violacoes } from "./check-tokens.mjs";

test("hex fora de tokens.css é violação", () => {
  const v = violacoes("src/x.module.css", ".a{color:#fff}");
  assert.equal(v.length, 1);
  assert.match(v[0], /hex/);
});

test("tokens.css pode ter hex e font-size", () => {
  assert.equal(violacoes("src/styles/tokens.css", ".a{color:#fff;font-size:14px}").length, 0);
});

test("font-size solto é violação; font: var(--type-*) não é", () => {
  assert.equal(violacoes("src/a.module.css", ".a{font-size:13px}").length, 1);
  assert.equal(violacoes("src/a.module.css", ".a{font:var(--type-label)}").length, 0);
});

test("@media só com breakpoints da lista (DECISÃO D2)", () => {
  assert.equal(violacoes("src/a.module.css", "@media (max-width:1200px){.a{display:none}}").length, 1);
  assert.equal(violacoes("src/a.module.css", "@media (max-width:1279px){.a{display:none}}").length, 1);
  assert.equal(violacoes("src/a.module.css", "@media (max-width:1280px){.a{display:none}}").length, 0);
});

test("style={{color:'#'}} em tsx é violação", () => {
  assert.equal(violacoes("src/A.tsx", "<div style={{ color: '#5396d1' }} />").length, 1);
});
