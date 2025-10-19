import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Check, MapPin, Search } from 'lucide-react';

interface JobPreferences {
  jobType: string;
  workWeek: string;
  minCTC: string;
  currency: string;
  unpaidOk: boolean;
  availability: string;
  workMode: string[];
  locations: string[];
  companyTypes: string[];
  consentToShare: boolean;
  showPublicly: boolean;
}

interface JobPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (preferences: JobPreferences) => void;
  loading?: boolean;
}

const JobPreferencesModal: React.FC<JobPreferencesModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<JobPreferences>({
    jobType: '',
    workWeek: '',
    minCTC: '',
    currency: 'INR',
    unpaidOk: false,
    availability: '',
    workMode: [],
    locations: [],
    companyTypes: [],
    consentToShare: false,
    showPublicly: false
  });
  const [newLocation, setNewLocation] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const jobTypes = [
    { value: 'internship', label: 'Internship' },
    { value: 'fulltime', label: 'Full Time' },
    { value: 'parttime', label: 'Part Time' }
  ];

  const workWeekOptions = [
    { value: '5days', label: '5 Days/Week' },
    { value: '6days', label: '6 Days/Week' },
    { value: 'flexible', label: 'Flexible for both' }
  ];

  const availabilityOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: '7days', label: 'Within 7 days' },
    { value: '15days', label: 'Within 15 days' },
    { value: '1month', label: 'Within 1 month' },
    { value: '2months', label: 'Within 2 months' },
    { value: '3months', label: 'Within 3 months' }
  ];

  const workModes = [
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'office', label: 'In Office' }
  ];

  const companyTypes = [
    { value: 'early-startup', label: 'Early Startup' },
    { value: 'funded-startup', label: 'Funded Startup' },
    { value: 'mnc', label: 'MNC' },
    { value: 'mid-size', label: 'Mid-Size' }
  ];

  // Top Indian job locations with major cities and tech hubs
  const topIndianLocations = [
    // Tier 1 Cities & Major Tech Hubs
    'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad',
    'Gurgaon', 'Noida', 'Kochi', 'Indore', 'Jaipur', 'Chandigarh', 'Coimbatore',

    // Emerging Tech Cities
    'Bhubaneswar', 'Thiruvananthapuram', 'Mysore', 'Nagpur', 'Vadodara', 'Surat',
    'Lucknow', 'Kanpur', 'Patna', 'Bhopal', 'Visakhapatnam', 'Mangalore',

    // NCR Region
    'Faridabad', 'Ghaziabad', 'Greater Noida', 'New Delhi',

    // Maharashtra Cities
    'Nashik', 'Aurangabad', 'Nagpur', 'Thane', 'Navi Mumbai',

    // Karnataka Cities
    'Hubli', 'Belgaum', 'Shimoga',

    // Tamil Nadu Cities
    'Madurai', 'Salem', 'Tirupur', 'Erode',

    // Other Important Cities
    'Dehradun', 'Ranchi', 'Raipur', 'Guwahati', 'Jammu', 'Amritsar', 'Ludhiana',
    'Rajkot', 'Jodhpur', 'Udaipur', 'Agra', 'Meerut', 'Varanasi', 'Allahabad'
  ];

  // Filter locations based on search
  const filteredLocations = topIndianLocations.filter(location =>
    location.toLowerCase().includes(locationSearch.toLowerCase()) &&
    !preferences.locations.includes(location)
  );

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onSubmit(preferences);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };

  const addLocation = (location?: string) => {
    const locationToAdd = location || newLocation.trim();
    if (locationToAdd && !preferences.locations.includes(locationToAdd)) {
      setPreferences(prev => ({
        ...prev,
        locations: [...prev.locations, locationToAdd]
      }));
      setNewLocation('');
      setLocationSearch('');
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationInputChange = (value: string) => {
    setNewLocation(value);
    setLocationSearch(value);
    setShowLocationSuggestions(value.length > 0);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowLocationSuggestions(false);
    };

    if (showLocationSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showLocationSuggestions]);

  const removeLocation = (location: string) => {
    setPreferences(prev => ({
      ...prev,
      locations: prev.locations.filter(loc => loc !== location)
    }));
  };

  const toggleSelection = (field: keyof JobPreferences, value: string) => {
    if (Array.isArray(preferences[field])) {
      const currentArray = preferences[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      setPreferences(prev => ({
        ...prev,
        [field]: newArray
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const isStep1Valid = preferences.jobType && preferences.workWeek && preferences.availability;
  const isStep2Valid = preferences.workMode.length > 0 && preferences.companyTypes.length > 0 && preferences.consentToShare;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setNewLocation('');
      setLocationSearch('');
      setShowLocationSuggestions(false);
    }
  }, [isOpen]);

  // Enhanced form validation
  const getValidationMessage = () => {
    if (step === 1) {
      if (!preferences.jobType) return 'Please select a job type';
      if (!preferences.workWeek) return 'Please select work week preference';
      if (!preferences.availability) return 'Please select your availability';
    } else {
      if (preferences.workMode.length === 0) return 'Please select at least one work mode';
      if (preferences.companyTypes.length === 0) return 'Please select at least one company type';
      if (!preferences.consentToShare) return 'Please consent to share your resume';
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-mono-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-mono-200"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-mono-200">
            <h2 className="text-xl font-semibold text-mono-900">
              {step === 1 ? 'Job Details' : 'Job Location & Company Preferences'}
            </h2>
            <button
              onClick={onClose}
              className="text-mono-400 hover:text-mono-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {step === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Job Type */}
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-3">
                    Job Type
                    <span className="block text-xs text-mono-500 font-normal">
                      Select the primary type of role you're targeting
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {jobTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleSelection('jobType', type.value)}
                        className={`p-3 border text-sm font-medium transition-all ${
                          preferences.jobType === type.value
                            ? 'border-mono-900 bg-mono-900 text-mono-0'
                            : 'border-mono-200 hover:border-mono-300 text-mono-700 hover:bg-mono-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Work Week Preference */}
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-3">
                    Work Week Preference
                    <span className="block text-xs text-mono-500 font-normal">
                      Tell us your preferred schedule
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {workWeekOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection('workWeek', option.value)}
                        className={`p-3 border text-sm font-medium transition-all ${
                          preferences.workWeek === option.value
                            ? 'border-mono-900 bg-mono-900 text-mono-0'
                            : 'border-mono-200 hover:border-mono-300 text-mono-700 hover:bg-mono-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minimum CTC */}
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-3">
                    Minimum Annual CTC Requirements
                    <span className="block text-xs text-mono-500 font-normal">
                      Provide a baseline salary expectation (optional)
                    </span>
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={preferences.currency}
                      onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                      className="px-3 py-2 border border-mono-300 focus:ring-2 focus:ring-mono-500 focus:border-mono-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Minimum CTC"
                      value={preferences.minCTC}
                      onChange={(e) => setPreferences(prev => ({ ...prev, minCTC: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-mono-300 focus:ring-2 focus:ring-mono-500 focus:border-mono-500"
                    />
                  </div>
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={preferences.unpaidOk}
                      onChange={(e) => setPreferences(prev => ({ ...prev, unpaidOk: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-mono-600">Unpaid OK</span>
                  </label>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-3">
                    Availability
                    <span className="block text-xs text-mono-500 font-normal">
                      How soon can you join?
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {availabilityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection('availability', option.value)}
                        className={`p-3 border text-sm font-medium transition-all ${
                          preferences.availability === option.value
                            ? 'border-mono-900 bg-mono-900 text-mono-0'
                            : 'border-mono-200 hover:border-mono-300 text-mono-700 hover:bg-mono-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-mono-500 mt-6">
                  After setting job details, you'll be able to specify location and company preferences in the next step.
                </p>

                {/* Validation Message */}
                {!isStep1Valid && (
                  <div className="mt-4 p-3 bg-mono-100 border border-mono-300 text-mono-700 text-sm">
                    💡 {getValidationMessage()}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Work Mode */}
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-3">
                    Job Location Preferences
                    <span className="block text-xs text-mono-500 font-normal">
                      Choose preferred work modes
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {workModes.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => toggleSelection('workMode', mode.value)}
                        className={`p-3 border text-sm font-medium transition-all ${
                          preferences.workMode.includes(mode.value)
                            ? 'border-mono-900 bg-mono-900 text-mono-0'
                            : 'border-mono-200 hover:border-mono-300 text-mono-700 hover:bg-mono-50'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Locations */}
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-3">
                    Preferred Locations
                    <span className="block text-xs text-mono-500 font-normal">
                      Add cities you are open to work in (optional)
                    </span>
                  </label>

                  {/* Popular Indian Cities Quick Select */}
                  <div className="mb-4">
                    <p className="text-xs text-mono-600 mb-2">Popular Cities:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Gurgaon', 'Noida'].map((city) => (
                        <button
                          key={city}
                          onClick={() => addLocation(city)}
                          disabled={preferences.locations.includes(city)}
                          className={`px-3 py-1 text-xs border transition-colors ${
                            preferences.locations.includes(city)
                              ? 'border-mono-300 bg-mono-100 text-mono-400 cursor-not-allowed'
                              : 'border-mono-200 bg-mono-50 text-mono-700 hover:bg-mono-100'
                          }`}
                        >
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Search Input */}
                  <div className="relative mb-3">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mono-400" />
                        <input
                          type="text"
                          placeholder="Search or type city name..."
                          value={newLocation}
                          onChange={(e) => handleLocationInputChange(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addLocation()}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-10 pr-4 py-2 border border-mono-300 focus:ring-2 focus:ring-mono-500 focus:border-mono-500"
                        />

                        {/* Location Suggestions Dropdown */}
                        {showLocationSuggestions && filteredLocations.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-mono-0 border border-mono-200 shadow-lg max-h-48 overflow-y-auto">
                            {filteredLocations.slice(0, 10).map((location) => (
                              <button
                                key={location}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addLocation(location);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-mono-50 text-sm flex items-center"
                              >
                                <MapPin className="h-3 w-3 mr-2 text-mono-400" />
                                {location}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => addLocation()}
                        className="px-4 py-2 bg-mono-900 text-mono-0 hover:bg-mono-800 transition-colors border border-mono-900"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Selected Locations */}
                  <div className="flex flex-wrap gap-2">
                    {preferences.locations.map((location) => (
                      <span
                        key={location}
                        className="inline-flex items-center px-3 py-1 bg-mono-100 text-mono-800 text-sm border border-mono-300"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {location}
                        <button
                          onClick={() => removeLocation(location)}
                          className="ml-2 text-mono-600 hover:text-mono-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {preferences.locations.length === 0 && (
                    <p className="text-xs text-mono-500 mt-2">
                      💡 Tip: Select multiple locations to increase your job opportunities
                    </p>
                  )}
                </div>

                {/* Company Preferences */}
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-3">
                    Company Preferences
                    <span className="block text-xs text-mono-500 font-normal">
                      What kind of companies fit you best?
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {companyTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleSelection('companyTypes', type.value)}
                        className={`p-3 border text-sm font-medium transition-all ${
                          preferences.companyTypes.includes(type.value)
                            ? 'border-mono-900 bg-mono-900 text-mono-0'
                            : 'border-mono-200 hover:border-mono-300 text-mono-700 hover:bg-mono-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consent */}
                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={preferences.consentToShare}
                      onChange={(e) => setPreferences(prev => ({ ...prev, consentToShare: e.target.checked }))}
                      className="mt-1 mr-3"
                    />
                    <span className="text-sm text-mono-700">
                      I consent to have my resume shared with relevant companies
                    </span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={preferences.showPublicly}
                      onChange={(e) => setPreferences(prev => ({ ...prev, showPublicly: e.target.checked }))}
                      className="mt-1 mr-3"
                    />
                    <span className="text-sm text-mono-700">
                      Show my profile publicly
                    </span>
                  </label>
                </div>

                <p className="text-sm text-mono-500 mt-6">
                  Final step! After setting your preferences, your profile will be complete.
                </p>

                {/* Validation Message */}
                {!isStep2Valid && (
                  <div className="mt-4 p-3 bg-mono-100 border border-mono-300 text-mono-700 text-sm">
                    💡 {getValidationMessage()}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-mono-200 bg-mono-50">
            <button
              onClick={handleBack}
              className="flex items-center px-4 py-2 text-mono-600 hover:text-mono-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={loading || (step === 1 ? !isStep1Valid : !isStep2Valid)}
              className="flex items-center px-6 py-2 bg-mono-900 text-mono-0 hover:bg-mono-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-mono-900"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-b-2 border-mono-0 mr-2" />
              ) : step === 1 ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Save Preferences
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JobPreferencesModal;
