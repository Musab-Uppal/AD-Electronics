import { applyOrderPayment, getOrderById } from "@/lib/db";
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
  const { amount, payment_date, next_payment_date } = req.body || {};

  const paymentAmount = toNumber(amount, -1);

  if (paymentAmount <= 0 || !payment_date || !next_payment_date) {
    return res
      .status(400)
      .json({
        message: "Amount, payment date, and next payment date are required",
      });
  }

  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const order = await getOrderById(orderId);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.is_complete) {
    return res.status(400).json({ message: "Order is already complete" });
  }

  try {
    const result = await applyOrderPayment({
      id: orderId,
      amount: paymentAmount,
      paymentDate: payment_date,
      nextPaymentDate: next_payment_date,
    });

    return res.status(200).json({
      message: "Payment applied",
      remaining_balance: result.remaining_balance,
      is_complete: result.is_complete,
    });
  } catch (error) {
    if (String(error?.message || "").includes("ORDER_ALREADY_COMPLETE")) {
      return res.status(400).json({ message: "Order is already complete" });
    }

    if (String(error?.message || "").includes("ORDER_NOT_FOUND")) {
      return res.status(404).json({ message: "Order not found" });
    }

    throw error;
  }
});
