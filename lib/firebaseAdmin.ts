// lib/firebaseAdmin.ts
// Server-side Firebase Admin SDK initialization
import admin from 'firebase-admin';

let app: admin.app.App;

console.log("🔵 [FIREBASE-ADMIN] Initializing Firebase Admin SDK");

try {
  // Check if already initialized
  app = admin.app();
  console.log("✅ [FIREBASE-ADMIN] Already initialized");
} catch (error) {
  console.log("🔵 [FIREBASE-ADMIN] First initialization");
  // Initialize Firebase Admin
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccountString) {
    console.error("🔴 [FIREBASE-ADMIN] FIREBASE_SERVICE_ACCOUNT_JSON NOT SET");
    console.error("🔴 [FIREBASE-ADMIN] Available env vars:", Object.keys(process.env).filter(k => k.includes('FIREBASE')));
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set');
  }
  
  console.log("✅ [FIREBASE-ADMIN] Env var found, parsing JSON");

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountString);
    console.log("✅ [FIREBASE-ADMIN] JSON parsed, project_id:", serviceAccount.project_id);
  } catch (e) {
    console.error("🔴 [FIREBASE-ADMIN] JSON parse error:", e);
    throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  try {
    console.log("🔵 [FIREBASE-ADMIN] Initializing app");
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    console.log("✅ [FIREBASE-ADMIN] App initialized successfully");
  } catch (initError) {
    console.error("🔴 [FIREBASE-ADMIN] Initialization error:", initError);
    throw initError;
  }
}

export const db = app.firestore();
export const auth = app.auth();

export default admin;
