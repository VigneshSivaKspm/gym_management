#!/usr/bin/env node
/**
 * Simple script to create an admin account directly in Firestore
 * Usage: node scripts/create-admin.js
 */

import admin from "firebase-admin";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function createAdmin() {
  try {
    console.log("🔵 Starting Firebase Admin initialization...");

    // Initialize Firebase Admin
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountString) {
      throw new Error("❌ FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local");
    }

    const serviceAccount = JSON.parse(serviceAccountString);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    const db = admin.firestore();
    console.log("✅ Firebase initialized");

    // Get input from command line or use defaults
    const email = process.argv[2] || "admin@gym.com";
    const password = process.argv[3] || "admin123456";
    const name = process.argv[4] || "Admin User";

    console.log("📝 Creating admin account...");
    console.log({ email, name });

    // Hash password
    console.log("🔵 Hashing password...");
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed");

    // Create user document
    const userId = uuidv4();
    const userData = {
      id: userId,
      email,
      password_hash: passwordHash,
      name,
      phone: "",
      role: "ADMIN",
      is_active: true,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    console.log("🔵 Writing to Firestore...");
    await db.collection("users").doc(userId).set(userData);
    console.log("✅ Admin account created successfully!");
    console.log("📋 Admin Details:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${userId}`);

    await admin.app().delete();
    console.log("✅ Connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();
