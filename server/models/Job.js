const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employer ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [2000, 'Job description cannot exceed 2000 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: {
      values: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
      message: 'Job type must be one of: full-time, part-time, contract, freelance, internship'
    }
  },
  experienceLevel: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: {
      values: ['entry', 'mid', 'senior', 'lead', 'executive'],
      message: 'Experience level must be one of: entry, mid, senior, lead, executive'
    }
  },
  requiredSkills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  preferredSkills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  salaryRange: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    }
  },
  benefits: [{
    type: String,
    trim: true,
    maxlength: [100, 'Benefit cannot exceed 100 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  deadline: {
    type: Date
  },
  applicationsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  searchableText: {
    type: String,
    index: 'text'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
jobSchema.index({ employerId: 1, createdAt: -1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ requiredSkills: 1, experienceLevel: 1 });
jobSchema.index({ location: 1, jobType: 1 });

// Text index for search functionality
jobSchema.index({ 
  title: 'text',
  description: 'text',
  company: 'text',
  location: 'text',
  requiredSkills: 'text',
  searchableText: 'text'
});

// Virtual to populate employer information
jobSchema.virtual('employer', {
  ref: 'User',
  localField: 'employerId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update searchable text
jobSchema.pre('save', function(next) {
  const searchFields = [
    this.title,
    this.description,
    this.company,
    this.location,
    ...(this.requiredSkills || []),
    ...(this.preferredSkills || []),
    ...(this.benefits || [])
  ].filter(Boolean);
  
  this.searchableText = searchFields.join(' ').toLowerCase();
  next();
});

// Instance method to increment views
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to increment applications
jobSchema.methods.incrementApplications = function() {
  this.applicationsCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Static method to find jobs by skills
jobSchema.statics.findBySkills = function(skills) {
  return this.find({
    requiredSkills: { $in: skills },
    isActive: true
  }).populate('employerId', 'fullName email company');
};

// Static method to find jobs by location
jobSchema.statics.findByLocation = function(location) {
  return this.find({
    location: new RegExp(location, 'i'),
    isActive: true
  }).populate('employerId', 'fullName email company');
};

// Static method for advanced search
jobSchema.statics.advancedSearch = function(filters) {
  const query = { isActive: true };
  
  if (filters.skills && filters.skills.length > 0) {
    query.requiredSkills = { $in: filters.skills };
  }
  
  if (filters.experienceLevel) {
    query.experienceLevel = filters.experienceLevel;
  }
  
  if (filters.jobType) {
    query.jobType = filters.jobType;
  }
  
  if (filters.location) {
    query.location = new RegExp(filters.location, 'i');
  }
  
  if (filters.searchTerm) {
    query.$text = { $search: filters.searchTerm };
  }
  
  if (filters.salaryMin) {
    query['salaryRange.min'] = { $gte: filters.salaryMin };
  }
  
  if (filters.salaryMax) {
    query['salaryRange.max'] = { $lte: filters.salaryMax };
  }
  
  return this.find(query)
    .populate('employerId', 'fullName email company')
    .sort(filters.sortBy || { createdAt: -1 });
};

module.exports = mongoose.model('Job', jobSchema);