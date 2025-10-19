import React, { createContext, useState, useEffect } from 'react';
import { config } from '../config/api';
import { AppError } from '../utils/errorHandler';

const API_BASE_URL = config.API_BASE_URL;

interface User {
  _id: string;
  email: string;
  fullName: string;
  userType: 'engineer' | 'employer';
  isActive: boolean;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  skills?: string[];
  experience?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  yearsOfExperience?: number;
  currentSalary?: string;
  expectedSalary?: string;
  availability?: 'immediately' | 'within_2_weeks' | 'within_month' | 'not_available';
  workType?: 'remote' | 'onsite' | 'hybrid' | 'flexible';
  languages?: string[];
  certifications?: string[];
  education?: string;
  achievements?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AppError | null;
  signIn: (email: string, password: string, userType: 'engineer' | 'employer') => Promise<void>;
  signUp: (email: string, password: string, fullName: string, userType: 'engineer' | 'employer') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        // Throw error with the server's message
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      } catch (parseError) {
        // If JSON parsing fails, check if it's because of the error we just threw
        if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
          throw parseError; // Re-throw our custom error
        }
        // If JSON parsing actually failed, create a generic error
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle network/fetch errors (connection issues, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network connection failed. Please check your internet connection.');
    }
    // Re-throw other errors (including our custom API errors)
    throw error;
  }
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const cachedUser = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      // Try to use cached user data first for faster initial load
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Failed to parse cached user:', e);
          localStorage.removeItem('user');
        }
      }

      // Verify token with backend and get fresh user data
      const response = await apiCall('/auth/me');
      const freshUser = response.data.user;

      // Update user state and cache
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear all auth data on failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userType: 'engineer' | 'employer') => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, userType }),
      });

      // Store token and user data for persistence
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (error: unknown) {
      // The apiCall function already processes the error and throws a proper Error object
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      const appError: AppError = {
        message: errorMessage,
        code: 'REGISTRATION_ERROR',
        status: 400
      };
      setError(appError);
      console.error('Registration error:', appError);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const signIn = async (email: string, password: string, userType: 'engineer' | 'employer') => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password, userType }),
      });

      // Store token and user data for persistence
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (error: unknown) {
      // The apiCall function already processes the error and throws a proper Error object
      // No need to use handleApiError here
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      const appError: AppError = {
        message: errorMessage,
        code: 'AUTHENTICATION_ERROR',
        status: 401
      };
      setError(appError);
      console.error('Login error:', appError);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Call backend logout endpoint (optional, for audit logs)
      try {
        await apiCall('/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout API call failed:', error);
        // Continue with local cleanup even if API call fails
      }

      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Clear all cached data (resumes, profiles, etc.)
      localStorage.removeItem('resumes_cache');
      localStorage.removeItem('profile_cache');

      // Clear sessionStorage
      sessionStorage.clear();

      // Reset user state
      setUser(null);
      setError(null);

      // Clear any cache keys that might exist
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('resume_') || key.startsWith('cache_') || key.startsWith('upload_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('✅ Logout successful - All data cleared');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force clear everything even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    // Update user state and cache
    const updatedUser = response.data.user;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}