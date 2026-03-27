import { query } from "@/lib/db";
import { withApiAuth } from "@/lib/session";

export default withApiAuth(async function handler(req, res) {
  if (req.method === "GET") {
    const search = String(req.query.q || "").trim();

    let sql = "SELECT phone, name, address, id_card_no FROM customers";
    const params = [];

    if (search) {
      sql += " WHERE name LIKE ? OR phone LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY name ASC";

    const rows = await query(sql, params);
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { name, phone, address, id_card_no } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const normalizedPhone = String(phone).trim();
    const existing = await query(
      "SELECT phone FROM customers WHERE phone = ?",
      [normalizedPhone],
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Phone number already exists" });
    }

    await query(
      "INSERT INTO customers (phone, name, address, id_card_no) VALUES (?, ?, ?, ?)",
      [
        normalizedPhone,
        String(name).trim(),
        address ? String(address).trim() : null,
        id_card_no ? String(id_card_no).trim() : null,
      ],
    );

    return res.status(201).json({ message: "Customer created" });
  }

  return res.status(405).json({ message: "Method not allowed" });
});
