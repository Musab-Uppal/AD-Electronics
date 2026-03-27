import { withApiAuth } from "@/lib/session";

export default withApiAuth(async function handler(req, res, session) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await session.destroy();
  return res.status(200).json({ message: "Logged out" });
});
