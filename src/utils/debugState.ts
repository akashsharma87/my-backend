// Debug utilities for state management
export const debugState = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATE DEBUG] ${message}`, data);
    }
  },
  
  logResumeUpdate: (resumeId: string, updates: any, source: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RESUME UPDATE] ${source}:`, {
        resumeId,
        updates,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  logApiCall: (endpoint: string, method: string, response?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API CALL] ${method} ${endpoint}:`, {
        response,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  logStateSync: (source: string, resumeCount: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATE SYNC] ${source}:`, {
        resumeCount,
        timestamp: new Date().toISOString()
      });
    }
  }
};

export default debugState;
