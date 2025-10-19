import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Mail, MapPin, FileText, ExternalLink, CheckCircle, Clock, AlertCircle, User, Briefcase, GraduationCap, Code, Award, Phone, Star, Languages, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useResumes } from '../hooks/useResumes';
import { config } from '../config/api';
import Navbar from '../components/Navbar';

interface UserProfile {
  _id: string;
  fullName?: string;
  email?: string;
  userType: 'engineer' | 'employer';
  phone?: string;
  location?: string;
  bio?: string;
  experience?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  website?: string;
  yearsOfExperience?: number;
  expectedSalary?: string;
  availability?: string;
  workType?: string;
  company?: string;
  jobTitle?: string;
  education?: string;
  languages?: string[];
  certifications?: string[];
  achievements?: string[];
}

interface Resume {
  _id: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  createdAt: string;
  skills: string[];
  experienceYears?: number;
  location?: string;
  isActive: boolean;
  activatedAt?: string;
  activationExpiresAt?: string;
  canReactivate?: boolean;
  extractedData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    summary?: string;
    links?: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
    };
    skills?: {
      technical?: string[];
      programming?: string[];
      frameworks?: string[];
      databases?: string[];
      tools?: string[];
      cloud?: string[];
      other?: string[];
      all?: string[];
      [category: string]: string[] | undefined;
    };
    experience?: Array<{
      position: string;
      company: string;
      duration: string;
      location?: string;
      description?: string;
      technologies?: string[];
      responsibilities?: string[];
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      year: string;
      gpa?: string;
      location?: string;
      honors?: string;
    }>;
    projects?: Array<{
      name: string;
      description: string | string[];
      technologies: string[];
      url?: string;
      duration?: string;
      role?: string;
      liveLink?: string;
    }>;
    certifications?: Array<{
      name: string;
      issuer?: string;
      date?: string;
      expiryDate?: string;
      credentialId?: string;
    }>;
    languages?: Array<{
      language: string;
      proficiency: string;
    }>;
    achievements?: Array<{
      title: string;
      description?: string;
      date?: string;
      organization?: string;
    }>;
    volunteering?: Array<{
      organization: string;
      role: string;
      duration?: string;
      description?: string;
    }>;
    publications?: Array<{
      title: string;
      publisher?: string;
      date?: string;
      url?: string;
    }>;
    metadata?: {
      totalExperienceYears?: number;
      currentRole?: string;
      currentCompany?: string;
      location?: string;
      availability?: string;
      salaryExpectation?: string;
    };
    extractionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    extractedAt?: string;
    rawOpenAIResponse?: Record<string, unknown>;
  };
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export default function ResumeView() {
  const { id } = useParams();
  const { getResume } = useResumes();
  const [resume, setResume] = useState<Resume | null>(null);
  const [extractedData, setExtractedData] = useState<Resume['extractedData'] | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchResume = useCallback(async (resumeId: string) => {
    try {
      const resumeData = await getResume(resumeId);
      setResume(resumeData);
      // Fetch the user profile for additional details
      if (resumeData.userId._id) {
        await fetchUserProfile(resumeData.userId._id);
      }
    } catch (error) {
      setError('Resume not found or you do not have permission to view it.');
      console.error('Error fetching resume:', error);
    } finally {
      setLoading(false);
    }
  }, [getResume]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserProfile(data.data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResume(id);
      fetchExtractedData(id);
    }
  }, [id, fetchResume]);

  const fetchExtractedData = async (resumeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/resumes/${resumeId}/enhanced-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Fetched enhanced data response:', data);
      if (data.success) {
        console.log('Setting enhanced extracted data:', data.data.resume.extractedData);
        setExtractedData(data.data.resume.extractedData);
        // Update resume with enhanced data if available
        if (data.data.resume.extractedData?.extractionStatus === 'completed') {
          setResume(prev => prev ? { ...prev, extractedData: data.data.resume.extractedData } : prev);
        }
      } else {
        console.log('Failed to fetch enhanced data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching enhanced data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleContact = () => {
    if (resume?.userId.email) {
      window.location.href = `mailto:${resume.userId.email}?subject=Interested in your profile on engineer.cv`;
    }
  };

  const handleDownload = async () => {
    if (!resume) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/resumes/${resume._id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resume.originalFileName || resume.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleReprocessOCR = async () => {
    if (!resume) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/resumes/${resume._id}/process-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('OCR processing started. Please refresh the page in a few seconds.');
        // Refresh extracted data after a short delay
        setTimeout(() => {
          fetchExtractedData(resume._id);
        }, 3000);
      }
    } catch (error) {
      console.error('Reprocess OCR error:', error);
    }
  };

  const getActivationStatus = () => {
    if (!resume) return null;
    
    const now = new Date();
    const expiresAt = resume.activationExpiresAt ? new Date(resume.activationExpiresAt) : null;
    
    if (!resume.isActive) {
      return {
        status: 'inactive',
        message: 'Resume is currently inactive',
        icon: AlertCircle,
        color: 'text-mono-700 bg-mono-100'
      };
    }

    if (expiresAt && now > expiresAt) {
      return {
        status: 'expired',
        message: 'Resume activation has expired',
        icon: Clock,
        color: 'text-mono-700 bg-mono-100'
      };
    }

    return {
      status: 'active',
      message: expiresAt ? `Active until ${formatDate(expiresAt.toISOString())}` : 'Resume is active',
      icon: CheckCircle,
      color: 'text-mono-900 bg-mono-50'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="min-h-screen bg-mono-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mono-900"></div>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="min-h-screen bg-mono-0 flex items-center justify-center px-4">
          <motion.div
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-mono-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-mono-700" />
            </div>
            <h1 className="text-2xl font-bold text-mono-900 mb-2">Resume Not Found</h1>
            <p className="text-mono-600 mb-6">{error}</p>
            <Link to={user?.userType === 'employer' ? '/employer/browse' : '/'}>
              <motion.button
                className="px-6 py-3 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-all duration-200 border border-mono-900"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go Back
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mono-0">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to={user?.userType === 'employer' ? '/employer/browse' : '/engineer/dashboard'}
            className="inline-flex items-center text-mono-600 hover:text-mono-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to {user?.userType === 'employer' ? 'Browse' : 'Dashboard'}
          </Link>
        </motion.div>

        {/* Profile Status Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-mono-0 border border-mono-200 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <motion.div
                  className="w-20 h-20 bg-mono-900 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <span className="text-mono-0 font-bold text-2xl">
                    {resume.userId?.fullName?.charAt(0) || 'E'}
                  </span>
                </motion.div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-mono-900 mb-1">
                    {resume.userId?.fullName || 'Engineer'}
                  </h1>
                  <p className="text-mono-600 mb-2">Engineering Professional</p>

                  {/* Activation Status */}
                  {(() => {
                    const status = getActivationStatus();
                    if (!status) return null;
                    const IconComponent = status.icon;
                    return (
                      <div className={`inline-flex items-center px-3 py-1 text-sm font-medium ${status.color} border border-mono-300`}>
                        <IconComponent className="h-4 w-4 mr-2" />
                        {status.message}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {user?.userType === 'employer' && (
                  <motion.button
                    onClick={handleContact}
                    className="px-4 py-2 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors duration-200 flex items-center space-x-2 border border-mono-900"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Contact</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Resume Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Debug Section - Remove in production */}
          <motion.div
            className="lg:col-span-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-mono-50 border border-mono-200 p-4">
              <h3 className="text-sm font-semibold text-mono-800 mb-2">Debug Info</h3>
              <div className="text-xs text-mono-700 space-y-1">
                <p>Resume ID: {resume?._id}</p>
                <p>Extracted Data Status: {extractedData ? 'Loaded' : 'Not loaded'}</p>
                <p>Extraction Status: {extractedData?.extractionStatus || 'Unknown'}</p>
                {extractedData && (
                  <div>
                    <p>Data Keys: {Object.keys(extractedData).join(', ')}</p>
                    <p>Skills Type: {typeof extractedData.skills} ({Array.isArray(extractedData.skills) ? 'array' : 'object'})</p>
                    <p>Experience Count: {extractedData.experience?.length || 0}</p>
                    <p>Projects Count: {extractedData.projects?.length || 0}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          {/* Main Resume Data */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Show message if no extracted data */}
            {!extractedData && (
              <div className="bg-mono-50 border border-mono-200 p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-mono-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-mono-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-mono-900 mb-2">Processing Resume</h3>
                  <p className="text-mono-700 mb-4">
                    We're extracting information from this resume. This usually takes a few moments.
                  </p>
                  <button
                    onClick={() => fetchExtractedData(resume._id)}
                    className="px-4 py-2 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors mr-2 border border-mono-900"
                  >
                    Refresh Data
                  </button>
                  <button
                    onClick={handleReprocessOCR}
                    className="px-4 py-2 bg-mono-0 text-mono-900 hover:bg-mono-100 transition-colors border border-mono-900"
                  >
                    Reprocess OCR
                  </button>
                </div>
              </div>
            )}
            {/* Personal Information & Profile Details */}
            {(extractedData || userProfile) && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <div className="flex items-center mb-6">
                  <User className="h-6 w-6 text-mono-900 mr-3" />
                  <h2 className="text-xl font-bold text-mono-900">Profile Information</h2>
                </div>
                
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-mono-400" />
                    <span className="text-mono-500 font-medium">Name:</span>
                    <span className="text-mono-900">
                      {userProfile?.fullName || extractedData?.fullName || resume?.userId?.fullName || 'Engineer'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-mono-400" />
                    <span className="text-mono-900">
                      {userProfile?.email || extractedData?.email || resume?.userId?.email}
                    </span>
                  </div>
                  {(userProfile?.phone || extractedData?.phone) && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-mono-400" />
                      <span className="text-mono-900">{userProfile?.phone || extractedData?.phone}</span>
                    </div>
                  )}
                  {(userProfile?.location || extractedData?.address) && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-mono-400" />
                      <span className="text-mono-900">{userProfile?.location || extractedData?.address}</span>
                    </div>
                  )}
                </div>

                {/* Professional Summary/Bio */}
                {(userProfile?.bio || extractedData?.summary) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-mono-900 mb-3">About</h3>
                    <p className="text-mono-700 leading-relaxed">
                      {userProfile?.bio || extractedData?.summary}
                    </p>
                  </div>
                )}

                {/* Professional Details for Engineers */}
                {userProfile?.userType === 'engineer' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {userProfile?.yearsOfExperience && (
                      <div className="flex items-center space-x-3">
                        <Star className="h-4 w-4 text-mono-400" />
                        <span className="text-mono-500 font-medium">Experience:</span>
                        <span className="text-mono-900">{userProfile.yearsOfExperience} years</span>
                      </div>
                    )}
                    {userProfile?.availability && (
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-mono-400" />
                        <span className="text-mono-500 font-medium">Availability:</span>
                        <span className="text-mono-900 capitalize">
                          {userProfile.availability.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {userProfile?.workType && (
                      <div className="flex items-center space-x-3">
                        <Briefcase className="h-4 w-4 text-mono-400" />
                        <span className="text-mono-500 font-medium">Work Type:</span>
                        <span className="text-mono-900 capitalize">{userProfile.workType}</span>
                      </div>
                    )}
                    {userProfile?.expectedSalary && (
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-4 w-4 text-mono-400" />
                        <span className="text-mono-500 font-medium">Expected Salary:</span>
                        <span className="text-mono-900">{userProfile.expectedSalary}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Professional Details for Employers */}
                {userProfile?.userType === 'employer' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {userProfile?.company && (
                      <div className="flex items-center space-x-3">
                        <Briefcase className="h-4 w-4 text-mono-400" />
                        <span className="text-mono-500 font-medium">Company:</span>
                        <span className="text-mono-900">{userProfile.company}</span>
                      </div>
                    )}
                    {userProfile?.jobTitle && (
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-mono-400" />
                        <span className="text-mono-500 font-medium">Position:</span>
                        <span className="text-mono-900">{userProfile.jobTitle}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Links */}
                {(extractedData?.links || userProfile?.github || userProfile?.linkedin || userProfile?.portfolio || userProfile?.website) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(userProfile?.github || extractedData?.links?.github) && (
                      <a
                        href={userProfile?.github || extractedData?.links?.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900"
                      >
                        <span className="text-sm">GitHub</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    {(userProfile?.linkedin || extractedData?.links?.linkedin) && (
                      <a
                        href={userProfile?.linkedin || extractedData?.links?.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900"
                      >
                        <span className="text-sm">LinkedIn</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    {(userProfile?.portfolio || extractedData?.links?.portfolio) && (
                      <a
                        href={userProfile?.portfolio || extractedData?.links?.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900"
                      >
                        <span className="text-sm">Portfolio</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    {userProfile?.website && (
                      <a
                        href={userProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900"
                      >
                        <span className="text-sm">Website</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Professional Summary */}
            {(extractedData?.summary || userProfile?.experience) && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <h2 className="text-xl font-bold text-mono-900 mb-4">Professional Summary</h2>
                {extractedData?.summary && (
                  <p className="text-mono-700 leading-relaxed mb-4">{extractedData.summary}</p>
                )}
                {userProfile?.experience && (
                  <div>
                    <h3 className="text-lg font-semibold text-mono-800 mb-2">Experience Details</h3>
                    <p className="text-mono-700 leading-relaxed">{userProfile.experience}</p>
                  </div>
                )}
              </div>
            )}

            {/* Work Experience */}
            {extractedData?.experience && extractedData.experience.length > 0 && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <div className="flex items-center mb-6">
                  <Briefcase className="h-6 w-6 text-mono-900 mr-3" />
                  <h2 className="text-xl font-bold text-mono-900">Work Experience</h2>
                </div>
                
                <div className="space-y-6">
                  {extractedData.experience.map((exp, index: number) => (
                    <motion.div
                      key={index}
                      className="border-l-4 border-blue-200 pl-6 pb-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                      <p className="text-blue-600 font-medium mb-2">{exp.company}</p>
                      {exp.duration && (
                        <p className="text-sm text-gray-500 mb-3">{exp.duration}</p>
                      )}
                      {exp.location && (
                        <p className="text-sm text-gray-500 mb-3">{exp.location}</p>
                      )}
                      {exp.responsibilities && Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                        <ul className="text-gray-700 space-y-1">
                          {exp.responsibilities.map((responsibility, respIndex) => (
                            <li key={respIndex} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <span>{responsibility}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {((extractedData?.education && extractedData.education.length > 0) || userProfile?.education) && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <div className="flex items-center mb-6">
                  <GraduationCap className="h-6 w-6 text-mono-900 mr-3" />
                  <h2 className="text-xl font-bold text-mono-900">Education</h2>
                </div>

                <div className="space-y-4">
                  {/* User Profile Education */}
                  {userProfile?.education && (
                    <motion.div
                      className="border border-mono-200 p-4 bg-mono-50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center mb-2">
                        <GraduationCap className="h-4 w-4 text-mono-900 mr-2" />
                        <h3 className="font-semibold text-mono-900">Educational Background</h3>
                      </div>
                      <p className="text-mono-700 leading-relaxed">{userProfile.education}</p>
                    </motion.div>
                  )}
                  
                  {/* Extracted Education Data */}
                  {extractedData?.education?.map((edu: { institution: string; degree: string; year: string; gpa?: string }, index: number) => (
                    <motion.div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-blue-600 mb-1">{edu.institution}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {edu.year && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{edu.year}</span>
                          </div>
                        )}
                        {edu.gpa && <span>GPA: {edu.gpa}</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {extractedData?.projects && extractedData.projects.length > 0 && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <div className="flex items-center mb-6">
                  <Code className="h-6 w-6 text-mono-900 mr-3" />
                  <h2 className="text-xl font-bold text-mono-900">Projects</h2>
                </div>
                
                <div className="space-y-4">
                  {extractedData.projects.map((project, index: number) => (
                    <motion.div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        {project.liveLink && (
                          <a
                            href={project.liveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            Live Link
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                      {project.role && (
                        <p className="text-blue-600 text-sm mb-2">{project.role}</p>
                      )}
                      {project.duration && (
                        <p className="text-gray-500 text-sm mb-2">{project.duration}</p>
                      )}
                      {project.description && (
                        <div className="text-gray-700 mb-3">
                          {Array.isArray(project.description) ? (
                            <ul className="space-y-1">
                              {project.description.map((desc, descIndex) => (
                                <li key={descIndex} className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  <span>{desc}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>{project.description}</p>
                          )}
                        </div>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech: string, techIndex: number) => (
                            <span
                              key={techIndex}
                              className="px-2 py-1 bg-mono-100 text-mono-800 text-xs border border-mono-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Achievements & Accomplishments */}
            {((extractedData?.achievements && extractedData.achievements.length > 0) || (userProfile?.achievements && userProfile.achievements.length > 0)) && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <div className="flex items-center mb-6">
                  <Award className="h-6 w-6 text-mono-900 mr-3" />
                  <h2 className="text-xl font-bold text-mono-900">Key Achievements</h2>
                </div>

                <div className="space-y-3">
                  {/* User Profile Achievements */}
                  {userProfile?.achievements?.map((achievement: string, index: number) => (
                    <motion.div
                      key={`profile-${index}`}
                      className="flex items-start space-x-3 p-3 bg-mono-50 border-l-4 border-mono-400"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="w-2 h-2 bg-mono-400 mt-2 flex-shrink-0"></div>
                      <p className="text-mono-800 text-sm leading-relaxed">{achievement}</p>
                    </motion.div>
                  ))}
                  
                  {/* Extracted Achievements */}
                  {extractedData?.achievements?.map((achievement, index: number) => (
                    <motion.div
                      key={`extracted-${index}`}
                      className="flex items-start space-x-3 p-3 bg-mono-50 border-l-4 border-mono-600"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: (userProfile?.achievements?.length || 0) * 0.1 + index * 0.1 }}
                    >
                      <div className="w-2 h-2 bg-mono-600 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-mono-800 text-sm font-medium">{achievement.title}</p>
                        {achievement.description && (
                          <p className="text-mono-600 text-xs mt-1">{achievement.description}</p>
                        )}
                        {achievement.organization && (
                          <p className="text-mono-900 text-xs mt-1">{achievement.organization}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Skills */}
            {((resume?.skills && resume.skills.length > 0) || (extractedData?.skills && Object.keys(extractedData.skills).length > 0) || (userProfile?.skills && userProfile.skills.length > 0)) && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <h3 className="text-xl font-bold text-mono-900 mb-4">Technical Skills</h3>
                
                {/* User Profile Skills */}
                {userProfile?.skills && userProfile.skills.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Core Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills.map((skill: string, index: number) => (
                        <motion.span
                          key={`profile-${index}`}
                          className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Categorized Skills from extracted data */}
                {extractedData?.skills && Object.keys(extractedData.skills).length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Extracted Skills</h4>
                    {Object.entries(extractedData.skills).map(([category, skills], categoryIndex) => (
                      <div key={categoryIndex}>
                        <h5 className="text-sm font-semibold text-gray-600 mb-2">{category}</h5>
                        <div className="flex flex-wrap gap-2">
                          {skills?.map((skill: string, index: number) => (
                            <motion.span
                              key={index}
                              className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Fallback to basic skills if no categorized skills */}
                {(!extractedData?.skills || Object.keys(extractedData.skills).length === 0) && resume?.skills && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Resume Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((skill: string, index: number) => (
                        <motion.span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Certifications */}
            {((extractedData?.certifications && extractedData.certifications.length > 0) || (userProfile?.certifications && userProfile.certifications.length > 0)) && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <div className="flex items-center mb-4">
                  <Award className="h-5 w-5 text-mono-900 mr-2" />
                  <h3 className="text-xl font-bold text-mono-900">Certifications</h3>
                </div>
                <div className="space-y-2">
                  {userProfile?.certifications?.map((cert: string, index: number) => (
                    <div key={`profile-cert-${index}`} className="text-mono-700 p-2 bg-mono-50 border border-mono-200">
                      {cert}
                    </div>
                  ))}
                  {extractedData?.certifications?.map((cert, index: number) => (
                    <div key={`extracted-cert-${index}`} className="text-mono-700 p-2 bg-mono-50 border border-mono-200">
                      {typeof cert === 'string' ? cert : cert.name}
                      {typeof cert === 'object' && cert.issuer && (
                        <span className="text-mono-500 text-sm ml-2">- {cert.issuer}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {((extractedData?.languages && extractedData.languages.length > 0) || (userProfile?.languages && userProfile.languages.length > 0)) && (
              <div className="bg-mono-0 border border-mono-200 p-6">
                <div className="flex items-center mb-4">
                  <Languages className="h-5 w-5 text-mono-900 mr-2" />
                  <h3 className="text-xl font-bold text-mono-900">Languages</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userProfile?.languages?.map((lang: string, index: number) => (
                    <span
                      key={`profile-lang-${index}`}
                      className="px-3 py-1 bg-mono-100 text-mono-800 text-sm font-medium border border-mono-300"
                    >
                      {lang}
                    </span>
                  ))}
                  {extractedData?.languages?.map((lang, index: number) => (
                    <span
                      key={`extracted-lang-${index}`}
                      className="px-2 py-1 bg-mono-100 text-mono-800 text-sm border border-mono-300"
                    >
                      {typeof lang === 'string' ? lang : `${lang.language} (${lang.proficiency})`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume File Info */}
            <div className="bg-mono-0 border border-mono-200 p-6">
              <h3 className="text-xl font-bold text-mono-900 mb-4">Resume File</h3>

              <div className="border border-mono-200 p-4 bg-mono-50 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-mono-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-mono-900" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-mono-900 text-sm">
                      {resume.originalFileName || resume.fileName}
                    </h4>
                    <p className="text-xs text-mono-600">
                      Uploaded {formatDate(resume.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <motion.a
                  href={resume.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-mono-50 text-mono-700 hover:bg-mono-100 transition-colors border border-mono-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Original</span>
                </motion.a>
              </div>
            </div>

          </motion.div>
        </div>

        {/* Download Button at Bottom */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.button
            onClick={handleDownload}
            className="px-8 py-4 bg-mono-900 text-mono-0 font-semibold text-lg hover:bg-mono-800 transition-all duration-200 flex items-center space-x-3 mx-auto border border-mono-900"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="h-6 w-6" />
            <span>Download Resume</span>
          </motion.button>
          <p className="text-mono-500 text-sm mt-2">Download the original resume file</p>
        </motion.div>
      </div>
    </div>
  );
}