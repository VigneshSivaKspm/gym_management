import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  adminLogin as adminLoginService, 
  adminRegister as adminRegisterService,
  traineeLogin as traineeLoginService,
  traineeRegister as traineeRegisterService,
  trainerLogin as trainerLoginService,
  trainerRegister as trainerRegisterService,
  getUserProfile,
  saveAuthToken,
  clearAuthToken,
  getAuthToken,
  saveCurrentUser,
  getCurrentUser
} from "../services/authService.js";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [loading, setLoading] = useState(true);

  /* ------------------------------------
      AUTO PROFILE LOAD ON REFRESH
  -------------------------------------*/
  useEffect(() => {
    if (token) fetchProfile();
    else {
      // Try to load user from localStorage
      const savedUser = getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
    }
  }, [token]);

  /* ------------------------------------
          FETCH USER PROFILE
  -------------------------------------*/
  const fetchProfile = async () => {
    try {
      // Load user from localStorage first
      const savedUser = getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
        setLoading(false);
        return;
      }

      // If no saved user but token exists, this is an error state
      throw new Error("No user profile found");
    } catch (error) {
      console.error("❌ Profile Error:", error);
      forceLogout();
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------
           NORMAL USER LOGIN
  -------------------------------------*/
  const login = async (credentials) => {
    try {
      const result = await traineeLoginService(credentials.email, credentials.password);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const { user, idToken, refreshToken } = result;

      // 🔥 Normalize role
      const normalizedUser = { 
        ...user, 
        role: user.role?.toUpperCase() 
      };

      // Save tokens and user
      saveAuthToken(idToken, refreshToken);
      saveCurrentUser(normalizedUser);

      setToken(idToken);
      setUser(normalizedUser);

      toast.success("Login successful");
      return { success: true, user: normalizedUser };
    } catch (err) {
      const msg = err.message || "Invalid login credentials";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
              ADMIN LOGIN
  -------------------------------------*/
  const adminLogin = async ({ email, password }) => {
    try {
      const result = await adminLoginService(email, password);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const { user, idToken, refreshToken } = result;

      // 🔥 Normalize role
      const normalizedUser = {
        ...user,
        role: user.role?.toUpperCase()
      };

      // Save tokens and user
      saveAuthToken(idToken, refreshToken);
      saveCurrentUser(normalizedUser);

      setToken(idToken);
      setUser(normalizedUser);

      toast.success("Admin login successful");
      return { success: true, user: normalizedUser };
    } catch (err) {
      const msg = err.message || "Admin login failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
               REGISTER (TRAINEE)
  -------------------------------------*/
  const register = async (payload) => {
    try {
      const result = await traineeRegisterService(payload);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Registration successful");
      return { success: true, data: result };
    } catch (err) {
      const msg = err.message || "Registration failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
              ADMIN REGISTER
  -------------------------------------*/
  const adminRegister = async (payload) => {
    try {
      const result = await adminRegisterService(payload);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Admin account created successfully!");
      return { success: true, data: result };
    } catch (err) {
      const msg = err.message || "Admin registration failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
             TRAINER LOGIN
  -------------------------------------*/
  const trainerLogin = async ({ email, password }) => {
    try {
      const result = await trainerLoginService(email, password);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const { user, idToken, refreshToken } = result;

      // 🔥 Normalize role
      const normalizedUser = {
        ...user,
        role: user.role?.toUpperCase()
      };

      // Save tokens and user
      saveAuthToken(idToken, refreshToken);
      saveCurrentUser(normalizedUser);

      setToken(idToken);
      setUser(normalizedUser);

      toast.success("Trainer login successful");
      return { success: true, user: normalizedUser };
    } catch (err) {
      const msg = err.message || "Trainer login failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
             TRAINER REGISTER
  -------------------------------------*/
  const trainerRegister = async (payload) => {
    try {
      const result = await trainerRegisterService(payload);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Trainer account created successfully!");
      return { success: true, data: result };
    } catch (err) {
      const msg = err.message || "Trainer registration failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
               LOGOUT
  -------------------------------------*/
  const logout = () => {
    clearAuthToken();
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    toast.success("Logged out");
    window.location.href = "/login";
  };

  const forceLogout = () => {
    clearAuthToken();
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    toast.error("Session expired. Please login again.");
    window.location.href = "/login";
  };

  /* ------------------------------------
              EXPORT CONTEXT
  -------------------------------------*/
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    adminLogin,
    trainerLogin,
    register,
    adminRegister,
    trainerRegister,
    logout,
    forceLogout,
    refreshProfile: fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
