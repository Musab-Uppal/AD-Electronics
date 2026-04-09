import {
  createCustomer,
  getCustomerByPhone,
  isUniqueViolation,
  listCustomers,
} from "@/lib/db";
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

    const normalizedName = String(name).trim();
    const normalizedPhone = String(phone).trim();

    if (!normalizedName || !normalizedPhone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const existingCustomer = await getCustomerByPhone(normalizedPhone);

    if (existingCustomer) {
      return res.status(409).json({
        message: "Customer with this phone number already exists",
      });
    }

    try {
      await createCustomer({
        phone: normalizedPhone,
        name: normalizedName,
        address: address ? String(address).trim() : null,
        id_card_no: id_card_no ? String(id_card_no).trim() : null,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return res.status(409).json({
          message: "Customer with this phone number already exists",
        });
      }

      throw error;
    }

    return res.status(201).json({ message: "Customer created" });
  }

  return res.status(405).json({ message: "Method not allowed" });
});
