import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Um pedido da Sopa Boa.
 *
 * O `id` é o mesmo valor enviado como `external_id` para a VeoPag, o que torna a
 * criação de cobrança idempotente: repetir a chamada com o mesmo id não gera
 * duas cobranças.
 *
 * O endereço mora aqui porque antes não morava em lugar nenhum — era digitado no
 * site, guardado no navegador do próprio cliente e perdido no redirecionamento.
 * A cozinha tinha que perguntar tudo de novo por WhatsApp.
 */
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),

    // pending -> paid | failed. Só o webhook assinado promove para paid.
    status: text("status").notNull().default("pending"),
    paidAt: integer("paid_at"),

    // JSON: [{ id, name, quantity, unitPrice }]
    items: text("items").notNull(),
    total: real("total").notNull(),

    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerDocument: text("customer_document").notNull(),

    addressCep: text("address_cep").notNull(),
    addressStreet: text("address_street").notNull(),
    addressNumber: text("address_number").notNull(),
    addressComplement: text("address_complement"),
    addressNeighborhood: text("address_neighborhood").notNull(),
    addressReference: text("address_reference"),
    notes: text("notes"),

    // Identificadores da VeoPag, para conciliar com o painel deles.
    transactionId: text("transaction_id"),
    endToEnd: text("end_to_end"),

    // Origem do clique. Guardado para atribuir a venda ao anúncio certo e para
    // enviar o Purchase pela Conversions API com dados de correspondência.
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    fbclid: text("fbclid"),
    fbp: text("fbp"),
    clientIp: text("client_ip"),
    userAgent: text("user_agent"),

    // Evita mandar a mesma compra duas vezes ao Meta se o webhook repetir.
    purchaseSentAt: integer("purchase_sent_at"),
  },
  (table) => [
    index("orders_status_created_idx").on(table.status, table.createdAt),
    index("orders_transaction_idx").on(table.transactionId),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
