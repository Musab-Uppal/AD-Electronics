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

  const { phone } = req.query;
  const customerRows = await query(
    "SELECT phone, name, address, id_card_no FROM customers WHERE phone = ?",
    [phone],
  );

  if (customerRows.length === 0) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const orders = await query(
    `
      SELECT id, customer_name, customer_phone, items, total, advance_payment, remaining_balance,
             purchase_date, next_payment_date, is_complete
      FROM orders
      WHERE customer_phone = ?
      ORDER BY purchase_date DESC, id DESC
    `,
    [phone],
  );

  const formattedOrders = orders.map((order) => ({
    ...order,
    purchase_date: formatDate(order.purchase_date),
    next_payment_date: formatDate(order.next_payment_date),
  }));

  return res.status(200).json({
    customer: customerRows[0],
    orders: formattedOrders,
  });
});
