import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Sopa Boa commercial catalogue", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="pt-BR">/i);
  assert.match(html, /<title>Sopa Boa \| Sopa delivery perto de você no Rio<\/title>/i);
  assert.match(html, /Sopa quentinha, pertinho de você\./);
  assert.match(html, /Caldos de 500 ml/);
  assert.match(html, /Preços de lançamento/);

  for (const soup of [
    "Caldo Verde com Calabresa",
    "Caldo de Feijão com Bacon e Calabresa",
    "Creme de Ervilha com Bacon e Calabresa",
    "Sopa de Frango com Legumes",
    "Caldo de Aipim com Carne-Seca",
    "Creme de Abóbora com Carne-Seca",
  ]) {
    assert.match(html, new RegExp(soup));
  }

  for (const photo of [
    "caldo-verde-com-calabresa.jpg",
    "caldo-de-feijao-com-bacon-e-calabresa.jpg",
    "creme-de-ervilha-com-bacon-e-calabresa.jpg",
    "sopa-de-frango-com-legumes.jpg",
    "caldo-de-aipim-com-carne-seca.jpg",
    "creme-de-abobora-com-carne-seca.jpg",
  ]) {
    assert.match(html, new RegExp(photo));
  }

  assert.doesNotMatch(html, /valores demonstrativos/i);
  assert.doesNotMatch(html, /codex-preview|loading skeleton/i);
});

test("preserves location, cart and checkout integration hooks", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(page, /getDistanceKm/);
  assert.match(page, /Centro/);
  assert.match(page, /Tijuca/);
  assert.match(page, /Botafogo/);
  assert.equal((page.match(/https:\/\/paylume\.fans\/c\/sopa-boa-/g) ?? []).length, 14);
  assert.match(page, /const MAX_CART_ITEMS = 4/);
  assert.match(page, /window\.sessionStorage\.setItem/);
  assert.match(page, /window\.location\.assign\(selectedCheckoutUrl\)/);
  assert.match(page, /aria-live="polite"/);
  assert.doesNotMatch(page, /google\.maps|maps\.googleapis/i);
});
