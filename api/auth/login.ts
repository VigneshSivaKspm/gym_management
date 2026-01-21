// frontend/api/auth/login.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import firebaseService from "../../lib/firebaseService";
import { verifyPassword, createAccessToken } from "../../lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    // Get user by email
    const user = await firebaseService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if active
    if (!user.is_active) {
      return res.status(403).json({ message: "Account disabled" });
    }

    // Create access token
    const accessToken = await createAccessToken({ sub: user.id });

    // Get profile data
    let profileData = null;
    if (user.role === "TRAINER") {
      profileData = await firebaseService.getTrainerByUserId(user.id);
    } else if (user.role === "TRAINEE") {
      profileData = await firebaseService.getTraineeByUserId(user.id);
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        access_token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        profile: profileData,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
