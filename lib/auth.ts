// frontend/lib/auth.ts
import { createHmac } from "crypto";
import { jwtVerify, SignJWT } from "jose";

const SECRET_KEY = (import.meta.env.VITE_SECRET_KEY || import.meta.env.REACT_APP_SECRET_KEY || "your-secret-key-change-in-production") as string;
const ALGORITHM = "HS256";
const ACCESS_TOKEN_EXPIRE_MINUTES = 30;

// Hash password using simple approach for client-side
export async function hashPassword(password: string): Promise<string> {
  // For production, use bcryptjs on both client and server
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Verify password
export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  const plainHashed = await hashPassword(plain);
  return plainHashed === hashed;
}

// Create JWT token
export async function createAccessToken(data: Record<string, any>): Promise<string> {
  const secret = new TextEncoder().encode(SECRET_KEY);
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: ALGORITHM })
    .setExpirationTime(`${ACCESS_TOKEN_EXPIRE_MINUTES}m`)
    .sign(secret);
  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<Record<string, any> | null> {
  try {
    const secret = new TextEncoder().encode(SECRET_KEY);
    const verified = await jwtVerify(token, secret);
    return verified.payload as Record<string, any>;
  } catch (error) {
    return null;
  }
}

// Store token in localStorage
export function setAccessToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
}

// Get token from localStorage
export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

// Remove token
export function removeAccessToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
}
