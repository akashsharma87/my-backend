import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthProvider } from '../../context/AuthContext';
import React from 'react';

// Mock the API config
vi.mock('../../config/api', () => ({
  config: {
    apiUrl: 'http://localhost:3000/api'
  }
}));

// Mock fetch
global.fetch = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load user from localStorage on mount', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      userType: 'engineer' as const
    };
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('should handle sign in', async () => {
    const mockResponse = {
      success: true,
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          fullName: 'Test User',
          userType: 'engineer'
        },
        token: 'mock-token'
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(async () => {
      await result.current.signIn('test@example.com', 'password', 'engineer');
    });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });

  it('should handle sign out', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      userType: 'engineer' as const
    };
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });

    result.current.signOut();

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('should handle authentication errors', async () => {
    const mockError = {
      success: false,
      message: 'Invalid credentials'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => mockError
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    try {
      await result.current.signIn('test@example.com', 'wrong-password', 'engineer');
    } catch (error) {
      expect(error).toBeDefined();
    }

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.user).toBeNull();
    });
  });
});

