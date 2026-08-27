#!/usr/bin/env node
/**
 * Script to create an admin account in both Firebase Auth and Firestore
 * Usage: node scripts/create-admin.js <email> <password> <name>
 */

import admin from "firebase-admin";
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
      throw new Error(
        "❌ FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local",
      );
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    const db = admin.firestore();
    const auth = admin.auth();

    console.log("✅ Firebase initialized");

    // Get input from command line or use defaults
    const email = process.argv[2] || "admin@gym.com";
    const password = process.argv[3] || "admin123456";
    const name = process.argv[4] || "Admin User";

    console.log("📝 Creating admin account...");
    console.log({ email, name });

    // Step 1: Check if user already exists
    console.log("🔵 Checking if user already exists...");
    let authUser;
    try {
      authUser = await auth.getUserByEmail(email);
      console.warn("⚠️ Firebase Auth user already exists for this email");
    } catch (error) {
      // User doesn't exist, which is expected
      console.log("✅ User doesn't exist in Firebase Auth (expected)");
    }

    // Step 2: Create Firebase Auth user with email and password
    if (!authUser) {
      console.log("🔵 Creating Firebase Auth user...");
      authUser = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
      console.log("✅ Firebase Auth user created:", authUser.uid);
    }

    const userId = authUser.uid;

    // Step 3: Store user profile in Firestore with matching UID
    console.log("🔵 Writing user profile to Firestore...");
    const userData = {
      id: userId,
      email,
      name,
      phone: "",
      role: "ADMIN",
      is_active: true,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.collection("users").doc(userId).set(userData);
    console.log("✅ Admin profile stored in Firestore");

    // Step 4: Set custom claims for admin role
    console.log("🔵 Setting custom claims for admin role...");
    await auth.setCustomUserClaims(userId, { admin: true, role: "ADMIN" });
    console.log("✅ Custom claims set");

    console.log("\n✅ Admin account created successfully!");
    console.log("📋 Admin Details:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID (Firebase UID): ${userId}`);
    console.log(`   Name: ${name}`);
    console.log(
      "\n💡 The admin can now login with these credentials at /admin/login",
    );

    await admin.app().delete();
    console.log("✅ Connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();
