// lib/firebaseAdmin.ts
// Server-side Firebase Admin SDK initialization
import admin from 'firebase-admin';

let app: admin.app.App;

try {
  // Check if already initialized
  app = admin.app();
} catch (error) {
  // Initialize Firebase Admin
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccountString) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountString);
  } catch (e) {
    throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
}

export const db = app.firestore();
export const auth = app.auth();

export default admin;
