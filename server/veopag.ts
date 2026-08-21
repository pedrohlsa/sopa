/**
 * Cliente da VeoPag. SERVER-ONLY.
 *
 * Nunca importe este arquivo de um componente de cliente. As credenciais aqui
 * dentro autorizam movimentar dinheiro; se vazarem para o bundle, qualquer
 * pessoa com o devtools aberto passa a poder criar cobranças em seu nome.
 */

const DEFAULT_BASE_URL = "https://api.veopag.com";

/** Erro da VeoPag com o status HTTP, para separar recusa do cliente de falha nossa. */
export class VeoPagError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(message);
    this.name = "VeoPagError";
  }
}

// A documentação exige cachear o token: ele vale 1 hora e o endpoint de login
// bloqueia com 429 depois de 25 tentativas por IP a cada 15 minutos.
const TOKEN_TTL_MS = 55 * 60 * 1000;

let cachedToken: { value: string; expiresAt: number } | null = null;

function readEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

function baseUrl() {
  return (process.env.VEOPAG_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const response = await fetch(`${baseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: readEnv("VEOPAG_CLIENT_ID"),
      client_secret: readEnv("VEOPAG_CLIENT_SECRET"),
    }),
  });

  if (!response.ok) {
    // A mensagem crua pode conter eco das credenciais; não propague.
    throw new Error(`Falha ao autenticar na VeoPag (HTTP ${response.status})`);
  }

  const data = (await response.json()) as { token?: string; access_token?: string };
  const token = data.token ?? data.access_token;
  if (!token) throw new Error("Resposta de login da VeoPag veio sem token");

  cachedToken = { value: token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return token;
}

export type CreatePixInput = {
  amount: number;
  externalId: string;
  payer: { name: string; email: string; document: string; phone?: string };
  callbackUrl: string;
  utm?: Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term", string>>;
};

export type CreatePixResult = {
  transactionId: string;
  status: string;
  qrcode: string;
  amount: number;
};

export async function createPixCharge(input: CreatePixInput): Promise<CreatePixResult> {
  const token = await getToken();

  // O caminho é /api/payments/deposit. O indice da documentação (llms.txt) lista
  // "/api/deposits", que responde 404 — quem vale é a página do endpoint.
  const response = await fetch(`${baseUrl()}/api/payments/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: input.amount,
      external_id: input.externalId,
      clientCallbackUrl: input.callbackUrl,
      payer: input.payer,
      ...input.utm,
    }),
  });

  if (!response.ok) {
    // A VeoPag explica a recusa em texto claro ("Depósito mínimo é R$ 5,00").
    // Engolir isso e mostrar "tente de novo" faz o cliente tentar de novo para
    // sempre, sem nunca descobrir que o problema é o valor.
    const detalhe = await response.text();
    let mensagem = "";
    try {
      const json = JSON.parse(detalhe) as { message?: string; error?: string };
      mensagem = json.message ?? json.error ?? "";
    } catch {
      /* resposta não-JSON: fica com a mensagem genérica */
    }
    throw new VeoPagError(
      mensagem || `VeoPag recusou a cobrança (HTTP ${response.status})`,
      response.status,
      detalhe,
    );
  }

  const data = (await response.json()) as {
    qrCodeResponse?: { transactionId?: string; status?: string; qrcode?: string; amount?: number };
  };
  const qr = data.qrCodeResponse;
  if (!qr?.qrcode || !qr.transactionId) {
    throw new Error("Resposta da VeoPag veio sem QR Code");
  }

  return {
    transactionId: qr.transactionId,
    status: qr.status ?? "PENDING",
    qrcode: qr.qrcode,
    amount: qr.amount ?? input.amount,
  };
}

/**
 * Confere a assinatura do webhook.
 *
 * O HMAC é calculado sobre `${timestamp}.${corpo_bruto}` — o corpo exatamente
 * como chegou, sem reserializar o JSON. Reserializar muda espaços e ordem de
 * chaves e a assinatura deixa de bater.
 *
 * Sem esta checagem, qualquer pessoa que descobrisse a URL do webhook poderia
 * marcar pedidos como pagos.
 */
export async function isValidWebhookSignature(rawBody: string, signature: string, timestamp: string) {
  if (!signature || !timestamp) return false;

  // Proteção contra replay: a documentação recomenda 5 minutos de tolerância.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(readEnv("VEOPAG_WEBHOOK_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return timingSafeEqual(expected, signature.trim().toLowerCase());
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
