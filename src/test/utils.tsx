import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AuthProvider from '../context/AuthContext';
import ResumesProvider from '../context/ResumesContext';
import { ToastProvider } from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';

// Mock user data
export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  fullName: 'Test User',
  userType: 'engineer' as const,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockEmployer = {
  _id: '507f1f77bcf86cd799439012',
  email: 'employer@example.com',
  fullName: 'Test Employer',
  userType: 'employer' as const,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock resume data
export const mockResume = {
  _id: '507f1f77bcf86cd799439013',
  userId: mockUser._id,
  filename: 'test-resume.pdf',
  originalName: 'John_Doe_Resume.pdf',
  fileSize: 1024000,
  mimeType: 'application/pdf',
  filePath: '/uploads/resumes/test-resume.pdf',
  isActive: true,
  activationExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  extractedData: {
    text: 'John Doe\nSoftware Engineer\nExperience: 5 years\nSkills: JavaScript, React, Node.js',
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: '5 years',
    education: 'Bachelor of Computer Science',
    contact: {
      email: 'john.doe@example.com',
      phone: '+1234567890'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock job data
export const mockJob = {
  _id: '507f1f77bcf86cd799439014',
  employerId: mockEmployer._id,
  title: 'Senior React Developer',
  description: 'We are looking for a senior React developer...',
  requiredSkills: ['React', 'JavaScript', 'TypeScript'],
  experienceLevel: 'senior',
  jobType: 'full-time',
  location: 'Remote',
  salary: {
    min: 80000,
    max: 120000,
    currency: 'USD'
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock auth context values
export const mockAuthContextValue = {
  user: mockUser,
  token: 'mock-jwt-token',
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  isAuthenticated: true,
};

export const mockUnauthenticatedContextValue = {
  user: null,
  token: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  isAuthenticated: false,
};

// Mock resumes context values
export const mockResumesContextValue = {
  resumes: [mockResume],
  isLoading: false,
  error: null,
  uploadResume: vi.fn(),
  deleteResume: vi.fn(),
  updateResume: vi.fn(),
  fetchResumes: vi.fn(),
  searchResumes: vi.fn(),
  clearError: vi.fn(),
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authContextValue?: any;
  resumesContextValue?: any;
  withRouter?: boolean;
  withAuth?: boolean;
  withResumes?: boolean;
  withToast?: boolean;
  withErrorBoundary?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    authContextValue = mockAuthContextValue,
    resumesContextValue = mockResumesContextValue,
    withRouter = true,
    withAuth = true,
    withResumes = true,
    withToast = true,
    withErrorBoundary = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrappedChildren = children;

    if (withErrorBoundary) {
      wrappedChildren = <ErrorBoundary>{wrappedChildren}</ErrorBoundary>;
    }

    if (withToast) {
      wrappedChildren = <ToastProvider>{wrappedChildren}</ToastProvider>;
    }

    if (withAuth) {
      // Mock the AuthContext.Provider
      const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
        const AuthContext = React.createContext(authContextValue);
        return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
      };
      wrappedChildren = <MockAuthProvider>{wrappedChildren}</MockAuthProvider>;
    }

    if (withResumes) {
      // Mock the ResumesContext.Provider
      const MockResumesProvider = ({ children }: { children: React.ReactNode }) => {
        const ResumesContext = React.createContext(resumesContextValue);
        return <ResumesContext.Provider value={resumesContextValue}>{children}</ResumesContext.Provider>;
      };
      wrappedChildren = <MockResumesProvider>{wrappedChildren}</MockResumesProvider>;
    }

    if (withRouter) {
      wrappedChildren = <BrowserRouter>{wrappedChildren}</BrowserRouter>;
    }

    return <>{wrappedChildren}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Utility to create mock API responses
export const createMockApiResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    statusText: status === 200 ? 'OK' : 'Error',
  } as unknown as Response;
};

// Utility to mock fetch responses
export const mockFetch = (response: any, status = 200) => {
  const mockResponse = createMockApiResponse(response, status);
  vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);
  return mockResponse;
};

// Utility to mock fetch errors
export const mockFetchError = (error: string) => {
  vi.mocked(global.fetch).mockRejectedValueOnce(new Error(error));
};

// Utility to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility to create mock files
export const createMockFile = (
  name: string = 'test.pdf',
  size: number = 1024,
  type: string = 'application/pdf'
) => {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
};

// Utility to create mock form events
export const createMockFormEvent = (formData: Record<string, any>) => {
  const form = document.createElement('form');
  Object.entries(formData).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  return {
    preventDefault: vi.fn(),
    target: form,
    currentTarget: form,
  } as unknown as React.FormEvent<HTMLFormElement>;
};

// Utility to create mock change events
export const createMockChangeEvent = (name: string, value: any) => {
  return {
    target: {
      name,
      value,
      type: typeof value === 'boolean' ? 'checkbox' : 'text',
      checked: typeof value === 'boolean' ? value : undefined,
    },
    currentTarget: {
      name,
      value,
      type: typeof value === 'boolean' ? 'checkbox' : 'text',
      checked: typeof value === 'boolean' ? value : undefined,
    },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
};

// Utility to create mock file change events
export const createMockFileChangeEvent = (files: File[]) => {
  return {
    target: {
      files,
      type: 'file',
    },
    currentTarget: {
      files,
      type: 'file',
    },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
};

// Test data generators
export const generateMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockUser,
    _id: `507f1f77bcf86cd79943901${index}`,
    email: `user${index}@example.com`,
    fullName: `Test User ${index}`,
  }));
};

export const generateMockResumes = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockResume,
    _id: `507f1f77bcf86cd79943902${index}`,
    filename: `resume-${index}.pdf`,
    originalName: `Resume_${index}.pdf`,
  }));
};

export const generateMockJobs = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockJob,
    _id: `507f1f77bcf86cd79943903${index}`,
    title: `Job Title ${index}`,
    description: `Job description ${index}`,
  }));
};

// Custom matchers for better assertions
export const customMatchers = {
  toBeValidEmail: (received: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
      pass,
    };
  },
  toBeValidObjectId: (received: string) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    const pass = objectIdRegex.test(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid ObjectId`,
      pass,
    };
  },
};

// Export everything for easy importing
export * from '@testing-library/react';
export { vi } from 'vitest';
