import { query } from "@/lib/db";
import { withApiAuth } from "@/lib/session";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default withApiAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const { amount, next_payment_date } = req.body || {};

  const paymentAmount = toNumber(amount, -1);

  if (paymentAmount <= 0 || !next_payment_date) {
    return res
      .status(400)
      .json({ message: "Amount and next payment date are required" });
  }

  const rows = await query(
    "SELECT remaining_balance, is_complete FROM orders WHERE id = ? LIMIT 1",
    [id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (rows[0].is_complete) {
    return res.status(400).json({ message: "Order is already complete" });
  }

  const currentRemaining = Number(rows[0].remaining_balance);
  const updatedRemaining = Number(
    (currentRemaining - paymentAmount).toFixed(2),
  );
  const isComplete = updatedRemaining <= 0;

  await query(
    `
      UPDATE orders
      SET remaining_balance = ?, next_payment_date = ?, is_complete = ?
      WHERE id = ?
    `,
    [isComplete ? 0 : updatedRemaining, next_payment_date, isComplete, id],
  );

  return res.status(200).json({
    message: "Payment applied",
    remaining_balance: isComplete ? 0 : updatedRemaining,
    is_complete: isComplete,
  });
});
