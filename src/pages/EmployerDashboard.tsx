import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, FileText, Star, Filter, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useResumes } from '../hooks/useResumes';
import Navbar from '../components/Navbar';

interface Resume {
  _id: string;
  fileName: string;
  originalFileName: string;
  createdAt: string;
  skills: string[];
  experienceYears?: number;
  location?: string;
  isActive: boolean;
  activationExpiresAt?: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const { getResumes } = useResumes();
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentResumes = useCallback(async () => {
    try {
      const { resumes } = await getResumes({ limit: 20 }); // Get more to filter from

      // Filter for active resumes only (client-side backup)
      const activeResumes = resumes.filter(resume => {
        const isActive = resume.isActive;
        const isNotExpired = resume.activationExpiresAt ?
          new Date(resume.activationExpiresAt) > new Date() : false;
        return isActive && isNotExpired;
      });

      // Take only the first 5 active resumes
      setRecentResumes(activeResumes.slice(0, 5));
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  }, [getResumes]);

  useEffect(() => {
    fetchRecentResumes();
  }, [fetchRecentResumes]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-mono-0">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Minimalist Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div className="flex items-center space-x-4 mb-6 lg:mb-0">
              <div className="w-12 h-12 bg-mono-1000 rounded-sm flex items-center justify-center">
                <span className="text-mono-0 font-medium text-lg">
                  {user?.fullName?.charAt(0) || 'E'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-light text-mono-1000 mb-1">
                  {user?.fullName?.split(' ')[0] || 'Employer'}
                </h1>
                <p className="text-mono-600">
                  Talent Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                className="p-3 bg-mono-100 hover:bg-mono-200 rounded-md transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Filter className="h-4 w-4 text-mono-700" />
              </motion.button>

              <Link to="/employer/browse">
                <motion.button
                  className="btn-primary px-6 py-3 rounded-md font-medium flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search className="h-4 w-4" />
                  <span>Browse Talent</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Minimalist Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {[
            { label: 'Engineers', value: '1,247', icon: Users },
            { label: 'New This Week', value: '43', icon: TrendingUp },
            { label: 'Matches', value: '89', icon: Star },
            { label: 'Avg Response', value: '2.3h', icon: Clock }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="card-minimal p-6 text-center group hover-minimal"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 bg-mono-1000 rounded-sm flex items-center justify-center mx-auto mb-3 group-hover:bg-mono-800 transition-colors duration-200">
                <stat.icon className="h-4 w-4 text-mono-0" />
              </div>
              <p className="text-2xl font-light text-mono-1000 mb-1">{stat.value}</p>
              <p className="text-xs text-mono-600 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Talent */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="card-minimal p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-mono-1000">Latest Talent</h2>
                <Link to="/employer/browse">
                  <motion.button
                    className="text-mono-700 hover:text-mono-900 font-medium flex items-center space-x-1 text-sm"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span>View All</span>
                    <Search className="h-3 w-3" />
                  </motion.button>
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-mono-300 border-t-mono-900 rounded-full animate-spin"></div>
                </div>
              ) : recentResumes.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <FileText className="h-12 w-12 text-mono-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-mono-900 mb-2">No talent yet</h3>
                  <p className="text-mono-600 mb-6 text-sm">Start discovering engineering talent</p>
                  <Link to="/employer/browse">
                    <motion.button
                      className="btn-primary px-6 py-2 rounded-md font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      Browse Talent
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {recentResumes.map((resume, index) => (
                    <motion.div
                      key={resume._id}
                      className="border border-mono-200 rounded-md p-4 hover:border-mono-400 transition-colors duration-200 group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-mono-900 rounded-sm flex items-center justify-center group-hover:bg-mono-800 transition-colors duration-200">
                            <span className="text-mono-0 font-medium text-sm">
                              {resume.userId?.fullName?.charAt(0) || 'E'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-mono-900 text-sm">
                              {resume.userId?.fullName || 'Engineer'}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-mono-600 mt-1">
                              {resume.experienceYears && (
                                <>
                                  <span>{resume.experienceYears}y exp</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{formatDate(resume.createdAt)}</span>
                              {resume.location && (
                                <>
                                  <span>•</span>
                                  <span>{resume.location}</span>
                                </>
                              )}
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
                        <Link to={`/employer/resume/${resume._id}`}>
                          <motion.button
                            className="btn-secondary px-4 py-2 rounded-md font-medium text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            View Profile
                          </motion.button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {/* Quick Search */}
            <div className="card-minimal p-6">
              <h3 className="text-lg font-medium text-mono-900 mb-4">Quick Search</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label text-mono-800 text-sm">Popular Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Node.js', 'Python', 'Java', 'AWS'].map((skill) => (
                      <Link
                        key={skill}
                        to={`/employer/browse?skills=${encodeURIComponent(skill)}`}
                      >
                        <motion.span
                          className="px-3 py-1 bg-mono-100 text-mono-700 text-sm cursor-pointer hover:bg-mono-200 transition-colors duration-200 border border-mono-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {skill}
                        </motion.span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label text-mono-800 text-sm">Experience Level</label>
                  <select
                    className="form-input w-full px-3 py-2 border-mono-300 focus:border-mono-900 focus:ring-mono-900/20 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        window.location.href = `/employer/browse?experience=${encodeURIComponent(e.target.value)}`;
                      }
                    }}
                  >
                    <option value="">Any experience</option>
                    <option value="0-2">0-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="6+">6+ years</option>
                  </select>
                </div>
                <Link to="/employer/browse">
                  <motion.button
                    className="w-full btn-primary py-2 font-medium text-sm flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Advanced Search</span>
                  </motion.button>
                </Link>
              </div>
            </div>

            {/* Hiring Insights */}
            <div className="card-minimal p-6">
              <h3 className="text-lg font-medium text-mono-900 mb-4">Hiring Insights</h3>
              <div className="space-y-3">
                <div className="text-sm text-mono-700">
                  <p className="font-medium mb-1">Best practices:</p>
                  <ul className="space-y-1 text-mono-600">
                    <li>• Clear role requirements</li>
                    <li>• Quick response times</li>
                    <li>• Transparent process</li>
                    <li>• Competitive offers</li>
                  </ul>
                </div>
                <motion.button
                  className="w-full btn-secondary py-2 rounded-md font-medium text-sm"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                >
                  Learn More
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}