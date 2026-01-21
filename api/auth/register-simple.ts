// Simplified registration endpoint that works directly with Firestore
import { VercelRequest, VercelResponse } from "@vercel/node";
import { hashPassword } from "../../lib/auth";
import { db } from "../../lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log("🔵 [REGISTER-SIMPLE] Request received");
  
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password, name, phone, role = "TRAINEE", admin_code } = req.body;
    console.log("🔵 [REGISTER-SIMPLE] Registering:", { email, name, role });

    // === VALIDATION ===
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing: email, password, name" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password min 6 characters" });
    }

    // === ADMIN CODE CHECK ===
    if (role === "ADMIN") {
      const expectedCode = process.env.ADMIN_SECRET_CODE || "admin123";
      console.log("🔵 [REGISTER-SIMPLE] Checking admin code");
      if (admin_code !== expectedCode) {
        return res.status(403).json({ message: "Invalid admin code" });
      }
    }

    // === CHECK EXISTING USER ===
    console.log("🔵 [REGISTER-SIMPLE] Checking for existing email");
    const existing = await db.collection("users").where("email", "==", email).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // === HASH PASSWORD ===
    console.log("🔵 [REGISTER-SIMPLE] Hashing password");
    const passwordHash = await hashPassword(password);

    // === CREATE USER ===
    const userId = uuidv4();
    console.log("🔵 [REGISTER-SIMPLE] Creating user:", userId);
    
    await db.collection("users").doc(userId).set({
      id: userId,
      email,
      password_hash: passwordHash,
      name,
      phone: phone || "",
      role: role.toUpperCase(),
      is_active: true,
      is_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log("✅ [REGISTER-SIMPLE] User created successfully");

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { id: userId, email, name, role },
    });
  } catch (error: any) {
    console.error("🔴 [REGISTER-SIMPLE] ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
}
