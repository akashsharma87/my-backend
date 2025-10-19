import React, { createContext, useState, useCallback, useContext } from 'react';
import { config } from '../config/api';
import { optimizedApiCall, clearCache } from '../utils/optimizedApi';
import { debugState } from '../utils/debugState';

const API_BASE_URL = config.API_BASE_URL;

interface Resume {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  skills: string[];
  experienceYears?: number;
  location?: string;
  isActive: boolean;
  activatedAt?: string;
  activationExpiresAt?: string;
  canReactivate?: boolean;
  views: number;
  downloads: number;
  lastViewed?: string;
  createdAt: string;
  updatedAt: string;
}

interface ResumeFilters {
  page?: number;
  limit?: number;
  skills?: string;
  minExperience?: number;
  maxExperience?: number;
  location?: string;
  search?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UpdateResumeData {
  skills?: string[];
  experienceYears?: number;
  location?: string;
}

interface ResumesContextType {
  // State
  resumes: Resume[];
  loading: boolean;
  error: string | null;
  lastSyncTime: number;

  // Actions
  uploadResume: (formData: FormData) => Promise<Resume>;
  getResumes: (filters?: ResumeFilters, forceRefresh?: boolean) => Promise<{ resumes: Resume[]; pagination: PaginationInfo }>;
  getResume: (id: string) => Promise<Resume>;
  updateResume: (id: string, data: UpdateResumeData) => Promise<Resume>;
  deleteResume: (id: string) => Promise<void>;
  downloadResume: (id: string) => Promise<void>;
  activateResume: (id: string) => Promise<any>;
  deactivateResume: (id: string) => Promise<any>;
  refreshResumeVisibility: (id: string) => Promise<any>;

