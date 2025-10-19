import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Star,
  Building
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { optimizedApiCall } from '../utils/optimizedApi';
import Navbar from '../components/Navbar';

interface Resume {
  _id: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  createdAt: string;
  skills: string[];
  experienceYears?: number;
  location?: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  jobPreferences?: {
    jobType?: string;
    workWeek?: string;
    minCTC?: string;
    currency?: string;
    unpaidOk?: boolean;
    availability?: string;
    workMode?: string[];
    locations?: string[];
    companyTypes?: string[];
    consentToShare?: boolean;
    showPublicly?: boolean;
  };
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
      company?: string;
      position?: string;
      duration?: string;
      description?: string;
      location?: string;
      technologies?: string[];
    }>;
    education?: Array<{
      institution?: string;
      degree?: string;
      year?: string;
      gpa?: string;
      location?: string;
      honors?: string;
    }>;
    projects?: Array<{
      name?: string;
      description?: string;
      technologies?: string[];
      url?: string;
      duration?: string;
    }>;
    certifications?: Array<{
      name?: string;
      issuer?: string;
      date?: string;
      expiryDate?: string;
      credentialId?: string;
    }>;
    languages?: Array<{
      language?: string;
      proficiency?: string;
    }>;
    achievements?: Array<{
      title?: string;
      description?: string;
      date?: string;
      organization?: string;
    }>;
    volunteering?: Array<{
      organization?: string;
      role?: string;
      duration?: string;
      description?: string;
    }>;
    publications?: Array<{
      title?: string;
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
    extractedAt?: string;
    extractionStatus?: string;
  };
}

