// Frontend Firebase Authentication Service
// Direct REST API calls - no backend required

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const ADMIN_SECRET_CODE = import.meta.env.VITE_ADMIN_SECRET_CODE || "admin123";

interface AuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TRAINER" | "TRAINEE";
  phone?: string;
}

// =====================================================
// GENERAL AUTH UTILITIES
// =====================================================

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "ADMIN" | "TRAINER" | "TRAINEE" = "TRAINEE",
  adminCode?: string,
  phone?: string
): Promise<{ success: true; user: UserProfile; token: string }> {
  console.log("📝 [REGISTER] Starting registration:", { email, name, role });

  // Validate inputs
  if (!email || !password || !name) {
    throw new Error("Missing required fields: email, password, name");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Admin code validation
  if (role === "ADMIN") {
    if (adminCode !== ADMIN_SECRET_CODE) {
      throw new Error("Invalid admin code");
    }
  }

  try {
    // Step 1: Create Firebase Auth user
    console.log("🔐 [REGISTER] Creating Firebase auth user");
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;

    const authResponse = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    if (!authResponse.ok) {
      const errorData = (await authResponse.json()) as any;
      console.error("❌ [REGISTER] Auth failed:", errorData);
      throw new Error(
        errorData.error?.message || "Failed to create user account"
      );
    }

    const authData = (await authResponse.json()) as AuthResponse;
    const userId = authData.localId;
    console.log("✅ [REGISTER] Firebase user created:", userId);

    // Step 2: Store user profile in Firestore
    console.log("📁 [REGISTER] Storing profile in Firestore");
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?key=${FIREBASE_API_KEY}`;

    const profileData = {
      fields: {
        email: { stringValue: email },
        name: { stringValue: name },
        phone: { stringValue: phone || "" },
        role: { stringValue: role },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    };

    const profileResponse = await fetch(firestoreUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    if (!profileResponse.ok) {
      console.warn("⚠️ [REGISTER] Failed to store profile, continuing anyway");
    } else {
      console.log("✅ [REGISTER] Profile stored successfully");
    }

    const userProfile: UserProfile = {
      id: userId,
      email,
      name,
      role,
      phone: phone || "",
    };

    console.log("✅ [REGISTER] Registration complete");
    return {
      success: true,
      user: userProfile,
      token: authData.idToken,
    };
  } catch (error) {
    console.error("❌ [REGISTER] Error:", error);
    throw error;
  }
}

// =====================================================
// ADMIN SPECIFIC
// =====================================================

export async function registerAdmin(
  emailOrPayload: string | { email: string; password: string; name: string; admin_code?: string; phone?: string },
  password?: string,
  name?: string,
  adminCode?: string,
  phone?: string
): Promise<{ success: true; user: UserProfile; token: string }> {
  // Handle object payload (from React components)
  if (typeof emailOrPayload === "object") {
    const payload = emailOrPayload;
    return registerUser(
      payload.email,
      payload.password,
      payload.name,
      "ADMIN",
      payload.admin_code,
      payload.phone
    );
  }
  
  // Handle individual parameters (legacy)
  return registerUser(emailOrPayload, password!, name!, "ADMIN", adminCode, phone);
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: true; user: UserProfile; idToken: string; refreshToken: string }> {
  console.log("🔐 [ADMIN-LOGIN] Starting admin login");
  const result = await loginUser(email, password);

  if (result.user.role !== "ADMIN") {
    throw new Error("User is not an admin");
  }

  return result;
}

// =====================================================
// TRAINER SPECIFIC
// =====================================================

export async function registerTrainer(
  emailOrPayload: string | { email: string; password: string; name: string; phone?: string },
  password?: string,
  name?: string,
  phone?: string
): Promise<{ success: true; user: UserProfile; token: string }> {
  // Handle object payload (from React components)
  if (typeof emailOrPayload === "object") {
    const payload = emailOrPayload;
    return registerUser(
      payload.email,
      payload.password,
      payload.name,
      "TRAINER",
      undefined,
      payload.phone
    );
  }
  
  // Handle individual parameters (legacy)
  return registerUser(emailOrPayload, password!, name!, "TRAINER", undefined, phone);
}

export async function loginTrainer(
  email: string,
  password: string
): Promise<{ success: true; user: UserProfile; idToken: string; refreshToken: string }> {
  console.log("🔐 [TRAINER-LOGIN] Starting trainer login");
  const result = await loginUser(email, password);

  if (result.user.role !== "TRAINER") {
    throw new Error("User is not a trainer");
  }

  return result;
}

// =====================================================
// TRAINEE SPECIFIC
// =====================================================

export async function registerTrainee(
  emailOrPayload: string | { email: string; password: string; name: string; phone?: string },
  password?: string,
  name?: string,
  phone?: string
): Promise<{ success: true; user: UserProfile; token: string }> {
  // Handle object payload (from React components)
  if (typeof emailOrPayload === "object") {
    const payload = emailOrPayload;
    return registerUser(
      payload.email,
      payload.password,
      payload.name,
      "TRAINEE",
      undefined,
      payload.phone
    );
  }
  
  // Handle individual parameters (legacy)
  return registerUser(emailOrPayload, password!, name!, "TRAINEE", undefined, phone);
}

export async function loginTrainee(
  email: string,
  password: string
): Promise<{ success: true; user: UserProfile; idToken: string; refreshToken: string }> {
  console.log("🔐 [TRAINEE-LOGIN] Starting trainee login");
  const result = await loginUser(email, password);

  if (result.user.role !== "TRAINEE") {
    throw new Error("User is not a trainee");
  }

  return result;
}

// =====================================================
// GENERAL LOGIN
// =====================================================

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: true; user: UserProfile; idToken: string; refreshToken: string }> {
  console.log("📝 [LOGIN] Starting login:", { email });

  if (!email || !password) {
    throw new Error("Missing email or password");
  }

  try {
    // Step 1: Sign in with Firebase
    console.log("🔐 [LOGIN] Authenticating with Firebase");
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

    const authResponse = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    if (!authResponse.ok) {
      const errorData = (await authResponse.json()) as any;
      console.error("❌ [LOGIN] Auth failed:", errorData);
      throw new Error(
        errorData.error?.message || "Invalid email or password"
      );
    }

    const authData = (await authResponse.json()) as AuthResponse;
    const userId = authData.localId;
    console.log("✅ [LOGIN] Firebase authentication successful");

    // Step 2: Fetch user profile from Firestore
    console.log("📁 [LOGIN] Fetching user profile");
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?key=${FIREBASE_API_KEY}`;

    const profileResponse = await fetch(firestoreUrl);

    let userProfile: UserProfile = {
      id: userId,
      email,
      name: email.split("@")[0],
      role: "TRAINEE",
    };

    if (profileResponse.ok) {
      const profileData = (await profileResponse.json()) as any;
      const fields = profileData.fields || {};

      userProfile = {
        id: userId,
        email: fields.email?.stringValue || email,
        name: fields.name?.stringValue || email.split("@")[0],
        role: (fields.role?.stringValue || "TRAINEE") as any,
        phone: fields.phone?.stringValue || "",
      };
      console.log("✅ [LOGIN] Profile fetched successfully");
    } else {
      console.warn("⚠️ [LOGIN] Could not fetch profile, using defaults");
    }

    console.log("✅ [LOGIN] Login complete");
    return {
      success: true,
      user: userProfile,
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
    };
  } catch (error) {
    console.error("❌ [LOGIN] Error:", error);
    throw error;
  }
}

// =====================================================
// LOGOUT
// =====================================================

export async function logout(): Promise<void> {
  console.log("🚪 [LOGOUT] Logging out user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  console.log("✅ [LOGOUT] Logout complete");
}

// =====================================================
// TOKEN UTILITIES
// =====================================================

export function saveAuthTokens(
  idToken: string,
  refreshToken: string
): void {
  localStorage.setItem("access_token", idToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function getAuthToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function saveUserProfile(user: UserProfile): void {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUserProfile(): UserProfile | null {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
