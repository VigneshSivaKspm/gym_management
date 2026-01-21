#!/usr/bin/env node
/**
 * Simple script to create an admin account in Firestore using Firestore REST API
 * Usage: node scripts/create-admin-rest.js <email> <password> <name>
 */

import fetch from "node-fetch";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function createAdminViaRest() {
  try {
    const projectId = "disaster-management-4";
    const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
    
    // Get input from command line
    const email = process.argv[2] || "admin@test.com";
    const password = process.argv[3] || "Admin@12345";
    const name = process.argv[4] || "Admin User";

    console.log("🔵 Creating admin account via Firestore REST API...");
    console.log({ email, name });

    // Hash password
    console.log("🔵 Hashing password...");
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed");

    const userId = uuidv4();
    const now = new Date().toISOString();

    const userData = {
      fields: {
        id: { stringValue: userId },
        email: { stringValue: email },
        password_hash: { stringValue: passwordHash },
        name: { stringValue: name },
        phone: { stringValue: "" },
        role: { stringValue: "ADMIN" },
        is_active: { booleanValue: true },
        is_verified: { booleanValue: true },
        created_at: { timestampValue: now },
        updated_at: { timestampValue: now },
      },
    };

    console.log("🔵 Writing to Firestore via REST API...");

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?key=${apiKey}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`REST API error: ${response.status} - ${error}`);
    }

    console.log("✅ Admin account created successfully!");
    console.log("📋 Admin Details:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${userId}`);
    console.log("\n✅ You can now login with these credentials!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAdminViaRest();
