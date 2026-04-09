import {
  deleteOrderById,
  getCustomerByPhone,
  getOrderById,
  listOrderPayments,
  updateOrderById,
} from "@/lib/db";
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

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export default withApiAuth(async function handler(req, res) {
  const { id } = req.query;
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  if (req.method === "GET") {
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
  }

  if (req.method === "PUT") {
    const {
      customer_phone,
      overall_time,
      items,
      purchase_date,
      next_payment_date,
      is_complete,
    } = req.body || {};

    if (!customer_phone || !items || !purchase_date) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    const customer = await getCustomerByPhone(String(customer_phone).trim());

    if (!customer) {
      return res
        .status(400)
        .json({ message: "Selected customer does not exist" });
    }

    const overallTimeRaw =
      overall_time === undefined || overall_time === null
        ? ""
        : String(overall_time).trim();
    const normalizedOverallTime =
      overallTimeRaw === "" ? null : Math.floor(toNumber(overallTimeRaw, -1));

    if (normalizedOverallTime === null || normalizedOverallTime <= 0) {
      return res.status(400).json({
        message: "Overall time must be a positive integer",
      });
    }

    const updatedId = await updateOrderById({
      id: orderId,
      customerPhone: customer.phone,
      customerName: customer.name,
      overallTime: normalizedOverallTime,
      items: String(items).trim(),
      purchaseDate: purchase_date,
      nextPaymentDate: next_payment_date || null,
      isComplete: parseBoolean(is_complete),
    });

    if (!updatedId) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order updated",
      id: updatedId,
    });
  }

  if (req.method === "DELETE") {
    const deleted = await deleteOrderById(orderId);

    if (!deleted) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ message: "Order deleted" });
  }

  return res.status(405).json({ message: "Method not allowed" });
});