export default function EmployerResumeView() {
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResume = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await optimizedApiCall(`/resumes/${id}`, {
          method: 'GET',
          cache: false
        });
        
        if (response.success) {
          setResume(response.data.resume);
        } else {
          setError(response.message || 'Failed to load resume');
        }
      } catch (err: any) {
        console.error('Error fetching resume:', err);
        setError(err.message || 'Failed to load resume');
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  const handleDownload = async () => {
    if (!resume?.fileUrl) return;
    
    try {
      const response = await fetch(resume.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = resume.originalFileName || resume.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDisplayName = () => {
    return resume?.extractedData?.fullName || resume?.userId?.fullName || 'Engineer';
  };

  const getDisplayEmail = () => {
    return resume?.extractedData?.email || resume?.userId?.email || '';
  };

  const getDisplayPhone = () => {
    return resume?.extractedData?.phone || '';
  };

  const getDisplayLocation = () => {
    return resume?.extractedData?.address || 
           resume?.extractedData?.metadata?.location || 
           resume?.location || '';
  };

  const getAllSkills = () => {
    const extractedSkills = resume?.extractedData?.skills?.all || [];
    const basicSkills = resume?.skills || [];
    const combined = [...new Set([...extractedSkills, ...basicSkills])];
    return combined.filter(skill => skill && skill.trim());
  };

  const getExperienceYears = () => {
    return resume?.extractedData?.metadata?.totalExperienceYears || 
           resume?.experienceYears || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mono-0">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mono-900"></div>
            <span className="ml-3 text-mono-600">Loading resume...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-mono-0">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-mono-900 mb-2">Resume Not Found</h2>
            <p className="text-mono-600 mb-6">{error || 'The resume you are looking for is not available.'}</p>
            <Link
              to="/employer/browse"
              className="inline-flex items-center px-6 py-3 bg-mono-900 text-mono-0 font-medium hover:bg-mono-800 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Link>
          </div>
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
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <Link
              to="/employer/browse"
              className="inline-flex items-center px-4 py-2 text-mono-600 hover:text-mono-900 hover:bg-mono-100 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={handleDownload}
              className="inline-flex items-center px-6 py-3 bg-mono-900 text-mono-0 font-medium hover:bg-mono-800 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Resume
            </motion.button>
          </div>
        </motion.div>

        {/* Resume Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Info */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-mono-50 border border-mono-200 p-6 mb-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-mono-900 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-mono-0 text-2xl font-bold">
                    {getDisplayName().charAt(0)}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-mono-900 mb-2">{getDisplayName()}</h1>
                <p className="text-mono-600 text-sm">
                  {resume.extractedData?.metadata?.currentRole || 'Software Engineer'}
                </p>
              </div>

              <div className="space-y-4">
                {getDisplayEmail() && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-mono-500" />
                    <span className="text-sm text-mono-700">{getDisplayEmail()}</span>
                  </div>
                )}
                
                {getDisplayPhone() && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-mono-500" />
                    <span className="text-sm text-mono-700">{getDisplayPhone()}</span>
                  </div>
                )}
                
                {getDisplayLocation() && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-mono-500" />
                    <span className="text-sm text-mono-700">{getDisplayLocation()}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-4 w-4 text-mono-500" />
                  <span className="text-sm text-mono-700">{getExperienceYears()} years experience</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-mono-500" />
                  <span className="text-sm text-mono-700">Uploaded {formatDate(resume.createdAt)}</span>
                </div>
              </div>

              {/* Links */}
              {resume.extractedData?.links && (
                <div className="mt-6 pt-6 border-t border-mono-200">
                  <h3 className="text-sm font-semibold text-mono-800 mb-3">Links</h3>
                  <div className="space-y-2">
                    {resume.extractedData.links.linkedin && (
                      <a
                        href={resume.extractedData.links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-mono-600 hover:text-mono-900"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {resume.extractedData.links.github && (
                      <a
                        href={resume.extractedData.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-mono-600 hover:text-mono-900"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {resume.extractedData.links.portfolio && (
                      <a
                        href={resume.extractedData.links.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-mono-600 hover:text-mono-900"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Portfolio</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Main Content */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Summary */}
            {resume.extractedData?.summary && (
              <div className="bg-mono-50 border border-mono-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-mono-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Professional Summary
                </h2>
                <p className="text-mono-700 leading-relaxed">{resume.extractedData.summary}</p>
              </div>
            )}

            {/* Skills */}
            {getAllSkills().length > 0 && (
              <div className="bg-mono-50 border border-mono-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-mono-900 mb-4 flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {getAllSkills().map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-mono-200 text-mono-800 text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {resume.extractedData?.experience && resume.extractedData.experience.length > 0 && (
              <div className="bg-mono-50 border border-mono-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-mono-900 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Work Experience
                </h2>
                <div className="space-y-6">
                  {resume.extractedData.experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-mono-300 pl-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h3 className="font-semibold text-mono-900">{exp.position}</h3>
                        <span className="text-sm text-mono-600">{exp.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="h-4 w-4 text-mono-500" />
                        <span className="text-mono-700 font-medium">{exp.company}</span>
                        {exp.location && (
                          <>
                            <span className="text-mono-400">•</span>
                            <span className="text-mono-600 text-sm">{exp.location}</span>
                          </>
                        )}
                      </div>
                      {exp.description && (
                        <p className="text-mono-700 text-sm mb-3 leading-relaxed">{exp.description}</p>
                      )}
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {exp.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="px-2 py-1 bg-mono-200 text-mono-700 text-xs"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {resume.extractedData?.education && resume.extractedData.education.length > 0 && (
              <div className="bg-mono-50 border border-mono-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-mono-900 mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Education
                </h2>
                <div className="space-y-4">
                  {resume.extractedData.education.map((edu, index) => (
                    <div key={index} className="border-l-2 border-mono-300 pl-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                        <h3 className="font-semibold text-mono-900">{edu.degree}</h3>
                        <span className="text-sm text-mono-600">{edu.year}</span>
                      </div>
                      <p className="text-mono-700">{edu.institution}</p>
                      {edu.location && (
                        <p className="text-mono-600 text-sm">{edu.location}</p>
                      )}
                      {edu.gpa && (
                        <p className="text-mono-600 text-sm">GPA: {edu.gpa}</p>
                      )}
                      {edu.honors && (
                        <p className="text-mono-600 text-sm">{edu.honors}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resume.extractedData?.projects && resume.extractedData.projects.length > 0 && (
              <div className="bg-mono-50 border border-mono-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-mono-900 mb-4 flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Projects
                </h2>
                <div className="space-y-4">
                  {resume.extractedData.projects.map((project, index) => (
                    <div key={index} className="border-l-2 border-mono-300 pl-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h3 className="font-semibold text-mono-900">{project.name}</h3>
                        {project.duration && (
                          <span className="text-sm text-mono-600">{project.duration}</span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-mono-700 text-sm mb-2 leading-relaxed">{project.description}</p>
                      )}
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-mono-600 hover:text-mono-900 text-sm flex items-center mb-2"
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          View Project
                        </a>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="px-2 py-1 bg-mono-200 text-mono-700 text-xs"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {resume.extractedData?.certifications && resume.extractedData.certifications.length > 0 && (
              <div className="bg-mono-50 border border-mono-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-mono-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Certifications
                </h2>
                <div className="space-y-3">
                  {resume.extractedData.certifications.map((cert, index) => (
                    <div key={index} className="border-l-2 border-mono-300 pl-4">
                      <h3 className="font-semibold text-mono-900">{cert.name}</h3>
                      <p className="text-mono-700">{cert.issuer}</p>
                      <div className="flex items-center space-x-4 text-sm text-mono-600">
                        {cert.date && <span>Issued: {cert.date}</span>}
                        {cert.expiryDate && <span>Expires: {cert.expiryDate}</span>}
                      </div>
                      {cert.credentialId && (
                        <p className="text-mono-600 text-sm">ID: {cert.credentialId}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Preferences */}
            {resume.jobPreferences && (
              <div className="bg-mono-50 border border-mono-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-mono-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Job Preferences
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resume.jobPreferences.jobType && (
                    <div>
                      <span className="text-sm font-medium text-mono-700">Job Type:</span>
                      <p className="text-mono-900 capitalize">{resume.jobPreferences.jobType}</p>
                    </div>
                  )}
                  {resume.jobPreferences.workMode && resume.jobPreferences.workMode.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-mono-700">Work Mode:</span>
                      <p className="text-mono-900 capitalize">{resume.jobPreferences.workMode.join(', ')}</p>
                    </div>
                  )}
                  {resume.jobPreferences.availability && (
                    <div>
                      <span className="text-sm font-medium text-mono-700">Availability:</span>
                      <p className="text-mono-900 capitalize">{resume.jobPreferences.availability}</p>
                    </div>
                  )}
                  {resume.jobPreferences.minCTC && (
                    <div>
                      <span className="text-sm font-medium text-mono-700">Expected Salary:</span>
                      <p className="text-mono-900">
                        {resume.jobPreferences.currency || '$'}{resume.jobPreferences.minCTC}
                      </p>
                    </div>
                  )}
                  {resume.jobPreferences.locations && resume.jobPreferences.locations.length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-mono-700">Preferred Locations:</span>
                      <p className="text-mono-900">{resume.jobPreferences.locations.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
