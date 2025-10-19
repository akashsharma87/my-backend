const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', auth, [
  body('fullName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Full name must be 1-100 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('phone').optional().isLength({ max: 20 }).withMessage('Phone cannot exceed 20 characters'),
  body('company').optional().isLength({ max: 100 }).withMessage('Company cannot exceed 100 characters'),
  body('jobTitle').optional().isLength({ max: 100 }).withMessage('Job title cannot exceed 100 characters'),
  body('website').optional().isURL().withMessage('Invalid website URL'),
  body('linkedin').optional().isURL().withMessage('Invalid LinkedIn URL'),
  body('github').optional().isURL().withMessage('Invalid GitHub URL'),
  body('portfolio').optional().isURL().withMessage('Invalid portfolio URL'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('totalExperience').optional().isInt({ min: 0, max: 50 }).withMessage('Total experience must be 0-50 years'),
  body('availability').optional().isIn(['available', 'not-available', 'open-to-opportunities', 'actively-looking']).withMessage('Invalid availability status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const allowedUpdates = [
      'fullName', 'bio', 'location', 'phone', 'company', 'jobTitle', 
      'website', 'linkedin', 'github', 'portfolio', 'skills', 'experience',
      'totalExperience', 'currentRole', 'availability', 'salaryExpectation'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    updates.lastProfileUpdate = new Date();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @route   GET /api/users/enhanced-profile
// @desc    Get enhanced profile data with latest resume information
// @access  Private (Engineers only)
router.get('/enhanced-profile', auth, requireRole(['engineer']), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's latest resume with extracted data
    const latestResume = await Resume.findOne({ 
      userId: req.user._id,
      'extractedData.extractionStatus': 'completed'
    })
    .sort({ createdAt: -1 })
    .select('extractedData skills experienceYears location');

    // Merge profile with resume data
    const enhancedProfile = {
      ...user.toObject(),
      resumeData: latestResume?.extractedData || null,
      hasActiveResume: !!latestResume,
      resumeId: latestResume?._id || null
    };

    res.json({
      success: true,
      data: { 
        user: enhancedProfile,
        resumeMetadata: latestResume ? {
          skills: latestResume.skills,
          experienceYears: latestResume.experienceYears,
          location: latestResume.location
        } : null
      }
    });

  } catch (error) {
    console.error('Get enhanced profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enhanced profile data'
    });
  }
});

// @route   GET /api/users/:id/profile
// @desc    Get public profile of any user (for employers viewing engineers)
// @access  Private
router.get('/:id/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return public profile information
    const publicProfile = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      bio: user.bio,
      location: user.location,
      website: user.website,
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio,
      skills: user.skills,
      totalExperience: user.totalExperience,
      currentRole: user.currentRole,
      availability: user.availability,
      company: user.company,
      jobTitle: user.jobTitle
    };

    res.json({
      success: true,
      data: { user: publicProfile }
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

module.exports = router;