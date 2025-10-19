import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Calendar, Star, Eye, X, LogIn, Plus, Sliders } from 'lucide-react';
import { useResumesContext } from '../context/ResumesContext';
import { useAuth } from '../hooks/useAuth';
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
    education?: Array<{
      degree?: string;
      institution?: string;
      year?: string;
    }>;
    metadata?: {
      totalExperienceYears?: number;
      currentRole?: string;
      currentCompany?: string;
      location?: string;
      availability?: string;
      salaryExpectation?: string;
    };
  };
}

export default function ResumeBrowser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getResumes } = useResumesContext();
  const getResumesRef = useRef(getResumes);

  // Update ref when getResumes changes
  useEffect(() => {
    getResumesRef.current = getResumes;
  }, [getResumes]);

  const [searchParams] = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false); // Hidden by default on mobile
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [skillsSearch, setSkillsSearch] = useState('');
  const [locationsSearch, setLocationsSearch] = useState('');
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [customFilterType, setCustomFilterType] = useState('');
  const [customFilterValue, setCustomFilterValue] = useState('');
  const [customFilters, setCustomFilters] = useState<{type: string, value: string}[]>([]);
  const isLoadingRef = useRef(false);

  // Advanced filter state matching the reference pattern
  const [currentFilters, setCurrentFilters] = useState({
    skills: [] as string[],
    locations: [] as string[],
    experience: [] as string[],
    workType: [] as string[],
    jobType: [] as string[],
    salaryRange: [0, 200000] as [number, number],
    education: [] as string[],
    availability: '' as string,
  });

  // Handle responsive filter visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setShowFilters(true);
      } else {
        setShowFilters(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize filters from URL parameters
  useEffect(() => {
    const skillsParam = searchParams.get('skills');
    const experienceParam = searchParams.get('experience');
    const locationParam = searchParams.get('location');
    const searchParam = searchParams.get('search');

    if (skillsParam || experienceParam || locationParam || searchParam) {
      setCurrentFilters(prev => ({
        ...prev,
        skills: skillsParam ? [skillsParam] : prev.skills,
        experience: experienceParam ? [experienceParam] : prev.experience,
        locations: locationParam ? [locationParam] : prev.locations,
      }));
    }

    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadResumes = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    try {
      // Use context hook for proper authentication and error handling
      const response = await getResumesRef.current({}, false);
      setResumes(response.resumes || []);

      // Extract unique skills and locations
      const skillsSet = new Set<string>();
      const locationsSet = new Set<string>();

      // Add popular Indian locations as base options
      const popularLocations = [
        "Remote", "Bangalore", "Hyderabad", "Delhi", "Pune", "Chennai", "Mumbai",
        "Gurugram", "Noida", "Kolkata", "Ahmedabad", "Jaipur", "Indore",
        "Coimbatore", "Kochi", "Chandigarh", "Mohali", "Thiruvananthapuram",
        "Bhubaneswar", "Mysore", "Nagpur", "Vadodara", "Surat", "Lucknow"
      ];

      popularLocations.forEach(location => locationsSet.add(location));

      response.resumes?.forEach(resume => {
        resume.skills?.forEach((skill: string) => skillsSet.add(skill));
        if (resume.location) {
          locationsSet.add(resume.location);
        }
      });

      setAllSkills(Array.from(skillsSet).sort());
      setAllLocations(Array.from(locationsSet).sort());

    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // No dependencies to prevent infinite loop

  // Authentication check
  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    loadResumes();
  }, [user, navigate, loadResumes]); // Run when user changes or on mount

  // Memoized filtered resumes for better performance
  const filteredResumes = useMemo(() => {
    // First filter: Only show active and non-expired resumes for employers
    let filtered = resumes.filter(resume => {
      // For employers, only show active resumes that haven't expired
      if (user?.userType === 'employer') {
        const isActive = resume.isActive;
        const isNotExpired = resume.activationExpiresAt ?
          new Date(resume.activationExpiresAt) > new Date() : false;
        return isActive && isNotExpired;
      }
      // For engineers, show all their resumes
      return true;
    });

    // Search filter (using debounced search term)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(resume =>
        resume.userId?.fullName?.toLowerCase().includes(searchLower) ||
        resume.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
        resume.location?.toLowerCase().includes(searchLower)
      );
    }

    // Skills filter
    if (currentFilters.skills.length > 0) {
      filtered = filtered.filter(resume =>
        currentFilters.skills.every(skill =>
          resume.skills?.some(resumeSkill =>
            resumeSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    // Experience filter - Enhanced with more levels
    if (currentFilters.experience.length > 0) {
      filtered = filtered.filter(resume => {
        const experience = resume.experienceYears || resume.extractedData?.metadata?.totalExperienceYears || 0;
        return currentFilters.experience.some(exp => {
          switch (exp) {
            case 'entry':
              return experience <= 2;
            case 'mid':
              return experience >= 2 && experience <= 5;
            case 'senior':
              return experience >= 5 && experience <= 10;
            case 'executive':
              return experience >= 10;
            default:
              return true;
          }
        });
      });
    }

    // Location filter - Enhanced with job preferences
    if (currentFilters.locations.length > 0) {
      filtered = filtered.filter(resume => {
        const resumeLocation = resume.location?.toLowerCase() || '';
        const extractedLocation = resume.extractedData?.metadata?.location?.toLowerCase() || '';
        const preferredLocations = resume.jobPreferences?.locations?.map(loc => loc.toLowerCase()) || [];

        return currentFilters.locations.some(location => {
          const filterLocation = location.toLowerCase();
          return resumeLocation.includes(filterLocation) ||
                 extractedLocation.includes(filterLocation) ||
                 preferredLocations.some(prefLoc => prefLoc.includes(filterLocation));
        });
      });
    }

    // Work Type filter (Remote, Hybrid, In Office)
    if (currentFilters.workType.length > 0) {
      filtered = filtered.filter(resume => {
        const workModes = resume.jobPreferences?.workMode || [];
        return currentFilters.workType.some(workType => {
          switch (workType) {
            case 'remote':
              return workModes.includes('remote');
            case 'hybrid':
              return workModes.includes('hybrid');
            case 'office':
              return workModes.includes('office');
            default:
              return false;
          }
        });
      });
    }

    // Job Type filter (Full Time, Part Time, Contract, Internship)
    if (currentFilters.jobType.length > 0) {
      filtered = filtered.filter(resume => {
        const jobType = resume.jobPreferences?.jobType;
        return currentFilters.jobType.some(type => {
          switch (type) {
            case 'fulltime':
              return jobType === 'fulltime';
            case 'parttime':
              return jobType === 'parttime';
            case 'contract':
              return jobType === 'contract'; // Note: may need to add this to schema
            case 'internship':
              return jobType === 'internship';
            default:
              return false;
          }
        });
      });
    }

    // Salary Range filter
    if (currentFilters.salaryRange[0] > 0 || currentFilters.salaryRange[1] < 200000) {
      filtered = filtered.filter(resume => {
        const minCTC = resume.jobPreferences?.minCTC;
        const salaryExpectation = resume.extractedData?.metadata?.salaryExpectation;

        if (!minCTC && !salaryExpectation) return true; // Include if no salary info

        // Parse salary from string (handle different formats)
        const parseSalary = (salaryStr: string) => {
          if (!salaryStr) return 0;
          const numStr = salaryStr.replace(/[^\d.]/g, '');
          const num = parseFloat(numStr);

          // Handle different scales (K, L, etc.)
          if (salaryStr.toLowerCase().includes('k')) return num * 1000;
          if (salaryStr.toLowerCase().includes('l') || salaryStr.toLowerCase().includes('lakh')) return num * 100000;
          if (salaryStr.toLowerCase().includes('cr') || salaryStr.toLowerCase().includes('crore')) return num * 10000000;
          return num;
        };

        const salary = parseSalary(minCTC || salaryExpectation || '0');
        return salary >= currentFilters.salaryRange[0] && salary <= currentFilters.salaryRange[1];
      });
    }

    // Education filter
    if (currentFilters.education.length > 0) {
      filtered = filtered.filter(resume => {
        const education = resume.extractedData?.education || [];
        return currentFilters.education.some(eduLevel => {
          return education.some(edu => {
            const degree = edu.degree?.toLowerCase() || '';
            switch (eduLevel) {
              case 'highschool':
                return degree.includes('high school') || degree.includes('12th') || degree.includes('intermediate');
              case 'associate':
                return degree.includes('associate') || degree.includes('diploma');
              case 'bachelor':
                return degree.includes('bachelor') || degree.includes('b.') || degree.includes('btech') || degree.includes('be ');
              case 'master':
                return degree.includes('master') || degree.includes('m.') || degree.includes('mtech') || degree.includes('mba');
              case 'phd':
                return degree.includes('phd') || degree.includes('doctorate') || degree.includes('ph.d');
              default:
                return false;
            }
          });
        });
      });
    }

    // Availability filter
    if (currentFilters.availability) {
      filtered = filtered.filter(resume => {
        const availability = resume.jobPreferences?.availability || resume.extractedData?.metadata?.availability;
        if (!availability) return true; // Include if no availability info

        switch (currentFilters.availability) {
          case 'immediate':
            return availability === 'immediate';
          case '15days':
            return availability === 'immediate' || availability === '7days' || availability === '15days';
          case '1month':
            return ['immediate', '7days', '15days', '1month'].includes(availability);
          default:
            return true;
        }
      });
    }

    // Custom filters
    if (customFilters.length > 0) {
      filtered = filtered.filter(resume => {
        return customFilters.every(filter => {
          const filterValue = filter.value.toLowerCase();
          
          // Check in various fields
          return (
            resume.userId.fullName.toLowerCase().includes(filterValue) ||
            resume.skills.some(skill => skill.toLowerCase().includes(filterValue)) ||
            (resume.location && resume.location.toLowerCase().includes(filterValue)) ||
            (resume.extractedData?.metadata?.currentRole && resume.extractedData.metadata.currentRole.toLowerCase().includes(filterValue)) ||
            (resume.extractedData?.metadata?.currentCompany && resume.extractedData.metadata.currentCompany.toLowerCase().includes(filterValue)) ||
            (resume.extractedData?.education && resume.extractedData.education.some(edu => 
              (edu.degree && edu.degree.toLowerCase().includes(filterValue)) ||
              (edu.institution && edu.institution.toLowerCase().includes(filterValue))
            ))
          );
        });
      });
    }

    return filtered;
  }, [resumes, debouncedSearchTerm, currentFilters, customFilters, user?.userType]);

  // Helper functions for filter management
  const toggleSkill = (skill: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleExperience = (experience: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      experience: prev.experience.includes(experience)
        ? prev.experience.filter(e => e !== experience)
        : [...prev.experience, experience]
    }));
  };

  const toggleLocation = (location: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  const toggleWorkType = (workType: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      workType: prev.workType.includes(workType)
        ? prev.workType.filter(w => w !== workType)
        : [...prev.workType, workType]
    }));
  };

  const toggleJobType = (jobType: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      jobType: prev.jobType.includes(jobType)
        ? prev.jobType.filter(j => j !== jobType)
        : [...prev.jobType, jobType]
    }));
  };

  const toggleEducation = (education: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      education: prev.education.includes(education)
        ? prev.education.filter(e => e !== education)
        : [...prev.education, education]
    }));
  };

  const setAvailability = (availability: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      availability: prev.availability === availability ? '' : availability
    }));
  };

  const setSalaryRange = (range: [number, number]) => {
    setCurrentFilters(prev => ({
      ...prev,
      salaryRange: range
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSkillsSearch('');
    setLocationsSearch('');
    setCustomFilters([]);
    setCurrentFilters({
      skills: [],
      locations: [],
      experience: [],
      workType: [],
      jobType: [],
      salaryRange: [0, 200000],
      education: [],
      availability: '',
    });
  };

  const addCustomFilter = () => {
    if (customFilterType && customFilterValue.trim()) {
      setCustomFilters(prev => [...prev, { type: customFilterType, value: customFilterValue.trim() }]);
      setCustomFilterType('');
      setCustomFilterValue('');
      setShowCustomFilter(false);
    }
  };

  const removeCustomFilter = (index: number) => {
    setCustomFilters(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show loading or redirect message if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-mono-0">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <LogIn className="h-12 w-12 text-mono-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-mono-900 mb-2">Authentication Required</h2>
            <p className="text-mono-600 mb-6">Please log in to browse engineer profiles.</p>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-mono-900 text-mono-0 font-medium hover:bg-mono-800 transition-colors duration-200"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mono-0">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl md:text-4xl font-light text-mono-1000 mb-4">Engineering Talent</h1>
          <p className="text-lg text-mono-600 max-w-2xl mx-auto">
            Discover exceptional engineers. Simple search, clear results.
          </p>
        </motion.div>

        {/* Enhanced Search Bar at the Top */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-mono-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input w-full pl-12 pr-4 py-4 rounded-lg border-mono-300 focus:border-mono-900 focus:ring-mono-900/20 text-lg"
                  placeholder="Search engineers by name, skills, location..."
                />
              </div>

              {/* Mobile Filter Button */}
              <div className="flex gap-2 sm:hidden">
                <motion.button
                  onClick={() => setShowCustomFilter(!showCustomFilter)}
                  className={`flex items-center space-x-2 px-4 py-4 rounded-lg border transition-colors duration-200 ${
                    showCustomFilter
                      ? 'bg-mono-900 text-mono-0 border-mono-900'
                      : 'bg-mono-0 text-mono-700 border-mono-300 hover:bg-mono-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Custom</span>
                </motion.button>

                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-4 rounded-lg border transition-colors duration-200 ${
                    showFilters
                      ? 'bg-mono-900 text-mono-0 border-mono-900'
                      : 'bg-mono-0 text-mono-700 border-mono-300 hover:bg-mono-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Filter className="h-5 w-5" />
                  <span className="font-medium">Filters</span>
                </motion.button>
              </div>

              {/* Desktop Filter Buttons */}
              <div className="hidden sm:flex gap-2">
                <motion.button
                  onClick={() => setShowCustomFilter(!showCustomFilter)}
                  className={`flex items-center space-x-2 px-6 py-4 rounded-lg border transition-colors duration-200 ${
                    showCustomFilter
                      ? 'bg-mono-900 text-mono-0 border-mono-900'
                      : 'bg-mono-0 text-mono-700 border-mono-300 hover:bg-mono-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Custom Filter</span>
                </motion.button>

                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`lg:hidden flex items-center space-x-2 px-6 py-4 rounded-lg border transition-colors duration-200 ${
                    showFilters
                      ? 'bg-mono-900 text-mono-0 border-mono-900'
                      : 'bg-mono-0 text-mono-700 border-mono-300 hover:bg-mono-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Filter className="h-5 w-5" />
                  <span className="font-medium">All Filters</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Overlay */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
              />
            )}
          </AnimatePresence>

          {/* Left Sidebar - Filters */}
          <div className={`
            w-full lg:w-80 flex-shrink-0 transition-all duration-300
            ${showFilters
              ? 'lg:block fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto bg-mono-0 lg:bg-transparent overflow-y-auto lg:overflow-visible'
              : 'hidden lg:block'
            }
          `}>
            <div className="lg:sticky lg:top-6 p-4 lg:p-0 h-full lg:h-auto">
              {/* Mobile Filter Header */}
              <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-mono-200">
                <h3 className="text-xl font-semibold text-mono-900">Filters</h3>
                <motion.button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-mono-600 hover:text-mono-900 hover:bg-mono-100 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>

              {/* Desktop Filter Header */}
              <div className="hidden lg:flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-mono-900">Filters</h3>
                <motion.button
                  onClick={clearFilters}
                  className="text-sm text-mono-600 hover:text-mono-900 underline"
                  whileHover={{ scale: 1.05 }}
                >
                  Reset all
                </motion.button>
              </div>

              {/* Custom Filter Section */}
              <AnimatePresence>
                {showCustomFilter && (
                  <motion.div
                    className="bg-mono-50 border-2 border-mono-900 rounded-lg p-4 mb-6 shadow-sm"
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Sliders className="h-5 w-5 text-mono-900" />
                        <h4 className="font-semibold text-mono-900">Custom Filter</h4>
                      </div>
                      <motion.button
                        onClick={() => setShowCustomFilter(false)}
                        className="p-1 text-mono-600 hover:text-mono-900 hover:bg-mono-200 rounded-full lg:hidden"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-mono-800 mb-2">Filter Type</label>
                        <select
                          value={customFilterType}
                          onChange={(e) => setCustomFilterType(e.target.value)}
                          className="form-select w-full border-mono-300 focus:border-mono-900 focus:ring-mono-900/20 bg-white"
                        >
                          <option value="">Select filter type</option>
                          <option value="keyword">🔍 Keyword Search</option>
                          <option value="company">🏢 Previous Company</option>
                          <option value="education">🎓 Education Institution</option>
                          <option value="role">💼 Previous Role</option>
                          <option value="certification">📜 Certification</option>
                          <option value="project">🚀 Project Technology</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mono-800 mb-2">Filter Value</label>
                        <input
                          type="text"
                          value={customFilterValue}
                          onChange={(e) => setCustomFilterValue(e.target.value)}
                          className="form-input w-full border-mono-300 focus:border-mono-900 focus:ring-mono-900/20 bg-white"
                          placeholder="Enter your search criteria..."
                          onKeyDown={(e) => e.key === 'Enter' && addCustomFilter()}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <motion.button
                          onClick={addCustomFilter}
                          disabled={!customFilterType || !customFilterValue.trim()}
                          className="flex-1 bg-mono-900 text-mono-0 py-2.5 px-4 rounded-lg font-medium hover:bg-mono-800 disabled:bg-mono-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Custom Filter</span>
                        </motion.button>
                        <motion.button
                          onClick={() => setShowCustomFilter(false)}
                          className="hidden lg:block px-4 py-2.5 text-mono-700 hover:text-mono-900 hover:bg-mono-100 rounded-lg font-medium transition-colors duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filters Container */}
              <div className="bg-white border border-mono-200 rounded-lg p-4 lg:p-6 shadow-sm max-h-[calc(100vh-200px)] lg:max-h-none overflow-y-auto lg:overflow-visible">
                {/* Skills Filter */}
                <div className="mb-6">
                  <label className="form-label text-mono-800 mb-3">Skills</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search skills..."
                      value={skillsSearch}
                      onChange={(e) => setSkillsSearch(e.target.value)}
                      className="form-input w-full px-3 py-2 border-mono-300 focus:border-mono-900 focus:ring-mono-900/20 text-sm"
                    />
                    <div className="mt-2 max-h-32 overflow-y-auto border border-mono-200 bg-mono-0">
                      {allSkills
                        .filter(skill => skill.toLowerCase().includes(skillsSearch.toLowerCase()))
                        .slice(0, 10)
                        .map(skill => (
                          <label
                            key={skill}
                            className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-mono-100 transition-colors duration-200"
                          >
                            <input
                              type="checkbox"
                              checked={currentFilters.skills.includes(skill)}
                              onChange={() => toggleSkill(skill)}
                              className="border-mono-300 text-mono-900 focus:ring-mono-900/20"
                            />
                            <span className="text-sm text-mono-700">{skill}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Locations Filter */}
                <div className="mb-6">
                  <label className="form-label text-mono-800 mb-3">Locations</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationsSearch}
                      onChange={(e) => setLocationsSearch(e.target.value)}
                      className="form-input w-full px-3 py-2 border-mono-300 focus:border-mono-900 focus:ring-mono-900/20 text-sm"
                    />
                    <div className="mt-2 max-h-32 overflow-y-auto border border-mono-200 bg-mono-0">
                      {allLocations
                        .filter(location => location.toLowerCase().includes(locationsSearch.toLowerCase()))
                        .slice(0, 10)
                        .map(location => (
                          <label
                            key={location}
                            className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-mono-100 transition-colors duration-200"
                          >
                            <input
                              type="checkbox"
                              checked={currentFilters.locations.includes(location)}
                              onChange={() => toggleLocation(location)}
                              className="border-mono-300 text-mono-900 focus:ring-mono-900/20"
                            />
                            <span className="text-sm text-mono-700">{location}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Experience Level */}
                <div className="mb-6">
                  <label className="form-label text-mono-800 mb-3">Experience Level</label>
                  <div className="space-y-2">
                    {[
                      { value: 'entry', label: 'Entry Level (0-2 years)' },
                      { value: 'mid', label: 'Mid Level (2-5 years)' },
                      { value: 'senior', label: 'Senior (5-10 years)' },
                      { value: 'executive', label: 'Executive (10+ years)' }
                    ].map(exp => (
                      <label key={exp.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentFilters.experience.includes(exp.value)}
                          onChange={() => toggleExperience(exp.value)}
                          className="border-mono-300 text-mono-900 focus:ring-mono-900/20"
                        />
                        <span className="text-sm text-mono-700">{exp.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work Type */}
                <div className="mb-6">
                  <label className="form-label text-mono-800 mb-3">Work Type</label>
                  <div className="space-y-2">
                    {[
                      { value: 'remote', label: 'Remote' },
                      { value: 'hybrid', label: 'Hybrid' },
                      { value: 'office', label: 'In Office' }
                    ].map(type => (
                      <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentFilters.workType.includes(type.value)}
                          onChange={() => toggleWorkType(type.value)}
                          className="border-mono-300 text-mono-900 focus:ring-mono-900/20"
                        />
                        <span className="text-sm text-mono-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Job Type */}
                <div className="mb-6">
                  <label className="form-label text-mono-800 mb-3">Job Type</label>
                  <div className="space-y-2">
                    {[
                      { value: 'fulltime', label: 'Full Time' },
                      { value: 'parttime', label: 'Part Time' },
                      { value: 'contract', label: 'Contract' },
                      { value: 'internship', label: 'Internship' }
                    ].map(type => (
                      <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentFilters.jobType.includes(type.value)}
                          onChange={() => toggleJobType(type.value)}
                          className="border-mono-300 text-mono-900 focus:ring-mono-900/20"
                        />
                        <span className="text-sm text-mono-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Salary Range */}
                <div className="mb-6">
                  <label className="form-label text-mono-800 mb-3">Salary Range</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-mono-600">
                      <span>$0</span>
                      <span>$50k</span>
                      <span>$100k</span>
                      <span>$150k</span>
                      <span>$200k+</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-mono-700 w-12">Min:</span>
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="5000"
                          value={currentFilters.salaryRange[0]}
                          onChange={(e) => setSalaryRange([parseInt(e.target.value), currentFilters.salaryRange[1]])}
                          className="flex-1"
                        />
                        <span className="text-sm text-mono-600 w-16">${(currentFilters.salaryRange[0] / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-mono-700 w-12">Up to:</span>
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="5000"
                          value={currentFilters.salaryRange[1]}
                          onChange={(e) => setSalaryRange([currentFilters.salaryRange[0], parseInt(e.target.value)])}
                          className="flex-1"
                        />
                        <span className="text-sm text-mono-600 w-16">${(currentFilters.salaryRange[1] / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="mb-6">
                  <label className="form-label text-mono-800 mb-3">Education</label>
                  <div className="space-y-2">
                    {[
                      { value: 'highschool', label: 'High School' },
                      { value: 'associate', label: 'Associate Degree' },
                      { value: 'bachelor', label: 'Bachelor\'s Degree' },
                      { value: 'master', label: 'Master\'s Degree' },
                      { value: 'phd', label: 'PhD' }
                    ].map(edu => (
                      <label key={edu.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentFilters.education.includes(edu.value)}
                          onChange={() => toggleEducation(edu.value)}
                          className="border-mono-300 text-mono-900 focus:ring-mono-900/20"
                        />
                        <span className="text-sm text-mono-700">{edu.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="mb-6">
                  <label className="form-label text-mono-800 mb-3">Availability</label>
                  <div className="space-y-2">
                    {[
                      { value: 'immediate', label: 'Immediate' },
                      { value: '15days', label: 'Within 15 days' },
                      { value: '1month', label: 'Within 1 month' }
                    ].map(avail => (
                      <label key={avail.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="availability"
                          checked={currentFilters.availability === avail.value}
                          onChange={() => setAvailability(avail.value)}
                          className="border-mono-300 text-mono-900 focus:ring-mono-900/20"
                        />
                        <span className="text-sm text-mono-700">{avail.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Active Filters Display */}
                {(currentFilters.skills.length > 0 ||
                  currentFilters.experience.length > 0 ||
                  currentFilters.locations.length > 0 ||
                  currentFilters.workType.length > 0 ||
                  currentFilters.jobType.length > 0 ||
                  currentFilters.education.length > 0 ||
                  currentFilters.availability ||
                  currentFilters.salaryRange[0] > 0 ||
                  currentFilters.salaryRange[1] < 200000 ||
                  debouncedSearchTerm ||
                  customFilters.length > 0) && (
                  <div className="pt-4 border-t border-mono-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-mono-700">Active filters:</span>

                      {/* Search Term */}
                      {debouncedSearchTerm && (
                        <span className="inline-flex items-center px-3 py-1 bg-mono-900 text-mono-0 text-sm">
                          🔍 "{debouncedSearchTerm}"
                          <button onClick={() => setSearchTerm('')} className="ml-2 text-mono-300 hover:text-mono-0">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}

                      {/* Custom Filters */}
                      {customFilters.map((filter, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 bg-mono-900 text-mono-0 border border-mono-700 text-sm font-medium">
                          ⚡ {filter.type}: {filter.value}
                          <button onClick={() => removeCustomFilter(index)} className="ml-2 text-mono-300 hover:text-mono-0">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {/* Skills */}
                      {currentFilters.skills.map(skill => (
                        <span key={skill} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 text-sm">
                          {skill}
                          <button onClick={() => toggleSkill(skill)} className="ml-2 text-blue-600 hover:text-blue-800">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {/* Locations */}
                      {currentFilters.locations.map(location => (
                        <span key={location} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 border border-green-300 text-sm">
                          📍 {location}
                          <button onClick={() => toggleLocation(location)} className="ml-2 text-green-600 hover:text-green-800">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {/* Experience */}
                      {currentFilters.experience.map(exp => (
                        <span key={exp} className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 border border-purple-300 text-sm">
                          {exp === 'entry' ? 'Entry Level' : exp === 'mid' ? 'Mid Level' : exp === 'senior' ? 'Senior' : 'Executive'}
                          <button onClick={() => toggleExperience(exp)} className="ml-2 text-purple-600 hover:text-purple-800">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {/* Work Type */}
                      {currentFilters.workType.map(type => (
                        <span key={type} className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 border border-orange-300 text-sm">
                          {type === 'remote' ? 'Remote' : type === 'hybrid' ? 'Hybrid' : 'In Office'}
                          <button onClick={() => toggleWorkType(type)} className="ml-2 text-orange-600 hover:text-orange-800">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {/* Job Type */}
                      {currentFilters.jobType.map(type => (
                        <span key={type} className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 border border-indigo-300 text-sm">
                          {type === 'fulltime' ? 'Full Time' : type === 'parttime' ? 'Part Time' : type === 'contract' ? 'Contract' : 'Internship'}
                          <button onClick={() => toggleJobType(type)} className="ml-2 text-indigo-600 hover:text-indigo-800">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {/* Education */}
                      {currentFilters.education.map(edu => (
                        <span key={edu} className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-800 border border-pink-300 text-sm">
                          {edu === 'highschool' ? 'High School' : edu === 'associate' ? 'Associate' : edu === 'bachelor' ? 'Bachelor\'s' : edu === 'master' ? 'Master\'s' : 'PhD'}
                          <button onClick={() => toggleEducation(edu)} className="ml-2 text-pink-600 hover:text-pink-800">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {/* Availability */}
                      {currentFilters.availability && (
                        <span className="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-800 border border-teal-300 text-sm">
                          {currentFilters.availability === 'immediate' ? 'Immediate' : currentFilters.availability === '15days' ? 'Within 15 days' : 'Within 1 month'}
                          <button onClick={() => setAvailability('')} className="ml-2 text-teal-600 hover:text-teal-800">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}

                      {/* Salary Range */}
                      {(currentFilters.salaryRange[0] > 0 || currentFilters.salaryRange[1] < 200000) && (
                        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm">
                          ${(currentFilters.salaryRange[0] / 1000).toFixed(0)}k - ${(currentFilters.salaryRange[1] / 1000).toFixed(0)}k
                          <button onClick={() => setSalaryRange([0, 200000])} className="ml-2 text-yellow-600 hover:text-yellow-800">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile Apply Filters Button */}
                <div className="lg:hidden mt-6 pt-4 border-t border-mono-200 sticky bottom-0 bg-white">
                  <div className="flex gap-3">
                    <motion.button
                      onClick={clearFilters}
                      className="flex-1 py-3 px-4 bg-mono-100 text-mono-700 rounded-lg font-medium hover:bg-mono-200 transition-colors duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Clear All
                    </motion.button>
                    <motion.button
                      onClick={() => setShowFilters(false)}
                      className="flex-2 py-3 px-6 bg-mono-900 text-mono-0 rounded-lg font-medium hover:bg-mono-800 transition-colors duration-200 flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Apply Filters</span>
                      <span className="bg-mono-700 text-mono-0 px-2 py-1 rounded text-sm">
                        {filteredResumes.length}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-mono-900">
                  {loading ? 'Loading engineers...' : `${filteredResumes.length} engineers found`}
                </h2>
                {(currentFilters.skills.length > 0 ||
                  currentFilters.experience.length > 0 ||
                  currentFilters.locations.length > 0 ||
                  currentFilters.workType.length > 0 ||
                  currentFilters.jobType.length > 0 ||
                  currentFilters.education.length > 0 ||
                  currentFilters.availability ||
                  currentFilters.salaryRange[0] > 0 ||
                  currentFilters.salaryRange[1] < 200000 ||
                  debouncedSearchTerm ||
                  customFilters.length > 0) && (
                  <p className="text-sm text-mono-600 mt-1">
                    {(currentFilters.skills.length +
                      currentFilters.experience.length +
                      currentFilters.locations.length +
                      currentFilters.workType.length +
                      currentFilters.jobType.length +
                      currentFilters.education.length +
                      (currentFilters.availability ? 1 : 0) +
                      ((currentFilters.salaryRange[0] > 0 || currentFilters.salaryRange[1] < 200000) ? 1 : 0) +
                      (debouncedSearchTerm ? 1 : 0) +
                      customFilters.length)} active filters
                  </p>
                )}
              </div>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-mono-300 border-t-mono-900 rounded-full animate-spin"></div>
              </div>
            ) : filteredResumes.length === 0 ? (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Search className="h-12 w-12 text-mono-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-mono-900 mb-2">No engineers found</h3>
                <p className="text-mono-600 mb-6">
                  {debouncedSearchTerm ||
                   currentFilters.skills.length > 0 ||
                   currentFilters.experience.length > 0 ||
                   currentFilters.locations.length > 0 ||
                   currentFilters.workType.length > 0 ||
                   currentFilters.jobType.length > 0 ||
                   currentFilters.education.length > 0 ||
                   currentFilters.availability ||
                   currentFilters.salaryRange[0] > 0 ||
                   currentFilters.salaryRange[1] < 200000 ||
                   customFilters.length > 0
                    ? 'Try adjusting your filters to see more results'
                    : 'No engineer profiles available yet'
                  }
                </p>
                {(debouncedSearchTerm ||
                  currentFilters.skills.length > 0 ||
                  currentFilters.experience.length > 0 ||
                  currentFilters.locations.length > 0 ||
                  currentFilters.workType.length > 0 ||
                  currentFilters.jobType.length > 0 ||
                  currentFilters.education.length > 0 ||
                  currentFilters.availability ||
                  currentFilters.salaryRange[0] > 0 ||
                  currentFilters.salaryRange[1] < 200000 ||
                  customFilters.length > 0) && (
                  <motion.button
                    onClick={clearFilters}
                    className="btn-secondary px-6 py-2 rounded-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    Clear Filters
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredResumes.map((resume, index) => (
                  <motion.div
                    key={resume._id}
                    className="card-hover p-6 group flex flex-col h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 bg-mono-900 flex items-center justify-center">
                        <span className="text-mono-0 font-medium text-lg">
                          {resume.userId?.fullName?.charAt(0) || 'E'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-mono-900 line-clamp-1">
                          {resume.userId?.fullName || 'Engineer'}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-mono-600 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(resume.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details - Enhanced with job preferences */}
                    <div className="space-y-3 mb-6 min-h-[120px]">
                      {/* Experience */}
                      {(resume.experienceYears || resume.extractedData?.metadata?.totalExperienceYears) && (
                        <div className="flex items-center text-mono-600 text-sm">
                          <Star className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{resume.experienceYears || resume.extractedData?.metadata?.totalExperienceYears} years experience</span>
                        </div>
                      )}

                      {/* Location */}
                      {(resume.location || resume.extractedData?.metadata?.location) && (
                        <div className="flex items-center text-mono-600 text-sm">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="line-clamp-1">{resume.location || resume.extractedData?.metadata?.location}</span>
                        </div>
                      )}

                      {/* Current Role */}
                      {resume.extractedData?.metadata?.currentRole && (
                        <div className="flex items-center text-mono-600 text-sm">
                          <span className="text-mono-500 mr-2">💼</span>
                          <span className="line-clamp-1">{resume.extractedData.metadata.currentRole}</span>
                        </div>
                      )}

                      {/* Job Preferences */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {resume.jobPreferences?.jobType && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs border border-blue-200">
                            {resume.jobPreferences.jobType === 'fulltime' ? 'Full Time' :
                             resume.jobPreferences.jobType === 'parttime' ? 'Part Time' :
                             resume.jobPreferences.jobType === 'internship' ? 'Internship' : resume.jobPreferences.jobType}
                          </span>
                        )}
                        {resume.jobPreferences?.workMode?.slice(0, 2).map(mode => (
                          <span key={mode} className="px-2 py-1 bg-green-100 text-green-800 text-xs border border-green-200">
                            {mode === 'remote' ? 'Remote' : mode === 'hybrid' ? 'Hybrid' : 'Office'}
                          </span>
                        ))}
                        {resume.jobPreferences?.availability && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs border border-orange-200">
                            {resume.jobPreferences.availability === 'immediate' ? 'Available Now' :
                             resume.jobPreferences.availability === '15days' ? 'Available Soon' : 'Available'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skills - Fixed Height Section */}
                    <div className="mb-6 flex-grow">
                      {resume.skills && resume.skills.length > 0 ? (
                        <>
                          <h4 className="text-sm font-medium text-mono-800 mb-3">Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {resume.skills.slice(0, 6).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-mono-100 text-mono-800 text-sm font-medium border border-mono-200 hover:bg-mono-200 transition-colors duration-200 line-clamp-1"
                              >
                                {skill}
                              </span>
                            ))}
                            {resume.skills.length > 6 && (
                              <span className="px-3 py-1.5 bg-mono-200 text-mono-600 text-sm font-medium border border-mono-300 hover:bg-mono-300 transition-colors duration-200">
                                +{resume.skills.length - 6} more
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-mono-500 italic">No skills listed</div>
                      )}
                    </div>

                    {/* Actions - Always at Bottom */}
                    <div className="mt-auto">
                      <Link to={`/employer/resume/${resume._id}`}>
                        <motion.button
                          className="w-full btn-primary py-3 font-medium flex items-center justify-center space-x-2 group-hover:bg-mono-800 transition-colors duration-200"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Profile</span>
                        </motion.button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}