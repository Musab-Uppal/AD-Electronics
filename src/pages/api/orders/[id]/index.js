import { query } from "@/lib/db";
import { withApiAuth } from "@/lib/session";

function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default withApiAuth(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const rows = await query(
    `
      SELECT id, customer_name, customer_phone, items, total, advance_payment, remaining_balance,
             purchase_date, next_payment_date, is_complete
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.status(200).json({
    ...rows[0],
    purchase_date: formatDate(rows[0].purchase_date),
    next_payment_date: formatDate(rows[0].next_payment_date),
  });
});
