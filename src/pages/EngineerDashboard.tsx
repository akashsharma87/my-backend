import React, { useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, Eye, Download, Plus, Settings, Bell, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useResumesContext } from '../context/ResumesContext';
import Navbar from '../components/Navbar';
import ResumeActivationButton from '../components/ResumeActivationButton';
import { ResumeCardSkeleton, NetworkStatus, RetryWrapper } from '../components/LoadingStates';
import StateDebugger from '../components/StateDebugger';

interface Resume {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  originalFileName: string;
  createdAt: string;
  skills: string[];
  experienceYears?: number;
  location?: string;
  views: number;
  downloads: number;
  isActive: boolean;
  activatedAt?: string;
  activationExpiresAt?: string;
  canReactivate?: boolean;
}

export default function EngineerDashboard() {
  const { user } = useAuth();
  const hasInitiallyLoaded = useRef(false);
  const {
    resumes,
    loading,
    error,
    getResumes,
    deleteResume,
    syncWithServer
  } = useResumesContext();

  const fetchResumes = useCallback(async (forceRefresh: boolean = false) => {
    try {
      await getResumes({}, forceRefresh);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  }, [getResumes]); // Keep getResumes dependency but use ref to prevent multiple calls

  useEffect(() => {
    if (user && resumes.length === 0 && !loading && !hasInitiallyLoaded.current) {
      // Force refresh on initial load to ensure we get the latest server state
      hasInitiallyLoaded.current = true;
      fetchResumes(true);
    }
  }, [user, resumes.length, loading, fetchResumes]); // Keep fetchResumes but use ref to prevent multiple calls

  // Periodic sync to ensure data stays fresh
  useEffect(() => {
    if (!user || resumes.length === 0) return;

    const syncInterval = setInterval(() => {
      syncWithServer();
    }, 60000); // Sync every minute

    return () => clearInterval(syncInterval);
  }, [user, resumes.length, syncWithServer]);

  // Sync when page becomes visible again (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && resumes.length > 0) {
        syncWithServer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, resumes.length, syncWithServer]);

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await deleteResume(resumeId);
      // No need to update local state - context handles it optimistically
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume');
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-mono-0">
      <NetworkStatus />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Hero Section */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Top Bar with User Info and Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            {/* User Profile Section */}
            <div className="flex items-center space-x-5">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-mono-900 to-mono-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-mono-0 font-semibold text-2xl">
                    {user?.fullName?.charAt(0) || 'E'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-mono-0"></div>
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-mono-1000 mb-1 tracking-tight">
                  Welcome back, {user?.fullName?.split(' ')[0] || 'Engineer'}
                </h1>
                <p className="text-mono-600 text-sm flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  Active • Last login: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <motion.button
                className="p-3 bg-mono-50 hover:bg-mono-100 rounded-lg transition-all duration-200 relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="h-5 w-5 text-mono-700" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-mono-900 text-mono-0 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Notifications
                </span>
              </motion.button>

              <Link to="/engineer/profile" className="flex-1 lg:flex-none">
                <motion.button
                  className="w-full lg:w-auto p-3 bg-mono-50 hover:bg-mono-100 rounded-lg transition-all duration-200 relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="h-5 w-5 text-mono-700 mx-auto lg:mx-0" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-mono-900 text-mono-0 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Settings
                  </span>
                </motion.button>
              </Link>

              <Link to="/engineer/upload" className="flex-1 lg:flex-none">
                <motion.button
                  className="w-full lg:w-auto bg-mono-1000 hover:bg-mono-900 text-mono-0 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="h-5 w-5" />
                  <span>Upload Resume</span>
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Stats Cards - Modern Design */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {[
              {
                label: 'Total Resumes',
                value: resumes.length,
                icon: FileText,
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-600',
                change: '+2 this month'
              },
              {
                label: 'Profile Views',
                value: '127',
                icon: Eye,
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50',
                textColor: 'text-purple-600',
                change: '+12% this week'
              },
              {
                label: 'Applications',
                value: '23',
                icon: Upload,
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50',
                textColor: 'text-green-600',
                change: '+5 pending'
              },
              {
                label: 'Response Rate',
                value: '89%',
                icon: Download,
                color: 'from-orange-500 to-orange-600',
                bgColor: 'bg-orange-50',
                textColor: 'text-orange-600',
                change: '+3% vs last month'
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-mono-0 border border-mono-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-mono-1000 mb-1">{stat.value}</p>
                    <p className="text-xs text-mono-500 uppercase tracking-wider font-medium">{stat.label}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-mono-100">
                  <span className="text-xs text-mono-600">{stat.change}</span>
                  <motion.div
                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume Management */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="card-minimal p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-mono-1000">Resume Library</h2>
                <span className="text-sm text-mono-600">{resumes.length} files</span>
              </div>
              <RetryWrapper
                onRetry={fetchResumes}
                error={error}
                loading={loading}
              >
                {resumes.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <FileText className="h-12 w-12 text-mono-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-mono-900 mb-2">No resumes yet</h3>
                  <p className="text-mono-600 mb-6 text-sm">Upload your first resume to get started</p>
                  <Link to="/engineer/upload">
                    <motion.button
                      className="btn-primary px-6 py-2 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      Upload Resume
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {resumes.map((resume, index) => (
                    <motion.div
                      key={resume._id}
                      className="border border-mono-200 p-4 hover:border-mono-400 transition-colors duration-200 group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-mono-900 rounded-sm flex items-center justify-center group-hover:bg-mono-800 transition-colors duration-200">
                            <FileText className="h-5 w-5 text-mono-0" />
                          </div>
                          <div>
                <h4 className="font-medium text-mono-900 text-sm">{resume.originalFileName || resume.fileName}</h4>
                            <div className="flex items-center space-x-3 text-xs text-mono-600 mt-1">
                              <span>{formatFileSize(resume.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(resume.createdAt)}</span>
                              <span>•</span>
                              <span>{resume.views} views</span>
                            </div>
                            {resume.skills && resume.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resume.skills.slice(0, 3).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-mono-100 text-mono-800 text-xs rounded-sm border border-mono-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {resume.skills.length > 3 && (
                                  <span className="px-2 py-1 bg-mono-100 text-mono-600 text-xs rounded-sm border border-mono-200">
                                    +{resume.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Link to={`/resume/${resume._id}`}>
                            <motion.button
                              className="p-2 text-mono-600 hover:text-mono-900 hover:bg-mono-100 transition-colors duration-200"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Eye className="h-4 w-4" />
                            </motion.button>
                          </Link>
                          <motion.a
                            href={resume.fileUrl}
                            download
                            className="p-2 text-mono-600 hover:text-mono-900 hover:bg-mono-100 transition-colors duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Download className="h-4 w-4" />
                          </motion.a>
                          <motion.button
                            onClick={() => handleDeleteResume(resume._id)}
                            className="p-2 text-mono-600 hover:text-mono-900 hover:bg-mono-100 transition-colors duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            title="Delete resume"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Resume Activation Section */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <ResumeActivationButton
                          resumeId={resume._id}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
                )}
              </RetryWrapper>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {/* Quick Actions */}
            <div className="card-minimal p-6">
              <h3 className="text-lg font-medium text-mono-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { title: 'Upload Resume', desc: 'Add new resume', icon: Upload, link: '/engineer/upload' },
                  { title: 'View Profile', desc: 'Public profile', icon: Eye, link: '#' },
                  { title: 'Job Alerts', desc: 'Notifications', icon: Bell, link: '#' }
                ].map((action, index) => (
                  <Link key={index} to={action.link}>
                    <motion.div
                      className="flex items-center space-x-3 p-3 hover:bg-mono-50 transition-colors duration-200 cursor-pointer group"
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-8 h-8 bg-mono-900 rounded-sm flex items-center justify-center group-hover:bg-mono-800 transition-colors duration-200">
                        <action.icon className="h-4 w-4 text-mono-0" />
                      </div>
                      <div>
                        <p className="font-medium text-mono-900 text-sm">{action.title}</p>
                        <p className="text-xs text-mono-600">{action.desc}</p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Profile Status */}
            <div className="card-minimal p-6">
              <h3 className="text-lg font-medium text-mono-900 mb-4">Profile Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-mono-700">Completion</span>
                    <span className="text-sm font-medium text-mono-900">75%</span>
                  </div>
                  <div className="w-full bg-mono-200 rounded-full h-2">
                    <div className="bg-mono-900 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <motion.button
                  className="w-full btn-secondary py-2 font-medium text-sm"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                >
                  Complete Profile
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* State Debugger - only in development */}
      <StateDebugger />
    </div>
  );
}