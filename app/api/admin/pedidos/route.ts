import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { orders } from "../../../../db/schema";

/**
 * Lista os pedidos para o painel da cozinha.
 *
 * Devolve nome, telefone e endereço, então exige o ADMIN_TOKEN. A comparação é
 * timing-safe para não permitir descobrir a senha medindo o tempo de resposta.
 */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function GET(request: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    console.error("ADMIN_TOKEN não configurado; painel bloqueado por segurança");
    return Response.json({ error: "painel não configurado" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !timingSafeEqual(provided, expected)) {
    return Response.json({ error: "não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const somentePagos = url.searchParams.get("status") === "paid";

  try {
    const base = getDb().select().from(orders);
    const rows = await (somentePagos ? base.where(eq(orders.status, "paid")) : base)
      .orderBy(desc(orders.createdAt))
      .limit(100);

    return Response.json(
      {
        orders: rows.map((order) => ({
          ...order,
          items: JSON.parse(order.items) as { id: string; name: string; quantity: number }[],
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Falha ao listar pedidos", error);
    return Response.json({ error: "erro ao listar" }, { status: 500 });
  }
}
