import {
  deleteCustomerByPhone,
  getDatabaseConnectionHelpMessage,
  getCustomerByPhone,
  isDatabaseConnectionError,
  isUniqueViolation,
  listOrdersByCustomerPhone,
  updateCustomerAndOrders,
} from "@/lib/db";
import { withApiAuth } from "@/lib/session";

function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default withApiAuth(async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { phone } = req.query;
      const normalizedPhone = String(phone || "").trim();
      const customer = await getCustomerByPhone(normalizedPhone);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const orders = await listOrdersByCustomerPhone(normalizedPhone);

      const formattedOrders = orders.map((order) => ({
        ...order,
        purchase_date: formatDate(order.purchase_date),
        next_payment_date: formatDate(order.next_payment_date),
      }));

      return res.status(200).json({
        customer,
        orders: formattedOrders,
      });
    }

    if (req.method === "PUT") {
      const { phone } = req.query;
      const {
        name,
        phone: nextPhoneInput,
        address,
        id_card_no,
      } = req.body || {};

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const currentPhone = String(phone || "").trim();
      const nextPhone = String(nextPhoneInput || currentPhone).trim();

      if (!nextPhone) {
        return res.status(400).json({ message: "Phone is required" });
      }

      const customer = await getCustomerByPhone(currentPhone);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      if (nextPhone !== currentPhone) {
        const existingWithNextPhone = await getCustomerByPhone(nextPhone);

        if (existingWithNextPhone) {
          return res
            .status(409)
            .json({ message: "Phone number already exists" });
        }
      }

      try {
        await updateCustomerAndOrders({
          currentPhone,
          nextPhone,
          name: String(name).trim(),
          address: address ? String(address).trim() : null,
          idCardNo: id_card_no ? String(id_card_no).trim() : null,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          return res
            .status(409)
            .json({ message: "Phone number already exists" });
        }

        throw error;
      }

      return res.status(200).json({
        message: "Customer updated",
        customer_phone: nextPhone,
      });
    }

    if (req.method === "DELETE") {
      const { phone } = req.query;
      const normalizedPhone = String(phone || "").trim();

      if (!normalizedPhone) {
        return res.status(400).json({ message: "Phone is required" });
      }

      const deleted = await deleteCustomerByPhone(normalizedPhone);

      if (!deleted) {
        return res.status(404).json({ message: "Customer not found" });
      }

      return res.status(200).json({ message: "Customer deleted" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    if (error?.code === "23503") {
      return res.status(409).json({
        message:
          "Customer cannot be deleted because related records are protected by a foreign key constraint.",
      });
    }

    if (isDatabaseConnectionError(error)) {
      return res.status(503).json({
        message: getDatabaseConnectionHelpMessage(),
      });
    }

    return res.status(500).json({
      message: error?.message || "Failed to process customer request",
    });
  }
});
