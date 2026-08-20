import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { orders } from "../../../../db/schema";

/**
 * Status de um pedido, para a tela de pagamento saber quando o Pix caiu.
 *
 * Devolve só o status e o total. Nome, telefone e endereço não saem daqui: o id
 * do pedido viaja pela URL e não vale como senha.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return Response.json({ error: "id ausente" }, { status: 400 });

  try {
    const rows = await getDb()
      .select({ status: orders.status, total: orders.total })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    const order = rows[0];
    if (!order) return Response.json({ error: "pedido não encontrado" }, { status: 404 });

    return Response.json(
      { status: order.status, total: order.total },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Falha ao consultar pedido", id, error);
    return Response.json({ error: "erro ao consultar" }, { status: 500 });
  }
}
