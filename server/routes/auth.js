const express = require('express');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const { generateToken, auth } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/security');

const router = express.Router();

// Validation middleware
const validateSignup = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name required (2-100 characters)'),
  body('userType').isIn(['engineer', 'employer']).withMessage('User type must be engineer or employer')
];

const validateSignin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  body('userType').isIn(['engineer', 'employer']).withMessage('User type must be engineer or employer')
];

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', authLimiter, validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, fullName, userType } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      fullName,
      userType
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// @route   POST /api/auth/signin
// @desc    Authenticate user
// @access  Public
router.post('/signin', authLimiter, validateSignin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, userType } = req.body;

    // Find user and include password for comparison
    const user = await User.findByEmail(email).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user type matches
    if (user.userType !== userType) {
      return res.status(401).json({
        success: false,
        message: `This account is registered as ${user.userType === 'engineer' ? 'an engineer' : 'an employer'}.`
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters')
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

    const { fullName } = req.body;
    const user = req.user;

    if (fullName) user.fullName = fullName;
    user.profileCompleted = true;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @route   GET /api/auth/google
// @desc    Start Google OAuth
// @access  Public
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('❌ Google OAuth authentication error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/engineer/auth?error=oauth_failed&message=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }

      if (!user) {
        console.error('❌ Google OAuth: No user returned');
        return res.redirect(`${process.env.FRONTEND_URL}/engineer/auth?error=oauth_failed&message=No user data received`);
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      console.log('✅ Google OAuth callback - User authenticated:', req.user.email);

      // Generate JWT token
      const token = generateToken(req.user._id);

      // Update last login
      await req.user.updateLastLogin();

      // Only send minimal user data to avoid "header too large" error
      // Frontend will fetch full user data using the token
      const minimalUser = {
        _id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
        userType: req.user.userType
      };

      // Redirect to frontend with token and minimal user data
      const redirectUrl = `${process.env.FRONTEND_URL}/engineer/auth?token=${token}&user=${encodeURIComponent(JSON.stringify(minimalUser))}`;
      console.log('✅ Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/engineer/auth?error=oauth_failed&message=${encodeURIComponent(error.message || 'Callback failed')}`);
    }
  }
);

// @route   GET /api/auth/github
// @desc    Start GitHub OAuth
// @access  Public
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// @route   GET /api/auth/github/callback
// @desc    GitHub OAuth callback
// @access  Public
router.get('/github/callback',
  (req, res, next) => {
    passport.authenticate('github', { session: false }, (err, user, info) => {
      if (err) {
        console.error('❌ GitHub OAuth authentication error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/engineer/auth?error=oauth_failed&message=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }

      if (!user) {
        console.error('❌ GitHub OAuth: No user returned');
        return res.redirect(`${process.env.FRONTEND_URL}/engineer/auth?error=oauth_failed&message=No user data received`);
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      console.log('✅ GitHub OAuth callback - User authenticated:', req.user.email);

      // Generate JWT token
      const token = generateToken(req.user._id);

      // Update last login
      await req.user.updateLastLogin();

      // Only send minimal user data to avoid "header too large" error
      // Frontend will fetch full user data using the token
      const minimalUser = {
        _id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
        userType: req.user.userType
      };

      // Redirect to frontend with token and minimal user data
      const redirectUrl = `${process.env.FRONTEND_URL}/engineer/auth?token=${token}&user=${encodeURIComponent(JSON.stringify(minimalUser))}`;
      console.log('✅ Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ GitHub OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/engineer/auth?error=oauth_failed&message=${encodeURIComponent(error.message || 'Callback failed')}`);
    }
  }
);

module.exports = router;