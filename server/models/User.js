const mongoose = require('mongoose');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.githubId;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  googleId: {
    type: String,
    sparse: true
  },
  githubId: {
    type: String,
    sparse: true
  },
  profilePicture: {
    type: String
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: {
      values: ['engineer', 'employer'],
      message: 'User type must be either engineer or employer'
    }
  },
  isActive: {
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
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspendedAt: {
    type: Date
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  suspensionReason: {
    type: String
  },
  adminNotes: {
    type: String
  },
  lastLogin: {
    type: Date
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  // Additional profile fields
  bio: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 500;
      },
      message: 'Bio cannot exceed 500 characters'
    }
  },
  location: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 100;
      },
      message: 'Location cannot exceed 100 characters'
    }
  },
  website: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 255;
      },
      message: 'Website URL cannot exceed 255 characters'
    }
  },
  phone: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 20;
      },
      message: 'Phone number cannot exceed 20 characters'
    }
  },
  company: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 100;
      },
      message: 'Company name cannot exceed 100 characters'
    }
  },
  jobTitle: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 100;
      },
      message: 'Job title cannot exceed 100 characters'
    }
  },
  skills: [{
    type: String,
    validate: {
      validator: function(v) {
        return !v || v.length <= 50;
      },
      message: 'Skill name cannot exceed 50 characters'
    }
  }],
  experience: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 1000;
      },
      message: 'Experience cannot exceed 1000 characters'
    }
  },
  // Enhanced profile fields from resume parsing
  linkedin: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 255;
      },
      message: 'LinkedIn URL cannot exceed 255 characters'
    }
  },
  github: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 255;
      },
      message: 'GitHub URL cannot exceed 255 characters'
    }
  },
  portfolio: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 255;
      },
      message: 'Portfolio URL cannot exceed 255 characters'
    }
  },
  totalExperience: {
    type: Number,
    validate: {
      validator: function(v) {
        return v === undefined || v === null || (v >= 0 && v <= 50);
      },
      message: 'Total experience must be between 0 and 50 years'
    }
  },
  currentRole: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 100;
      },
      message: 'Current role cannot exceed 100 characters'
    }
  },
  availability: {
    type: String,
    enum: ['available', 'not-available', 'open-to-opportunities', 'actively-looking'],
    default: 'available'
  },
  salaryExpectation: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || v.length <= 100;
      },
      message: 'Salary expectation cannot exceed 100 characters'
    }
  },
  profileEnhancedFromResume: {
    type: Boolean,
    default: false
  },
  lastProfileUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better performance - removed duplicate email index
userSchema.index({ userType: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's resumes (for engineers)
userSchema.virtual('resumes', {
  ref: 'Resume',
  localField: '_id',
  foreignField: 'userId'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password using secure utility
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await comparePassword(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Update lastLogin
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);