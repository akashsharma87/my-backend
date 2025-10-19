import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Clock, CheckCircle, AlertCircle, RefreshCw, StopCircle } from 'lucide-react';
import { useResumesContext } from '../context/ResumesContext';
import { useToast } from './Toast';
import { useCountdown } from '../hooks/useCountdown';

interface ResumeActivationButtonProps {
  resumeId: string;
}

const ResumeActivationButton: React.FC<ResumeActivationButtonProps> = ({
  resumeId
}) => {
  const [loading, setLoading] = useState(false);
  const { resumes, activateResume, deactivateResume, refreshResumeVisibility } = useResumesContext();
  const toast = useToast();

  // Get the current resume from context
  const resume = useMemo(() =>
    resumes.find(r => r._id === resumeId),
    [resumes, resumeId]
  );

  // Use optimized countdown hook
  const countdown = useCountdown(resume?.activationExpiresAt || null);

  // If resume not found, return null
  if (!resume) {
    return null;
  }

  const getActivationStatus = () => {
    if (!resume.isActive) {
      return {
        status: 'inactive',
        message: 'Currently this resume is not visible to employers. Click on \'Visible to Employer\' button to activate this resume.',
        color: 'text-mono-700',
        bgColor: 'bg-mono-100 border border-mono-300',
        icon: Pause
      };
    }

    if (resume.activationExpiresAt) {
      if (countdown.isExpired) {
        return {
          status: 'expired',
          message: 'Currently this resume is not visible to employers. Click on \'Visible to Employer\' button to activate this resume.',
          color: 'text-mono-700',
          bgColor: 'bg-mono-100 border border-mono-300',
          icon: AlertCircle
        };
      }

      return {
        status: 'active',
        message: countdown.isExpiringSoon
          ? 'This resume is visible to employers. ⚠️ Expiring soon! Consider refreshing visibility.'
          : 'This resume is visible to employers.',
        color: 'text-mono-900',
        bgColor: countdown.isExpiringSoon
          ? 'bg-mono-100 border border-mono-400'
          : 'bg-mono-0 border border-mono-300',
        icon: CheckCircle,
        countdown: countdown.formattedTime,
        isExpiringSoon: countdown.isExpiringSoon
      };
    }

    return {
      status: 'active',
      message: 'This resume is visible to employers.',
      color: 'text-mono-900',
      bgColor: 'bg-mono-0 border border-mono-300',
      icon: CheckCircle
    };
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      await activateResume(resume._id);
      toast.success('Resume Activated!', 'Your resume is now visible to employers for 7 days');
      // No need to call onStatusChange - context handles state updates
    } catch (error: any) {
      toast.error('Activation Failed', error.message || 'Failed to activate resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await deactivateResume(resume._id);
      toast.success('Resume Deactivated', 'Your resume is no longer visible to employers');
      // No need to call onStatusChange - context handles state updates
    } catch (error: any) {
      toast.error('Deactivation Failed', error.message || 'Failed to deactivate resume');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshVisibility = async () => {
    setLoading(true);
    try {
      await refreshResumeVisibility(resume._id);
      toast.success('Visibility Refreshed!', 'Your resume visibility timer has been reset to 7 days');
      // No need to call onStatusChange - context handles state updates
    } catch (error: any) {
      toast.error('Refresh Failed', error.message || 'Failed to refresh resume visibility');
    } finally {
      setLoading(false);
    }
  };

  const status = getActivationStatus();
  const IconComponent = status.icon;

  return (
    <div className="space-y-3">
      {/* Status Message */}
      <div className={`p-3 text-sm ${status.bgColor} ${status.color}`}>
        <div className="flex items-start space-x-2">
          <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{status.message}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {!resume.isActive || status.status === 'expired' ? (
          <motion.button
            onClick={handleActivate}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm border border-black"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Activating...' : 'Visible to Employer'}
          </motion.button>
        ) : (
          <>
            <motion.button
              onClick={handleDeactivate}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-white text-black font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm border border-black"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
              ) : (
                <StopCircle className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Stopping...' : 'Stop Visibility'}
            </motion.button>

            <motion.button
              onClick={handleRefreshVisibility}
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm border ${
                status.isExpiringSoon
                  ? 'bg-mono-900 text-mono-0 hover:bg-mono-800 border-mono-900 animate-pulse'
                  : 'bg-mono-900 text-mono-0 hover:bg-mono-800 border-mono-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-b-2 border-mono-0 mr-2" />
              ) : (
                <RefreshCw className={`h-4 w-4 mr-2 ${status.isExpiringSoon ? 'animate-spin' : ''}`} />
              )}
              {loading ? 'Refreshing...' : status.isExpiringSoon ? '🔄 Refresh Now!' : 'Refresh Visibility'}
            </motion.button>
          </>
        )}
      </div>

      {/* Real-time Countdown */}
      {status.status === 'active' && status.countdown && (
        <div className={`text-sm font-mono ${status.isExpiringSoon ? 'text-mono-800 font-semibold' : 'text-mono-700'}`}>
          <div className="flex items-center space-x-1">
            <Clock className={`h-4 w-4 ${status.isExpiringSoon ? 'text-mono-800' : 'text-mono-600'}`} />
            <span>{status.countdown}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeActivationButton;
