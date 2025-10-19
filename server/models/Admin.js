const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_engineers',
      'manage_employers',
      'manage_resumes',
      'manage_jobs',
      'manage_admins',
      'view_analytics',
      'manage_settings'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
adminSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

// Get public profile (exclude password)
adminSchema.methods.getPublicProfile = function() {
  const admin = this.toObject();
  delete admin.password;
  return admin;
};

// Set default permissions based on role
adminSchema.pre('save', function(next) {
  if (this.isNew && this.permissions.length === 0) {
    if (this.role === 'super_admin') {
      this.permissions = [
        'manage_engineers',
        'manage_employers',
        'manage_resumes',
        'manage_jobs',
        'manage_admins',
        'view_analytics',
        'manage_settings'
      ];
    } else if (this.role === 'admin') {
      this.permissions = [
        'manage_engineers',
        'manage_employers',
        'manage_resumes',
        'manage_jobs',
        'view_analytics'
      ];
    } else if (this.role === 'moderator') {
      this.permissions = [
        'manage_resumes',
        'manage_jobs',
        'view_analytics'
      ];
    }
  }
  next();
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;

