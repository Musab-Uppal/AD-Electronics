import { validateAdminCredentials } from "@/lib/auth";
import { getSession } from "@/lib/session";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const isValid = validateAdminCredentials(
      String(username),
      String(password),
    );

    if (!isValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const session = await getSession(req, res);
    session.user = {
      username,
      isLoggedIn: true,
    };

    await session.save();

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Login failed" });
  }
}
