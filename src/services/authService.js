/**
 * AuthService - Bridge layer between React components and Firebase
 * Provides consistent API for all auth operations
 */

import * as firebaseAuth from './firebaseAuth';

/**
 * Export all auth functions with consistent naming
 */

export const adminRegister = async (data) => {
  return firebaseAuth.registerAdmin(data);
};

export const adminLogin = async (email, password) => {
  return firebaseAuth.loginAdmin(email, password);
};

export const traineeRegister = async (data) => {
  return firebaseAuth.registerTrainee(data);
};

export const traineeLogin = async (email, password) => {
  return firebaseAuth.loginTrainee(email, password);
};

export const trainerRegister = async (data) => {
  return firebaseAuth.registerTrainer(data);
};

export const trainerLogin = async (email, password) => {
  return firebaseAuth.loginTrainer(email, password);
};

export const getUserProfile = async (userId) => {
  return firebaseAuth.getUserProfile(userId);
};

export const refreshAccessToken = async (refreshToken) => {
  return firebaseAuth.refreshAccessToken(refreshToken);
};

export const verifyIdToken = async (idToken) => {
  return firebaseAuth.verifyIdToken(idToken);
};

/**
 * Token management functions
 */

export const saveAuthToken = (token, refreshToken) => {
  if (token) localStorage.setItem('access_token', token);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
};

export const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/**
 * Get current user from localStorage and token
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user:', error);
    return null;
  }
};

export const saveCurrentUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};
