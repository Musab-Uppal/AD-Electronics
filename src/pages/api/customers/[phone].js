import { ensureTables, getPool, query } from "@/lib/db";
import { withApiAuth } from "@/lib/session";

function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default withApiAuth(async function handler(req, res) {
  if (req.method === "GET") {
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
  }

  if (req.method === "PUT") {
    const { phone } = req.query;
    const { name, phone: nextPhoneInput, address, id_card_no } = req.body || {};

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const currentPhone = String(phone || "").trim();
    const nextPhone = String(nextPhoneInput || currentPhone).trim();

    if (!nextPhone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const customerRows = await query(
      "SELECT phone FROM customers WHERE phone = ? LIMIT 1",
      [currentPhone],
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (nextPhone !== currentPhone) {
      const existingWithNextPhone = await query(
        "SELECT phone FROM customers WHERE phone = ? LIMIT 1",
        [nextPhone],
      );

      if (existingWithNextPhone.length > 0) {
        return res.status(409).json({ message: "Phone number already exists" });
      }
    }

    await ensureTables();
    const db = getPool();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (nextPhone !== currentPhone) {
        await connection.query(
          "INSERT INTO customers (phone, name, address, id_card_no) VALUES (?, ?, ?, ?)",
          [
            nextPhone,
            String(name).trim(),
            address ? String(address).trim() : null,
            id_card_no ? String(id_card_no).trim() : null,
          ],
        );

        await connection.query(
          "UPDATE orders SET customer_phone = ?, customer_name = ? WHERE customer_phone = ?",
          [nextPhone, String(name).trim(), currentPhone],
        );

        await connection.query("DELETE FROM customers WHERE phone = ?", [
          currentPhone,
        ]);
      } else {
        await connection.query(
          "UPDATE customers SET name = ?, address = ?, id_card_no = ? WHERE phone = ?",
          [
            String(name).trim(),
            address ? String(address).trim() : null,
            id_card_no ? String(id_card_no).trim() : null,
            currentPhone,
          ],
        );

        await connection.query(
          "UPDATE orders SET customer_name = ? WHERE customer_phone = ?",
          [String(name).trim(), currentPhone],
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.status(200).json({
      message: "Customer updated",
      customer_phone: nextPhone,
    });
  }

  return res.status(405).json({ message: "Method not allowed" });
});
