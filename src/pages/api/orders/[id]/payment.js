import { ensureTables, getPool } from "@/lib/db";
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

  await ensureTables();
  const db = getPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT remaining_balance, is_complete FROM orders WHERE id = ? LIMIT 1 FOR UPDATE",
      [id],
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    if (rows[0].is_complete) {
      await connection.rollback();
      return res.status(400).json({ message: "Order is already complete" });
    }

    const currentRemaining = Number(rows[0].remaining_balance);
    const updatedRemaining = Number(
      Math.max(0, currentRemaining - paymentAmount).toFixed(2),
    );
    const isComplete = updatedRemaining <= 0;

    await connection.query(
      `
        UPDATE orders
        SET remaining_balance = ?, next_payment_date = ?, is_complete = ?
        WHERE id = ?
      `,
      [updatedRemaining, next_payment_date, isComplete, id],
    );

    await connection.query(
      `
        INSERT INTO order_payments (order_id, amount, payment_date, payment_source)
        VALUES (?, ?, NOW(), 'installment')
      `,
      [id, paymentAmount],
    );

    await connection.commit();

    return res.status(200).json({
      message: "Payment applied",
      remaining_balance: updatedRemaining,
      is_complete: isComplete,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
