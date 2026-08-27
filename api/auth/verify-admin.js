/**
 * Vercel Serverless Function: Verify Admin Status
 * POST /api/auth/verify-admin
 *
 * Verifies if a user is an admin by checking Firestore
 * Uses Firebase Admin SDK with proper credentials
 */

import admin from "firebase-admin";

// Initialize Firebase Admin singleton
let db = null;
let auth = null;

function initializeFirebase() {
  if (db && auth) return true; // Already initialized

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountString) {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not found in environment");
      return false;
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    db = admin.firestore();
    auth = admin.auth();
    console.log("✅ Firebase Admin SDK initialized");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error.message);
    return false;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Initialize Firebase
    if (!initializeFirebase()) {
      return res.status(500).json({
        error: "Service unavailable",
        details: "Firebase Admin SDK initialization failed",
      });
    }

    const { email } = req.body;
    const authHeader = req.headers.authorization;

    console.log(`📡 [VERIFY-ADMIN] Request received for email: ${email}`);

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
        details: "Request body must include email field",
      });
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("⚠️ Missing or invalid authorization header");
      return res.status(401).json({
        error: "Unauthorized",
        details: "Missing or invalid authorization header",
      });
    }

    const idToken = authHeader.substring(7); // Remove "Bearer " prefix

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log(
        `✅ [VERIFY-ADMIN] ID token verified for user: ${decodedToken.uid}`,
      );
    } catch (error) {
      console.warn(`⚠️ [VERIFY-ADMIN] Invalid ID token: ${error.message}`);
      return res.status(401).json({
        error: "Unauthorized",
        details: "Invalid or expired ID token",
      });
    }

    // Verify the email matches the authenticated user
    if (decodedToken.email && decodedToken.email !== email) {
      console.warn(
        `⚠️ [VERIFY-ADMIN] Email mismatch: token has ${decodedToken.email}, request has ${email}`,
      );
      return res.status(403).json({
        error: "Forbidden",
        details: "Email mismatch with authenticated user",
      });
    }

    const userId = decodedToken.uid;

    console.log(`🔍 [VERIFY-ADMIN] Checking admin status for user: ${userId}`);

    let userDoc;
    try {
      userDoc = await db.collection("users").doc(userId).get();
    } catch (error) {
      console.error(
        `❌ [VERIFY-ADMIN] Firestore query error: ${error.message}`,
      );
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }

    if (!userDoc.exists) {
      console.log(`⚠️ [VERIFY-ADMIN] User document not found for ${userId}`);
      return res.status(404).json({
        isAdmin: false,
        message: "User profile not found in database",
        email,
        userId,
      });
    }

    const userData = userDoc.data();
    const isAdmin = userData?.role === "ADMIN";
    const userRole = userData?.role || "TRAINEE";

    console.log(
      `✅ [VERIFY-ADMIN] User ${email} (${userId}) admin status: ${isAdmin} (role: ${userRole})`,
    );

    return res.status(200).json({
      success: true,
      isAdmin,
      role: userRole,
      email: userData?.email || email,
      userId,
    });
  } catch (error) {
    console.error("❌ [VERIFY-ADMIN] Unexpected error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
