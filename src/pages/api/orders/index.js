import {
  createOrderWithAdvance,
  getCustomerByPhone,
  listOrders,
} from "@/lib/db";
import { withApiAuth } from "@/lib/session";

function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export default withApiAuth(async function handler(req, res) {
  if (req.method === "GET") {
    const filter = String(req.query.filter || "all");
    const phone = String(req.query.phone || "").trim();

    const rows = await listOrders({ filter, phone });

    return res.status(200).json(
      rows.map((order) => ({
        ...order,
        purchase_date: formatDate(order.purchase_date),
        next_payment_date: formatDate(order.next_payment_date),
      })),
    );
  }

  if (req.method === "POST") {
    const {
      customer_phone,
      overall_time,
      items,
      total,
      advance_payment,
      purchase_date,
      next_payment_date,
      is_complete,
    } = req.body || {};

    if (
      !customer_phone ||
      !items ||
      total === undefined ||
      total === null ||
      !purchase_date
    ) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    const customer = await getCustomerByPhone(String(customer_phone).trim());

    if (!customer) {
      return res
        .status(400)
        .json({ message: "Selected customer does not exist" });
    }

    const totalNumber = toNumber(total);
    const advanceNumber = toNumber(advance_payment, 0);
    const normalizedOverallTime =
      overall_time === undefined || overall_time === null || overall_time === ""
        ? null
        : Math.floor(toNumber(overall_time, -1));

    if (normalizedOverallTime !== null && normalizedOverallTime <= 0) {
      return res.status(400).json({
        message: "Overall time must be a positive integer",
      });
    }

    const calculatedRemaining = Number(
      (totalNumber - advanceNumber).toFixed(2),
    );
    const completeFromBalance = calculatedRemaining <= 0;
    const finalIsComplete = parseBoolean(is_complete) || completeFromBalance;

    const insertId = await createOrderWithAdvance({
      customerPhone: customer.phone,
      overallTime: normalizedOverallTime,
      items: String(items).trim(),
      total: totalNumber,
      advancePayment: advanceNumber,
      purchaseDate: purchase_date,
      nextPaymentDate: next_payment_date || null,
      isComplete: finalIsComplete,
    });

    return res.status(201).json({
      message: "Order created",
      id: insertId,
    });
  }

  return res.status(405).json({ message: "Method not allowed" });
});
