import { eq, or, type SQL } from "drizzle-orm";
import { getDb } from "../../../../db";
import { orders } from "../../../../db/schema";
import { sendPurchase } from "../../../../server/meta";
import { isValidWebhookSignature } from "../../../../server/veopag";

/**
 * Recebe a confirmação de pagamento da VeoPag.
 *
 * Este endpoint é o único caminho que marca um pedido como pago. Ele é público
 * na internet, então a assinatura HMAC não é opcional: sem ela, qualquer pessoa
 * que descobrisse a URL poderia declarar pedidos pagos e receber sopa de graça.
 *
 * A VeoPag desiste em 8 segundos, então a resposta precisa ser rápida.
 */
export async function POST(request: Request) {
  // O corpo bruto precisa ser lido antes de qualquer parse: a assinatura cobre
  // os bytes exatos que chegaram. Reserializar o JSON muda espaços e ordem de
  // chaves, e a assinatura para de bater.
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

  if (!process.env.VEOPAG_WEBHOOK_SECRET) {
    // 503 e não 200: a VeoPag reenvia, e a confirmação não se perde enquanto a
    // variável não é configurada. Confirmar sem poder verificar seria pior.
    console.error("VEOPAG_WEBHOOK_SECRET ausente; webhook recusado sem verificar");
    return new Response("webhook não configurado", { status: 503 });
  }

  let authentic = false;
  try {
    authentic = await isValidWebhookSignature(rawBody, signature, timestamp);
  } catch (error) {
    console.error("Falha ao verificar assinatura do webhook", error);
    return new Response("erro", { status: 500 });
  }

  if (!authentic) {
    console.warn("Webhook com assinatura inválida recusado");
    return new Response("assinatura inválida", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === "string" && value) return value;
    }
    return null;
  };

  const externalId = pick("external_id", "externalId");
  const transactionId = pick("transaction_id", "transactionId", "id");
  const status = (pick("status") ?? "").toUpperCase();
  const endToEnd = pick("end_to_end", "endToEnd", "e2e");

  if (!externalId && !transactionId) {
    return new Response("sem identificador", { status: 400 });
  }

  // Status desconhecido não deve virar "pago" por descuido.
  const novoStatus = status === "COMPLETED" ? "paid" : status === "FAILED" ? "failed" : null;
  if (!novoStatus) {
    console.warn("Webhook com status ignorado:", status);
    return new Response("ok", { status: 200 });
  }

  try {
    const db = getDb();
    const condition = externalId
      ? transactionId
        ? or(eq(orders.id, externalId), eq(orders.transactionId, transactionId))
        : eq(orders.id, externalId)
      : eq(orders.transactionId, transactionId!);

    await db
      .update(orders)
      .set({
        status: novoStatus,
        paidAt: novoStatus === "paid" ? Math.floor(Date.now() / 1000) : null,
        endToEnd,
        ...(transactionId ? { transactionId } : {}),
      })
      .where(condition);

    if (novoStatus === "paid") await avisarMeta(condition);
  } catch (error) {
    // Devolver erro faz a VeoPag reenviar, que é o comportamento desejado:
    // perder uma confirmação significa cliente pagando e cozinha sem saber.
    console.error("Falha ao atualizar pedido pelo webhook", externalId, error);
    return new Response("erro ao gravar", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

/**
 * Avisa o Meta que a compra aconteceu.
 *
 * Roda depois de gravar o pagamento e nunca derruba o webhook: se o Meta estiver
 * fora do ar, o pedido continua pago e a cozinha continua vendo. Perder um evento
 * de anúncio é ruim; perder um pedido é muito pior.
 *
 * `purchaseSentAt` existe porque a VeoPag reenvia o webhook em caso de falha —
 * sem essa marca, a mesma venda seria contada de novo a cada reenvio.
 */
async function avisarMeta(condition: SQL<unknown> | undefined) {
  if (!condition) return;
  try {
    const db = getDb();
    const [order] = await db.select().from(orders).where(condition).limit(1);
    if (!order || order.purchaseSentAt) return;

    const items = JSON.parse(order.items) as { id: string; quantity: number }[];
    const resultado = await sendPurchase({
      orderId: order.id,
      value: order.total,
      contents: items,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      fbp: order.fbp,
      fbclid: order.fbclid,
      clientIp: order.clientIp,
      userAgent: order.userAgent,
      createdAt: order.createdAt,
    });

    if (resultado.sent) {
      await db
        .update(orders)
        .set({ purchaseSentAt: Math.floor(Date.now() / 1000) })
        .where(eq(orders.id, order.id));
    } else {
      console.warn("Purchase não enviado ao Meta:", order.id, resultado.reason);
    }
  } catch (error) {
    console.error("Falha ao avisar o Meta", error);
  }
}
