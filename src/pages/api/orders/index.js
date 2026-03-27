import { query } from "@/lib/db";
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

    let sql = `
      SELECT id, customer_name, customer_phone, items, total, advance_payment, remaining_balance,
             purchase_date, next_payment_date, is_complete
      FROM orders
    `;

    const clauses = [];
    const params = [];

    if (filter === "pending") {
      clauses.push("is_complete = FALSE");
    }

    if (filter === "complete") {
      clauses.push("is_complete = TRUE");
    }

    if (phone) {
      clauses.push("customer_phone = ?");
      params.push(phone);
    }

    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(" AND ")}`;
    }

    sql += " ORDER BY purchase_date DESC, id DESC";

    const rows = await query(sql, params);

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

    const customerRows = await query(
      "SELECT name, phone FROM customers WHERE phone = ?",
      [customer_phone],
    );

    if (customerRows.length === 0) {
      return res
        .status(400)
        .json({ message: "Selected customer does not exist" });
    }

    const totalNumber = toNumber(total);
    const advanceNumber = toNumber(advance_payment, 0);
    const calculatedRemaining = Number(
      (totalNumber - advanceNumber).toFixed(2),
    );
    const completeFromBalance = calculatedRemaining <= 0;
    const finalIsComplete = parseBoolean(is_complete) || completeFromBalance;

    const insertResult = await query(
      `
        INSERT INTO orders (
          customer_phone, customer_name, items, total, advance_payment,
          remaining_balance, purchase_date, next_payment_date, is_complete
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        customerRows[0].phone,
        customerRows[0].name,
        String(items).trim(),
        totalNumber,
        advanceNumber,
        finalIsComplete ? 0 : Math.max(calculatedRemaining, 0),
        purchase_date,
        next_payment_date || null,
        finalIsComplete,
      ],
    );

    return res.status(201).json({
      message: "Order created",
      id: insertResult.insertId,
    });
  }

  return res.status(405).json({ message: "Method not allowed" });
});
