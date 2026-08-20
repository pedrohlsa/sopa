import { getDb } from "../../../db";
import { orders } from "../../../db/schema";
import { findExtra, findSoup, MAX_CART_ITEMS, MAX_EXTRA_QUANTITY } from "../../../data/soups";
import { createPixCharge } from "../../../server/veopag";

type Body = {
  items?: unknown;
  extras?: unknown;
  customer?: { name?: string; phone?: string; document?: string; email?: string };
  address?: {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    reference?: string;
  };
  notes?: string;
  tracking?: Record<string, string>;
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return bad("Corpo inválido");
  }

  // --- itens: o preço vem do catálogo do servidor, nunca do navegador --------
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const ids = rawItems.filter((id): id is string => typeof id === "string");
  // Pedido só de acompanhamento é permitido: decisão do dono, que banca a
  // entrega. O que não pode é pedido vazio — conferido depois dos extras.
  if (ids.length > MAX_CART_ITEMS) return bad(`Máximo de ${MAX_CART_ITEMS} sopas por pedido`);

  const resolved = ids.map(findSoup);
  if (resolved.some((soup) => !soup)) return bad("Item inexistente no cardápio");

  const grouped = new Map<string, { id: string; name: string; quantity: number; unitPrice: number }>();
  for (const soup of resolved) {
    if (!soup) continue;
    const current = grouped.get(soup.id);
    if (current) current.quantity += 1;
    else grouped.set(soup.id, { id: soup.id, name: soup.name, quantity: 1, unitPrice: soup.priceValue });
  }
  // --- acompanhamentos: mesmo tratamento, preço vem do catálogo -------------
  const rawExtras = (body.extras ?? {}) as Record<string, unknown>;
  for (const [id, quantity] of Object.entries(rawExtras)) {
    const extra = findExtra(id);
    if (!extra) return bad("Acompanhamento inexistente");
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_EXTRA_QUANTITY) {
      return bad("Quantidade de acompanhamento inválida");
    }
    if (amount > 0) {
      grouped.set(extra.id, { id: extra.id, name: extra.name, quantity: amount, unitPrice: extra.priceValue });
    }
  }

  const items = [...grouped.values()];
  if (!items.length) return bad("Pedido sem itens");
  const total = Math.round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100;
  if (total <= 0) return bad("Total inválido");

  // --- cliente ---------------------------------------------------------------
  const name = (body.customer?.name ?? "").trim();
  const phone = onlyDigits(body.customer?.phone ?? "");
  const document = onlyDigits(body.customer?.document ?? "");
  if (name.length < 3) return bad("Informe o nome de quem vai receber");
  if (phone.length < 10 || phone.length > 11) return bad("WhatsApp inválido");
  if (document.length !== 11 && document.length !== 14) return bad("CPF inválido");

  // --- endereço --------------------------------------------------------------
  const cep = onlyDigits(body.address?.cep ?? "");
  const street = (body.address?.street ?? "").trim();
  const number = (body.address?.number ?? "").trim();
  const neighborhood = (body.address?.neighborhood ?? "").trim();
  if (cep.length !== 8) return bad("CEP inválido");
  if (!street || !number || !neighborhood) return bad("Endereço incompleto");

  const orderId = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const tracking = body.tracking ?? {};

  // A VeoPag exige e-mail. O cliente não precisa digitar mais um campo só por
  // causa disso: o pedido é identificado pelo id, não pelo e-mail.
  const email = `pedido-${orderId}@pedirsopa.com.br`;

  let charge;
  try {
    charge = await createPixCharge({
      amount: total,
      externalId: orderId,
      callbackUrl: `${origin}/api/webhooks/veopag`,
      payer: { name, email, document, phone },
      utm: {
        utm_source: tracking.utm_source,
        utm_medium: tracking.utm_medium,
        utm_campaign: tracking.utm_campaign,
        utm_content: tracking.utm_content,
        utm_term: tracking.utm_term,
      },
    });
  } catch (error) {
    console.error("Falha ao criar cobrança", error);
    return bad("Não conseguimos gerar o Pix agora. Tente de novo em instantes.", 502);
  }

  try {
    await getDb()
      .insert(orders)
      .values({
        id: orderId,
        status: "pending",
        items: JSON.stringify(items),
        total,
        customerName: name,
        customerPhone: phone,
        customerDocument: document,
        addressCep: cep,
        addressStreet: street,
        addressNumber: number,
        addressComplement: (body.address?.complement ?? "").trim() || null,
        addressNeighborhood: neighborhood,
        addressReference: (body.address?.reference ?? "").trim() || null,
        notes: (body.notes ?? "").trim() || null,
        transactionId: charge.transactionId,
        utmSource: tracking.utm_source ?? null,
        utmMedium: tracking.utm_medium ?? null,
        utmCampaign: tracking.utm_campaign ?? null,
        fbclid: tracking.fbclid ?? null,
        fbp: tracking.fbp ?? null,
        clientIp: request.headers.get("cf-connecting-ip"),
        userAgent: request.headers.get("user-agent"),
      });
  } catch (error) {
    // A cobrança já existe na VeoPag. Falhar aqui significaria o cliente pagando
    // um pedido que a cozinha nunca veria, então isso precisa aparecer no log.
    console.error("Cobrança criada mas pedido não gravado", orderId, error);
    return bad("Pedido não pôde ser registrado. Não faça o pagamento e tente de novo.", 500);
  }

  return Response.json({ orderId, qrcode: charge.qrcode, total });
}
