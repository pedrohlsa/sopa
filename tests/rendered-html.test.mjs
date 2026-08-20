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
  // A primeira dobra precisa responder o que e, quanto custa e em quanto tempo chega.
  assert.match(html, /Sopa quentinha chegando na sua casa/);
  assert.match(html, /Caldos de 500 ml a partir de R\$ 19,90/);
  assert.match(html, /25 a 35 min/);
  assert.match(html, /Ver sabores e pedir/);
  // Linguagem de plataforma nao deve voltar para a primeira dobra.
  assert.doesNotMatch(html, /ESTAS OPÇÕES NÃO SÃO BOTÕES/i);
  assert.doesNotMatch(html, /Encontre cozinhas parceiras na sua região/i);

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
  // O limite mora no catalogo compartilhado: o servidor precisa do mesmo numero
  // que o navegador, senao da para burlar mexendo no devtools.
  const catalogo = await readFile(new URL("../data/soups.ts", import.meta.url), "utf8");
  assert.match(catalogo, /export const MAX_CART_ITEMS = 4/);
  assert.match(page, /MAX_CART_ITEMS/);
  assert.match(page, /window\.sessionStorage\.setItem/);
  // O destino carrega os parametros de origem do anuncio, entao nao e mais a URL crua.
  assert.match(page, /window\.location\.assign\(destination\)/);
  assert.match(page, /checkoutUrlWithSource/);
  assert.match(page, /"fbclid"/);
  assert.match(page, /aria-live="polite"/);
  assert.doesNotMatch(page, /google\.maps|maps\.googleapis/i);
});

test("fires the funnel events and never fakes Purchase", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /"track", "PageView"/);
  assert.match(page, /"track", "ViewContent"/);
  assert.match(page, /"track", "AddToCart"/);
  assert.match(page, /"track", "InitiateCheckout"/);

  // Purchase passou a existir porque o pagamento agora acontece no nosso dominio.
  // Mas ele so pode sair depois de confirmacao real: quem confirma e o webhook
  // assinado da VeoPag, e a tela apenas pergunta ao servidor se ja chegou.
  assert.match(page, /"track", "Purchase"/);
  assert.match(page, /dados\.status !== "paid"/);
  // Nunca preso a um clique: botao apertado nao e dinheiro recebido.
  assert.doesNotMatch(page, /onClick=\{[^}]*Purchase/);
});
