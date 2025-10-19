import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, Camera, Save, Edit3, User, Mail, Phone, Globe, 
  Building, Briefcase, Github, Linkedin, ExternalLink, X, Star,
  Award, GraduationCap, Languages, Clock, DollarSign, Briefcase as BriefcaseIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

interface ProfileData {
  fullName: string;
  email: string;
  userType: 'engineer' | 'employer';
  profilePicture?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  skills?: string[];
  experience?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  yearsOfExperience?: number;
  currentSalary?: string;
  expectedSalary?: string;
  availability?: 'immediately' | 'within_2_weeks' | 'within_month' | 'not_available';
  workType?: 'remote' | 'onsite' | 'hybrid' | 'flexible';
  languages?: string[];
  certifications?: string[];
  education?: string;
  achievements?: string[];
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    userType: 'engineer'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        userType: user.userType,
        profilePicture: user.profilePicture || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        phone: user.phone || '',
        company: user.company || '',
        jobTitle: user.jobTitle || '',
        skills: user.skills || [],
        experience: user.experience || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        portfolio: user.portfolio || '',
        yearsOfExperience: user.yearsOfExperience || 0,
        currentSalary: user.currentSalary || '',
        expectedSalary: user.expectedSalary || '',
        availability: user.availability || 'not_available',
        workType: user.workType || 'flexible',
        languages: user.languages || [],
        certifications: user.certifications || [],
        education: user.education || '',
        achievements: user.achievements || []
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileData, value: string | string[]) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsChange = (value: string) => {
    const skills = value.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    handleInputChange('skills', skills);
  };

  const getProfileCompletionPercentage = () => {
    const fields = [
      profileData.fullName,
      profileData.bio,
      profileData.location,
      profileData.phone,
      (profileData.skills?.length || 0) > 0,
      profileData.experience,
      profileData.userType === 'engineer' ? profileData.github : profileData.company,
      profileData.userType === 'engineer' ? profileData.linkedin : profileData.jobTitle,
      profileData.website,
      profileData.education,
      (profileData.languages?.length || 0) > 0,
      profileData.userType === 'engineer' ? profileData.portfolio : null,
      profileData.userType === 'engineer' ? profileData.yearsOfExperience : null
    ];
    const relevantFields = fields.filter(field => field !== null);
    const completedFields = relevantFields.filter(field => field && field !== '' && field !== 0).length;
    return Math.round((completedFields / relevantFields.length) * 100);
  };

  return (
    <div className="min-h-screen bg-mono-0">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-mono-900 mb-3">
            Profile Dashboard
          </h1>
          <p className="text-mono-600 text-lg">Manage your professional profile and showcase your expertise</p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Enhanced Profile Card */}
          <motion.div
            className="xl:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-mono-0 border border-mono-200 p-8">
              <div className="text-center">
                {/* Profile Picture */}
                <div className="relative mb-6">
                  <div className="w-32 h-32 bg-mono-900 flex items-center justify-center mx-auto mb-4">
                    {profileData.profilePicture ? (
                      <img
                        src={profileData.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover border-4 border-mono-0"
                      />
                    ) : (
                      <span className="text-mono-0 font-bold text-4xl">
                        {profileData.fullName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <motion.button
                      className="absolute bottom-2 right-1/2 transform translate-x-1/2 translate-y-1/2 w-10 h-10 bg-mono-900 text-mono-0 flex items-center justify-center hover:bg-mono-800 transition-colors border border-mono-900"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Camera className="h-5 w-5" />
                    </motion.button>
                  )}
                </div>

                {/* Profile Info */}
                <div className="space-y-3 mb-6">
                  <h2 className="text-2xl font-bold text-mono-900">{profileData.fullName}</h2>
                  <div className="flex items-center justify-center space-x-2 text-mono-600">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{profileData.email}</span>
                  </div>
                  <div className="inline-flex items-center px-3 py-1 text-sm font-medium bg-mono-100 text-mono-900 border border-mono-300">
                    <User className="h-4 w-4 mr-2" />
                    {profileData.userType === 'engineer' ? 'Software Engineer' : 'Employer'}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-mono-50 border border-mono-200">
                    <div className="text-2xl font-bold text-mono-900">{getProfileCompletionPercentage()}%</div>
                    <div className="text-xs text-mono-600">Complete</div>
                  </div>
                  <div className="text-center p-3 bg-mono-50 border border-mono-200">
                    <div className="text-2xl font-bold text-mono-900">{profileData.skills?.length || 0}</div>
                    <div className="text-xs text-mono-600">Skills</div>
                  </div>
                  {profileData.userType === 'engineer' && profileData.yearsOfExperience && (
                    <div className="text-center p-3 bg-mono-50 border border-mono-200 col-span-2">
                      <div className="text-2xl font-bold text-mono-900">{profileData.yearsOfExperience}</div>
                      <div className="text-xs text-mono-600">Years Experience</div>
                    </div>
                  )}
                  {(profileData.certifications?.length || 0) > 0 && (
                    <div className="text-center p-3 bg-mono-50 border border-mono-200 col-span-2">
                      <div className="text-2xl font-bold text-mono-900">{profileData.certifications?.length || 0}</div>
                      <div className="text-xs text-mono-600">Certifications</div>
                    </div>
                  )}
                </div>

                {/* Location & Join Date */}
                <div className="space-y-2 mb-6 text-sm text-mono-600">
                  {profileData.location && (
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{profileData.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>

                {/* Social Links */}
                {(profileData.github || profileData.linkedin || profileData.website || profileData.portfolio) && (
                  <div className="flex justify-center space-x-3 mb-6">
                    {profileData.github && (
                      <a href={profileData.github} target="_blank" rel="noopener noreferrer"
                         className="p-2 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900">
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {profileData.linkedin && (
                      <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer"
                         className="p-2 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {profileData.portfolio && (
                      <a href={profileData.portfolio} target="_blank" rel="noopener noreferrer"
                         className="p-2 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {profileData.website && (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer"
                         className="p-2 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900">
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Edit Button */}
                <motion.button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`w-full px-4 py-3 font-medium transition-all duration-200 flex items-center justify-center space-x-2 border ${
                    isEditing
                      ? 'bg-mono-0 text-mono-900 hover:bg-mono-100 border-mono-900'
                      : 'bg-mono-900 text-mono-0 hover:bg-mono-800 border-mono-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Profile Form */}
          <motion.div
            className="xl:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-mono-0 border border-mono-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-mono-100 flex items-center justify-center mr-4">
                    <User className="h-5 w-5 text-mono-900" />
                  </div>
                  <h3 className="text-xl font-bold text-mono-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-mono-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-mono-300 focus:ring-2 focus:ring-mono-500 focus:border-mono-500 disabled:bg-mono-50 disabled:text-mono-500 transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-mono-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-3 border border-mono-300 bg-mono-50 text-mono-500"
                    />
                    <p className="text-xs text-mono-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={profileData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={profileData.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-mono-0 border border-mono-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-mono-100 flex items-center justify-center mr-4">
                    <Briefcase className="h-5 w-5 text-mono-900" />
                  </div>
                  <h3 className="text-xl font-bold text-mono-900">Professional Details</h3>
                </div>

                {profileData.userType === 'engineer' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                        <div className="relative">
                          <Github className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="url"
                            value={profileData.github || ''}
                            onChange={(e) => handleInputChange('github', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                            placeholder="https://github.com/username"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="url"
                            value={profileData.linkedin || ''}
                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio</label>
                        <div className="relative">
                          <ExternalLink className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="url"
                            value={profileData.portfolio || ''}
                            onChange={(e) => handleInputChange('portfolio', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                            placeholder="https://portfolio.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                        <input
                          type="number"
                          value={profileData.yearsOfExperience || ''}
                          onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                          placeholder="Years of experience"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                      <input
                        type="text"
                        value={profileData.skills?.join(', ') || ''}
                        onChange={(e) => handleSkillsChange(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        placeholder="React, Node.js, Python, AWS, etc."
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Salary</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={profileData.currentSalary || ''}
                            onChange={(e) => handleInputChange('currentSalary', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                            placeholder="Current salary range"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expected Salary</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={profileData.expectedSalary || ''}
                            onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                            placeholder="Expected salary range"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <select
                            value={profileData.availability || 'not_available'}
                            onChange={(e) => handleInputChange('availability', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all appearance-none"
                          >
                            <option value="immediately">Immediately</option>
                            <option value="within_2_weeks">Within 2 weeks</option>
                            <option value="within_month">Within a month</option>
                            <option value="not_available">Not available</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
                        <div className="relative">
                          <BriefcaseIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <select
                            value={profileData.workType || 'flexible'}
                            onChange={(e) => handleInputChange('workType', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all appearance-none"
                          >
                            <option value="remote">Remote</option>
                            <option value="onsite">On-site</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="flexible">Flexible</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.company || ''}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          disabled={!isEditing}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                          placeholder="Company name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={profileData.jobTitle || ''}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        placeholder="Your job title"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      value={profileData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <textarea
                    value={profileData.experience || ''}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    placeholder="Describe your professional experience..."
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-mono-0 border border-mono-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-mono-100 flex items-center justify-center mr-4">
                    <GraduationCap className="h-5 w-5 text-mono-900" />
                  </div>
                  <h3 className="text-xl font-bold text-mono-900">Additional Information</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    <textarea
                      value={profileData.education || ''}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                      placeholder="Your educational background..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                      <div className="relative">
                        <Languages className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.languages?.join(', ') || ''}
                          onChange={(e) => {
                            const languages = e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang.length > 0);
                            handleInputChange('languages', languages);
                          }}
                          disabled={!isEditing}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                          placeholder="English, Spanish, French, etc."
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Separate languages with commas</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                      <div className="relative">
                        <Award className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.certifications?.join(', ') || ''}
                          onChange={(e) => {
                            const certifications = e.target.value.split(',').map(cert => cert.trim()).filter(cert => cert.length > 0);
                            handleInputChange('certifications', certifications);
                          }}
                          disabled={!isEditing}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                          placeholder="AWS Certified, Google Cloud, etc."
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Separate certifications with commas</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achievements</label>
                    <div className="relative">
                      <Star className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <textarea
                        value={profileData.achievements?.join('\n') || ''}
                        onChange={(e) => {
                          const achievements = e.target.value.split('\n').map(achievement => achievement.trim()).filter(achievement => achievement.length > 0);
                          handleInputChange('achievements', achievements);
                        }}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        placeholder="List your key achievements (one per line)..."
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">One achievement per line</p>
                  </div>
                </div>
              </div>

              {/* Save Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-4">
                  <motion.button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-3 border border-mono-900 text-mono-900 hover:bg-mono-100 transition-all duration-200 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="h-4 w-4 inline mr-2" />
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 font-medium border border-mono-900"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-mono-0 border-t-transparent animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </form>
          </motion.div>
        </div>

        {/* Profile Completion Progress */}
        <motion.div
          className="mt-8 bg-mono-0 border border-mono-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-mono-900">Profile Completion</h3>
            <span className="text-2xl font-bold text-mono-900">{getProfileCompletionPercentage()}%</span>
          </div>
          <div className="w-full bg-mono-200 h-3 mb-4">
            <motion.div
              className="bg-mono-900 h-3 transition-all duration-500"
              initial={{ width: 0 }}
              animate={{ width: `${getProfileCompletionPercentage()}%` }}
              transition={{ delay: 1, duration: 0.8 }}
            ></motion.div>
          </div>
          <p className="text-sm text-gray-600">
            Complete your profile to increase visibility and attract better opportunities.
          </p>
        </motion.div>
      </div>
    </div>
  );
}