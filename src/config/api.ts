// Environment configuration for API URLs
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:4173',
} as const;

// Helper function to get the correct API URL for different environments
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = config.API_BASE_URL;
  return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
};

export default config;