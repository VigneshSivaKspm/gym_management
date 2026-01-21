// frontend/api/auth/register.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import firebaseAdminService from "../../lib/firebaseAdminService";
import { hashPassword } from "../../lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password, name, phone, role = "TRAINEE", admin_code } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password too short (min 6 chars)" });
    }

    // Validate admin code if registering as ADMIN
    if (role && role.toUpperCase() === "ADMIN") {
      const expectedAdminCode = process.env.ADMIN_SECRET_CODE || "ADMIN_SECRET_2024";
      if (!admin_code || admin_code !== expectedAdminCode) {
        return res.status(403).json({ message: "Invalid admin code" });
      }
    }

    // Check if user exists
    const existing = await firebaseAdminService.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with phone if provided
    const user = await firebaseAdminService.createUser(
      email,
      passwordHash,
      name,
      role.toUpperCase(),
      phone
    );

    // Create profile based on role
    if (role.toUpperCase() === "TRAINER") {
      await firebaseAdminService.createTrainer(user.id);
    } else if (role.toUpperCase() === "TRAINEE") {
      await firebaseAdminService.createTrainee(user.id);
    }
    // ADMIN role doesn't need a separate profile table

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
