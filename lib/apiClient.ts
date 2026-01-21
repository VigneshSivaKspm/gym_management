// frontend/lib/apiClient.ts
import { getAccessToken } from "./auth";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

async function apiCall<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: response.ok,
      message: data.message,
      data: data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "An error occurred",
    };
  }
}

// Auth API
export const authApi = {
  register: (email: string, password: string, name: string, role: string = "TRAINEE") =>
    apiCall("/auth/register", "POST", { email, password, name, role }),

  login: (email: string, password: string) =>
    apiCall("/auth/login", "POST", { email, password }),
};

// Trainee API
export const traineeApi = {
  getProfile: () => apiCall("/trainee/profile", "GET"),

  updateProfile: (data: any) => apiCall("/trainee/profile", "PUT", data),

  getWorkouts: () => apiCall("/trainee/workouts", "GET"),

  createWorkout: (data: any) => apiCall("/trainee/workouts", "POST", data),

  updateWorkout: (data: any) => apiCall("/trainee/workouts", "PUT", data),

  deleteWorkout: (id: string) =>
    apiCall("/trainee/workouts", "DELETE", { id }),

  getNutrition: () => apiCall("/trainee/nutrition", "GET"),

  createNutrition: (data: any) => apiCall("/trainee/nutrition", "POST", data),
};

// Trainer API
export const trainerApi = {
  getProfile: () => apiCall("/trainer/profile", "GET"),

  updateProfile: (data: any) => apiCall("/trainer/profile", "PUT", data),

  getTrainees: () => apiCall("/trainer/trainees", "GET"),

  assignTrainee: (trainee_id: string) =>
    apiCall("/trainer/trainees", "POST", { trainee_id }),
};

export default apiCall;
