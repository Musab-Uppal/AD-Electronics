import { createCustomer, isUniqueViolation, listCustomers } from "@/lib/db";
import { withApiAuth } from "@/lib/session";

export default withApiAuth(async function handler(req, res) {
  if (req.method === "GET") {
    const search = String(req.query.q || "").trim();

    const rows = await listCustomers(search);
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { name, phone, address, id_card_no } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const normalizedPhone = String(phone).trim();

    try {
      await createCustomer({
        phone: normalizedPhone,
        name: String(name).trim(),
        address: address ? String(address).trim() : null,
        id_card_no: id_card_no ? String(id_card_no).trim() : null,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return res.status(409).json({ message: "Phone number already exists" });
      }

      throw error;
    }

    return res.status(201).json({ message: "Customer created" });
  }

  return res.status(405).json({ message: "Method not allowed" });
});
