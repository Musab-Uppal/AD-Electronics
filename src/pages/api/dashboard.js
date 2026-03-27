import { getDashboardData } from "@/lib/dashboard";
import { withApiAuth } from "@/lib/session";

export default withApiAuth(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const data = await getDashboardData();
  return res.status(200).json(data);
});
