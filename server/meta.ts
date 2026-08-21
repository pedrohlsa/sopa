/**
 * Conversions API do Meta. SERVER-ONLY.
 *
 * Por que existe: o Purchase disparado pelo navegador depende de a pessoa manter
 * a aba aberta até o Pix cair e de ter aceitado cookies. Os dois falham com
 * frequência — hoje o pixel enxerga cerca de 5% do tráfego. O servidor não tem
 * esse problema: ele sabe que o dinheiro entrou porque o webhook assinado da
 * VeoPag disse isso.
 *
 * Os dois eventos usam o MESMO event_id (o id do pedido). É assim que o Meta
 * entende que são a mesma compra e não conta duas vezes.
 */

const GRAPH_VERSION = "v21.0";
const PIXEL_ID = "1050963361185572";

/** O Meta exige os dados pessoais em SHA-256, nunca em texto puro. */
async function hash(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type PurchaseInput = {
  orderId: string;
  value: number;
  contents: { id: string; quantity: number }[];
  customerName: string;
  customerPhone: string;
  fbp?: string | null;
  fbclid?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  createdAt: number;
};

export async function sendPurchase(input: PurchaseInput) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return { sent: false, reason: "META_CAPI_TOKEN ausente" };

  const [first, ...rest] = input.customerName.trim().split(/\s+/);
  // Telefone com DDI: sem o 55 o Meta não casa o contato com ninguém.
  const phoneDigits = input.customerPhone.replace(/\D/g, "");
  const phoneWithCountry = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;

  const userData: Record<string, unknown> = {
    ph: [await hash(phoneWithCountry)].filter(Boolean),
    fn: [await hash(first ?? "")].filter(Boolean),
    ln: [await hash(rest.join(" "))].filter(Boolean),
    external_id: [await hash(input.orderId)].filter(Boolean),
  };
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbclid) userData.fbc = `fb.1.${input.createdAt * 1000}.${input.fbclid}`;
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        // Mesmo id do evento do navegador: é o que impede contar duas vezes.
        event_id: input.orderId,
        action_source: "website",
        event_source_url: "https://pedirsopa.com.br/",
        user_data: userData,
        custom_data: {
          currency: "BRL",
          value: input.value,
          contents: input.contents.map((item) => ({ id: item.id, quantity: item.quantity })),
          content_type: "product",
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      return { sent: false, reason: `HTTP ${response.status}: ${detail.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "falha de rede" };
  }
}
