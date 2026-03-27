import { getDashboardData } from "@/lib/dashboard";
import {
  getDatabaseConnectionHelpMessage,
  isDatabaseConnectionError,
} from "@/lib/db";
import { withApiAuth } from "@/lib/session";

export default withApiAuth(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = await getDashboardData();
    return res.status(200).json(data);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res
        .status(503)
        .json({ message: getDatabaseConnectionHelpMessage() });
    }

    return res.status(500).json({ message: "Failed to load dashboard data" });
  }
});
