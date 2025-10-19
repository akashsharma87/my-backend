const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
    max: [10485760, 'File size cannot exceed 10MB'] // 10MB in bytes
  },
  originalFileName: {
    type: String,
    required: true,
    trim: true
  },
  mimeType: {
    type: String,
    required: true,
    enum: {
      values: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      message: 'Only PDF and Word documents are allowed'
    }
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  experienceYears: {
    type: Number,
    min: [0, 'Experience years cannot be negative'],
    max: [50, 'Experience years cannot exceed 50']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: false
  },
  activatedAt: {
    type: Date,
    default: null
  },
  activationExpiresAt: {
    type: Date,
    default: null
  },
  canReactivate: {
    type: Boolean,
    default: true
  },

  // Admin-related fields
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  },
  adminNotes: {
    type: String
  },

  // Job preferences
  jobPreferences: {
    jobType: {
      type: String,
      enum: ['internship', 'fulltime', 'parttime']
    },
    workWeek: {
      type: String,
      enum: ['5days', '6days', 'flexible']
    },
    minCTC: String,
    currency: {
      type: String,
      default: 'USD'
    },
    unpaidOk: {
      type: Boolean,
      default: false
    },
    availability: {
      type: String,
      enum: ['immediate', '7days', '15days', '1month', '2months', '3months']
    },
    workMode: [{
      type: String,
      enum: ['remote', 'hybrid', 'office']
    }],
    locations: [String],
    companyTypes: [{
      type: String,
      enum: ['early-startup', 'funded-startup', 'mnc', 'mid-size']
    }],
    consentToShare: {
      type: Boolean,
      default: false
    },
    showPublicly: {
      type: Boolean,
      default: false
    }
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  downloads: {
    type: Number,
    default: 0,
    min: 0
  },
  lastViewed: {
    type: Date
  },
  searchableText: {
    type: String,
    index: 'text' // For text search functionality
  },
  extractedData: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    summary: String,
    links: {
      linkedin: String,
      github: String,
      portfolio: String
    },
    experience: [{
      company: String,
      position: String,
      duration: String,
      description: String,
      location: String,
      technologies: [String]
    }],
    education: [{
      institution: String,
      degree: String,
      year: String,
      gpa: String,
      location: String,
      honors: String
    }],
    skills: {
      technical: [String],
      programming: [String],
      frameworks: [String],
      databases: [String],
      tools: [String],
      cloud: [String],
      other: [String],
      all: [String] // Flattened array for backward compatibility
    },
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      duration: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: String,
      expiryDate: String,
      credentialId: String
    }],
    languages: [{
      language: String,
      proficiency: String
    }],
    achievements: [{
      title: String,
      description: String,
      date: String,
      organization: String
    }],
    volunteering: [{
      organization: String,
      role: String,
      duration: String,
      description: String
    }],
    publications: [{
      title: String,
      publisher: String,
      date: String,
      url: String
    }],
    metadata: {
      totalExperienceYears: Number,
      currentRole: String,
      currentCompany: String,
      location: String,
      availability: String,
      salaryExpectation: String
    },
    extractedAt: {
      type: Date,
      default: Date.now
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    rawText: String,
    rawOpenAIResponse: Object // Store full OpenAI response
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ skills: 1 });
resumeSchema.index({ experienceYears: 1 });
resumeSchema.index({ location: 1 });
resumeSchema.index({ createdAt: -1 });
resumeSchema.index({ views: -1 });
resumeSchema.index({ isActive: 1 });

// Compound indexes for complex queries
resumeSchema.index({ isActive: 1, createdAt: -1 });
resumeSchema.index({ skills: 1, experienceYears: 1 });
resumeSchema.index({ location: 1, experienceYears: 1 });

// Text index for search functionality
resumeSchema.index({ 
  fileName: 'text', 
  skills: 'text', 
  location: 'text',
  searchableText: 'text'
});

// Virtual to populate user information
resumeSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update searchable text
resumeSchema.pre('save', function(next) {
  // Create searchable text from various fields
  const searchFields = [
    this.fileName,
    this.location,
    ...(this.skills || [])
  ].filter(Boolean);
  
  this.searchableText = searchFields.join(' ').toLowerCase();
  next();
});

// Instance method to increment views
resumeSchema.methods.incrementViews = function() {
  this.views += 1;
  this.lastViewed = new Date();
  return this.save({ validateBeforeSave: false });
};

// Instance method to increment downloads
resumeSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to activate resume
resumeSchema.methods.activateResume = function() {
  this.isActive = true;
  this.activatedAt = new Date();
  this.activationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  this.canReactivate = true;
  return this.save();
};

// Instance method to deactivate resume
resumeSchema.methods.deactivateResume = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to check if resume can be reactivated
resumeSchema.methods.canReactivateResume = function() {
  return this.canReactivate && !this.isActive;
};

// Instance method to check if resume is expired
resumeSchema.methods.isExpired = function() {
  return this.isActive && this.activationExpiresAt && new Date() > this.activationExpiresAt;
};

// Static method to find resumes by skills
resumeSchema.statics.findBySkills = function(skills) {
  return this.find({
    skills: { $in: skills },
    isActive: true
  }).populate('userId', 'fullName email');
};

// Static method to find resumes by experience range
resumeSchema.statics.findByExperienceRange = function(minExp, maxExp) {
  return this.find({
    experienceYears: { $gte: minExp, $lte: maxExp },
    isActive: true
  }).populate('userId', 'fullName email');
};

// Static method to find resumes by location
resumeSchema.statics.findByLocation = function(location) {
  return this.find({
    location: new RegExp(location, 'i'),
    isActive: true
  }).populate('userId', 'fullName email');
};

// Static method for advanced search
resumeSchema.statics.advancedSearch = function(filters) {
  const query = { isActive: true };
  
  if (filters.skills && filters.skills.length > 0) {
    query.skills = { $in: filters.skills };
  }
  
  if (filters.minExperience !== undefined) {
    query.experienceYears = query.experienceYears || {};
    query.experienceYears.$gte = filters.minExperience;
  }
  
  if (filters.maxExperience !== undefined) {
    query.experienceYears = query.experienceYears || {};
    query.experienceYears.$lte = filters.maxExperience;
  }
  
  if (filters.location) {
    query.location = new RegExp(filters.location, 'i');
  }
  
  if (filters.searchTerm) {
    query.$text = { $search: filters.searchTerm };
  }
  
  return this.find(query)
    .populate('userId', 'fullName email')
    .sort(filters.sortBy || { createdAt: -1 });
};

module.exports = mongoose.model('Resume', resumeSchema);