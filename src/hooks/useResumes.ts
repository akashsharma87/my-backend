import { useContext } from 'react';
import { ResumesContext } from '../context/ResumesContext';

// Legacy hook for backward compatibility
export const useResumes = () => {
  const context = useContext(ResumesContext);
  if (!context) {
    throw new Error('useResumes must be used within a ResumesProvider');
  }
  return context;
};