  // Utility functions
  refreshResumes: () => Promise<void>;
  updateResumeInState: (resumeId: string, updates: Partial<Resume>) => void;
  clearError: () => void;
  syncWithServer: () => Promise<void>;
}

export const ResumesContext = createContext<ResumesContextType>({} as ResumesContextType);

// Custom hook to use ResumesContext
export const useResumesContext = () => {
  const context = useContext(ResumesContext);
  if (!context) {
    throw new Error('useResumesContext must be used within a ResumesProvider');
  }
  return context;
};

// Helper function for API calls - now using optimized API
const apiCall = async (endpoint: string, options: RequestInit & { cache?: boolean; cacheTTL?: number } = {}) => {
  return optimizedApiCall(endpoint, {
    ...options,
    cache: options.cache !== undefined ? options.cache : (options.method === 'GET' || !options.method),
    cacheTTL: options.cacheTTL !== undefined ? options.cacheTTL : 300000, // 5 minutes for resume data
  });
};

export default function ResumesProvider({ children }: { children: React.ReactNode }) {
  // Local state management
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateResumeInState = useCallback((resumeId: string, updates: Partial<Resume>) => {
    debugState.logResumeUpdate(resumeId, updates, 'updateResumeInState');
    setResumes(prev => prev.map(resume =>
      resume._id === resumeId ? { ...resume, ...updates } : resume
    ));
  }, []);

  const refreshResumes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear cache to force fresh data
      clearCache('/resumes');

      const response = await apiCall('/resumes');
      if (response.success && response.data && response.data.resumes) {
        setResumes(response.data.resumes);
        setLastSyncTime(Date.now());
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch resumes');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  const uploadResume = async (formData: FormData): Promise<Resume> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/resumes/upload', {
        method: 'POST',
        body: formData,
        cache: false, // Don't cache upload requests
      });
      const newResume = response.data.resume;

      // Add to local state immediately
      setResumes(prev => [newResume, ...prev]);

      // Clear resumes cache to ensure fresh data on next fetch
      clearCache('/resumes');

      return newResume;
    } catch (error: any) {
      setError(error.message || 'Failed to upload resume');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getResumes = async (filters: ResumeFilters = {}, forceRefresh: boolean = false): Promise<{ resumes: Resume[]; pagination: PaginationInfo }> => {
    try {
      setLoading(true);
      setError(null);

      // Clear cache if force refresh is requested
      if (forceRefresh) {
        debugState.log('Force refresh requested, clearing cache');
        clearCache('/resumes');
      }

      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof ResumeFilters];
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      // Add cache-busting parameter for force refresh
      const cacheParam = forceRefresh ? `&_t=${Date.now()}` : '';
      const response = await apiCall(`/resumes?${queryParams.toString()}${cacheParam}`, {
        method: 'GET',
        cache: !forceRefresh, // Don't use cache if force refresh
        cacheTTL: forceRefresh ? 0 : 300000 // No cache TTL if force refresh
      });

      // Update local state with fresh server data
      if (response.success && response.data && response.data.resumes) {
        debugState.logStateSync('getResumes', response.data.resumes.length);
        setResumes(response.data.resumes);
        setLastSyncTime(Date.now());
      }

      return response.data;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch resumes');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getResume = async (id: string): Promise<Resume> => {
    const response = await apiCall(`/resumes/${id}`);
    return response.data.resume;
  };

  const updateResume = async (id: string, data: UpdateResumeData): Promise<Resume> => {
    const response = await apiCall(`/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data.resume;
  };

  const deleteResume = async (id: string): Promise<void> => {
    try {
      setError(null);

      // Optimistic update - remove from local state immediately
      const originalResumes = resumes;
      setResumes(prev => prev.filter(resume => resume._id !== id));

      await apiCall(`/resumes/${id}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      // Revert optimistic update on error
      setResumes(resumes);
      setError(error.message || 'Failed to delete resume');
      throw error;
    }
  };

  const downloadResume = async (id: string): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/resumes/${id}/download`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const activateResume = async (id: string): Promise<any> => {
    try {
      setError(null);

      // Optimistic update - immediately show as active
      const activationTime = new Date();
      const expirationTime = new Date(activationTime.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      updateResumeInState(id, {
        isActive: true,
        activatedAt: activationTime.toISOString(),
        activationExpiresAt: expirationTime.toISOString()
      });

      const response = await apiCall(`/resumes/${id}/activate`, {
        method: 'POST',
        cache: false, // Don't cache POST requests
      });

      // Clear cache to ensure fresh data on next fetch
      clearCache('/resumes');

      // Update with actual server response - ensure we get the complete resume data
      if (response.success && response.data && response.data.resume) {
        const serverResumeData = response.data.resume;
        debugState.logApiCall(`/resumes/${id}/activate`, 'POST', serverResumeData);
        updateResumeInState(id, {
          isActive: serverResumeData.isActive,
          activatedAt: serverResumeData.activatedAt,
          activationExpiresAt: serverResumeData.activationExpiresAt,
          canReactivate: serverResumeData.canReactivate
        });
      }

      return response.data;
    } catch (error: any) {
      // Revert optimistic update on error
      updateResumeInState(id, { isActive: false, activatedAt: undefined, activationExpiresAt: undefined });
      setError(error.message || 'Failed to activate resume');
      throw error;
    }
  };

  const deactivateResume = async (id: string): Promise<any> => {
    try {
      setError(null);

      // Store original state for rollback
      const originalResume = resumes.find(r => r._id === id);

      // Optimistic update - immediately show as inactive
      updateResumeInState(id, {
        isActive: false,
        activatedAt: undefined,
        activationExpiresAt: undefined
      });

      const response = await apiCall(`/resumes/${id}/deactivate`, {
        method: 'POST',
        cache: false, // Don't cache POST requests
      });

      // Clear cache to ensure fresh data on next fetch
      clearCache('/resumes');

      // Update with actual server response
      if (response.success && response.data && response.data.resume) {
        const serverResumeData = response.data.resume;
        updateResumeInState(id, {
          isActive: serverResumeData.isActive,
          activatedAt: serverResumeData.activatedAt,
          activationExpiresAt: serverResumeData.activationExpiresAt,
          canReactivate: serverResumeData.canReactivate
        });
      }

      return response.data;
    } catch (error: any) {
      // Revert optimistic update on error - restore original state
      if (originalResume) {
        updateResumeInState(id, {
          isActive: originalResume.isActive,
          activatedAt: originalResume.activatedAt,
          activationExpiresAt: originalResume.activationExpiresAt
        });
      }
      setError(error.message || 'Failed to deactivate resume');
      throw error;
    }
  };

  const refreshResumeVisibility = async (id: string): Promise<any> => {
    try {
      setError(null);

      // Store original state for rollback
      const originalResume = resumes.find(r => r._id === id);

      // Optimistic update - reset expiration time and ensure active
      const newActivationTime = new Date();
      const newExpirationTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      updateResumeInState(id, {
        isActive: true,
        activatedAt: newActivationTime.toISOString(),
        activationExpiresAt: newExpirationTime.toISOString()
      });

      const response = await apiCall(`/resumes/${id}/refresh`, {
        method: 'POST',
        cache: false, // Don't cache POST requests
      });

      // Clear cache to ensure fresh data on next fetch
      clearCache('/resumes');

      // Update with actual server response
      if (response.success && response.data && response.data.resume) {
        const serverResumeData = response.data.resume;
        updateResumeInState(id, {
          isActive: serverResumeData.isActive,
          activatedAt: serverResumeData.activatedAt,
          activationExpiresAt: serverResumeData.activationExpiresAt,
          canReactivate: serverResumeData.canReactivate
        });
      }

      return response.data;
    } catch (error: any) {
      // Revert optimistic update on error - restore original state
      if (originalResume) {
        updateResumeInState(id, {
          isActive: originalResume.isActive,
          activatedAt: originalResume.activatedAt,
          activationExpiresAt: originalResume.activationExpiresAt
        });
      }
      setError(error.message || 'Failed to refresh resume visibility');
      throw error;
    }
  };

  // Sync with server to ensure data consistency
  const syncWithServer = useCallback(async () => {
    try {
      // Only sync if we have resumes and it's been more than 30 seconds since last sync
      if (resumes.length > 0 && Date.now() - lastSyncTime > 30000) {
        const response = await apiCall('/resumes', { cache: false });
        if (response.success && response.data && response.data.resumes) {
          setResumes(response.data.resumes);
          setLastSyncTime(Date.now());
        }
      }
    } catch (error) {
      // Silent fail for background sync
      console.warn('Background sync failed:', error);
    }
  }, [resumes.length, lastSyncTime]);

  const value = {
    // State
    resumes,
    loading,
    error,
    lastSyncTime,

    // Actions
    uploadResume,
    getResumes,
    getResume,
    updateResume,
    deleteResume,
    downloadResume,
    activateResume,
    deactivateResume,
    refreshResumeVisibility,

    // Utility functions
    refreshResumes,
    updateResumeInState,
    clearError,
    syncWithServer,
  };

  return <ResumesContext.Provider value={value}>{children}</ResumesContext.Provider>;
}