import { getOrderById, listOrderPayments } from "@/lib/db";
import { withApiAuth } from "@/lib/session";

function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

export default withApiAuth(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const [order, payments] = await Promise.all([
    getOrderById(orderId),
    listOrderPayments(orderId),
  ]);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.status(200).json({
    ...order,
    purchase_date: formatDate(order.purchase_date),
    next_payment_date: formatDate(order.next_payment_date),
    payments: payments.map((payment) => ({
      ...payment,
      payment_date: formatDateTime(payment.payment_date),
    })),
  });
});
