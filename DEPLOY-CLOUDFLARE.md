# Publicar no Cloudflare Workers

Alternativa ao OpenAI Sites, onde publicar depende de cota de conversa do
ChatGPT. Aqui o deploy é um comando, e pode rodar quantas vezes for preciso.

O projeto já é um Worker: `worker/index.ts`, D1 e `wrangler` nas dependências.
O `npm run build` gera `dist/server/wrangler.json` pronto — só falta o
`database_id` real, que vem por variável de ambiente.

## Uma vez, na primeira configuração

```bash
# 1. Autenticar (abre o navegador)
npx wrangler login

# 2. Criar a tabela no banco D1 remoto
npx wrangler d1 execute sopa --remote --file=./drizzle/0000_majestic_penance.sql

# 3. Cadastrar os segredos no Worker
#    Cada comando pede o valor e não deixa rastro no shell.
npx wrangler secret put VEOPAG_CLIENT_ID
npx wrangler secret put VEOPAG_CLIENT_SECRET
npx wrangler secret put VEOPAG_WEBHOOK_SECRET
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put META_CAPI_TOKEN
```

## A cada publicação

```bash
CLOUDFLARE_D1_DATABASE_ID=12475a5b-a831-4966-9c33-d33b6dac0c3b \
CLOUDFLARE_D1_DATABASE_NAME=sopa \
npm run build

npx wrangler deploy --config dist/server/wrangler.json
```

Sem essas duas variáveis o build usa o `database_id` placeholder
(`00000000-...`), que é o que o OpenAI Sites espera — ele injeta o valor real
por conta própria. Publicar no Cloudflare com o placeholder gera um Worker
apontando para um banco inexistente, e todo pedido falha na gravação.

## Domínio próprio

Só depois de o fluxo inteiro estar validado na URL `.workers.dev`:
pedido → Pix → webhook → pedido pago → painel.

1. Adicionar `pedirsopa.com.br` no Cloudflare (o registro continua no Registro.br)
2. Cloudflare devolve dois servidores de nome
3. Trocar os servidores de nome no Registro.br
4. Apontar o Worker para o domínio (Custom Domain)

**Antes do passo 3**: trocar os servidores de nome move *todo* o DNS do domínio.
Se houver e-mail em `@pedirsopa.com.br`, recriar os registros MX no Cloudflare
primeiro, senão o e-mail para de chegar.
