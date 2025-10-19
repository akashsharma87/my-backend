import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, RefreshCw, Trash2, EyeOff } from 'lucide-react';
import { useResumesContext } from '../context/ResumesContext';

export const StateDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { resumes, loading, error, lastSyncTime, refreshResumes } = useResumesContext();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getResumeStatus = (resume: any) => {
    if (!resume.isActive) return 'Inactive';
    if (!resume.activationExpiresAt) return 'Active (no expiry)';
    
    const expiryDate = new Date(resume.activationExpiresAt);
    const now = new Date();
    
    if (expiryDate <= now) return 'Expired';
    
    const timeLeft = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `Active (${daysLeft}d ${hoursLeft}h left)`;
  };

  const handleRefresh = async () => {
    try {
      await refreshResumes();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-mono-900 text-mono-0 p-3 rounded-full shadow-lg hover:bg-mono-800 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bug className="h-5 w-5" />
      </motion.button>

      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="absolute bottom-16 right-0 bg-mono-0 border border-mono-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-mono-900">State Debugger</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="p-1 hover:bg-mono-100 rounded"
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={clearLocalStorage}
                className="p-1 hover:bg-mono-100 rounded text-red-600"
                title="Clear Storage & Reload"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-mono-100 rounded"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <strong>Context State:</strong>
              <div className="ml-2 text-mono-600">
                <div>Loading: {loading ? 'Yes' : 'No'}</div>
                <div>Error: {error || 'None'}</div>
                <div>Resumes: {resumes.length}</div>
                <div>Last Sync: {formatTime(lastSyncTime)}</div>
              </div>
            </div>

            <div>
              <strong>Resume States:</strong>
              <div className="ml-2 space-y-2 max-h-48 overflow-y-auto">
                {resumes.map((resume, index) => (
                  <div key={resume._id} className="border border-mono-200 rounded p-2">
                    <div className="font-medium text-mono-800">
                      Resume {index + 1}: {resume.fileName}
                    </div>
                    <div className="text-xs text-mono-600 space-y-1">
                      <div>Status: {getResumeStatus(resume)}</div>
                      <div>Active: {resume.isActive ? 'Yes' : 'No'}</div>
                      {resume.activatedAt && (
                        <div>Activated: {new Date(resume.activatedAt).toLocaleString()}</div>
                      )}
                      {resume.activationExpiresAt && (
                        <div>Expires: {new Date(resume.activationExpiresAt).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                ))}
                {resumes.length === 0 && (
                  <div className="text-mono-500 italic">No resumes found</div>
                )}
              </div>
            </div>

            <div>
              <strong>Cache Info:</strong>
              <div className="ml-2 text-mono-600">
                <div>Client Cache: Check console for logs</div>
                <div>Server Cache: 5min TTL</div>
              </div>
            </div>

            <div className="pt-2 border-t border-mono-200">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-mono-900 text-mono-0 py-2 px-3 rounded text-sm hover:bg-mono-800 transition-colors"
              >
                🔄 Test Page Refresh
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StateDebugger;
