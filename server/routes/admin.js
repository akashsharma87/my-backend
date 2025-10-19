const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { verifyAdminToken, checkPermission, checkRole } = require('../middleware/adminAuth');

// Generate admin JWT token
const generateAdminToken = (adminId) => {
  return jwt.sign(
    { adminId },
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = generateAdminToken(admin._id);

    // Return success
    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: admin.getPublicProfile()
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current admin
router.get('/me', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: req.admin.getPublicProfile()
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin data'
    });
  }
});

// Logout
router.post('/logout', verifyAdminToken, async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// ============================================
// ENGINEER MANAGEMENT ROUTES
// ============================================

// Get all engineers
router.get('/engineers', verifyAdminToken, checkPermission('manage_engineers'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      isVerified, 
      isSuspended,
      isActive 
    } = req.query;

    // Build query
    const query = { userType: 'engineer' };
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }
    
    if (isSuspended !== undefined) {
      query.isSuspended = isSuspended === 'true';
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Get engineers with pagination
    const engineers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get resume count for each engineer
    const engineersWithCounts = await Promise.all(
      engineers.map(async (engineer) => {
        const resumeCount = await Resume.countDocuments({ userId: engineer._id });
        return { ...engineer, resumeCount };
      })
    );

    // Get total count
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      engineers: engineersWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get engineers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engineers'
    });
  }
});

// Get single engineer
router.get('/engineers/:id', verifyAdminToken, checkPermission('manage_engineers'), async (req, res) => {
  try {
    const engineer = await User.findOne({ 
      _id: req.params.id, 
      userType: 'engineer' 
    }).select('-password');

    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }

    // Get engineer's resumes
    const resumes = await Resume.find({ userId: engineer._id });

    res.json({
      success: true,
      engineer: {
        ...engineer.toObject(),
        resumes
      }
    });
  } catch (error) {
    console.error('Get engineer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engineer'
    });
  }
});

// Update engineer
router.put('/engineers/:id', verifyAdminToken, checkPermission('manage_engineers'), async (req, res) => {
  try {
    const { fullName, email, jobTitle, location, bio, skills, totalExperience, adminNotes } = req.body;

    const engineer = await User.findOne({ 
      _id: req.params.id, 
      userType: 'engineer' 
    });

    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }

    // Update fields
    if (fullName) engineer.fullName = fullName;
    if (email) engineer.email = email;
    if (jobTitle !== undefined) engineer.jobTitle = jobTitle;
    if (location !== undefined) engineer.location = location;
    if (bio !== undefined) engineer.bio = bio;
    if (skills) engineer.skills = skills;
    if (totalExperience !== undefined) engineer.totalExperience = totalExperience;
    if (adminNotes !== undefined) engineer.adminNotes = adminNotes;

    await engineer.save();

    res.json({
      success: true,
      message: 'Engineer updated successfully',
      engineer: engineer.getPublicProfile()
    });
  } catch (error) {
    console.error('Update engineer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update engineer'
    });
  }
});

// Verify engineer
router.post('/engineers/:id/verify', verifyAdminToken, checkPermission('manage_engineers'), async (req, res) => {
  try {
    const engineer = await User.findOne({ 
      _id: req.params.id, 
      userType: 'engineer' 
    });

    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }

    engineer.isVerified = true;
    engineer.verifiedAt = new Date();
    engineer.verifiedBy = req.admin._id;

    await engineer.save();

    res.json({
      success: true,
      message: 'Engineer verified successfully',
      engineer: engineer.getPublicProfile()
    });
  } catch (error) {
    console.error('Verify engineer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify engineer'
    });
  }
});

// Suspend engineer
router.post('/engineers/:id/suspend', verifyAdminToken, checkPermission('manage_engineers'), async (req, res) => {
  try {
    const { reason } = req.body;

    const engineer = await User.findOne({ 
      _id: req.params.id, 
      userType: 'engineer' 
    });

    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }

    engineer.isSuspended = true;
    engineer.suspendedAt = new Date();
    engineer.suspendedBy = req.admin._id;
    engineer.suspensionReason = reason || 'No reason provided';

    await engineer.save();

    res.json({
      success: true,
      message: 'Engineer suspended successfully',
      engineer: engineer.getPublicProfile()
    });
  } catch (error) {
    console.error('Suspend engineer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend engineer'
    });
  }
});

// Activate engineer
router.post('/engineers/:id/activate', verifyAdminToken, checkPermission('manage_engineers'), async (req, res) => {
  try {
    const engineer = await User.findOne({ 
      _id: req.params.id, 
      userType: 'engineer' 
    });

    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }

    engineer.isSuspended = false;
    engineer.suspendedAt = null;
    engineer.suspendedBy = null;
    engineer.suspensionReason = null;

    await engineer.save();

    res.json({
      success: true,
      message: 'Engineer activated successfully',
      engineer: engineer.getPublicProfile()
    });
  } catch (error) {
    console.error('Activate engineer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate engineer'
    });
  }
});

// Delete engineer
router.delete('/engineers/:id', verifyAdminToken, checkRole('super_admin'), async (req, res) => {
  try {
    const engineer = await User.findOne({
      _id: req.params.id,
      userType: 'engineer'
    });

    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }

    // Delete engineer's resumes
    await Resume.deleteMany({ userId: engineer._id });

    // Delete engineer
    await engineer.deleteOne();

    res.json({
      success: true,
      message: 'Engineer deleted successfully'
    });
  } catch (error) {
    console.error('Delete engineer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete engineer'
    });
  }
});

// ============================================
// EMPLOYER MANAGEMENT ROUTES (Similar to Engineers)
// ============================================

// Get all employers
router.get('/employers', verifyAdminToken, checkPermission('manage_employers'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, isVerified, isSuspended, isActive } = req.query;

    const query = { userType: 'employer' };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (isSuspended !== undefined) query.isSuspended = isSuspended === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const employers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get job count for each employer (when Job model exists)
    const employersWithCounts = employers.map(employer => ({
      ...employer,
      jobCount: 0 // TODO: Add when Job model is created
    }));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      employers: employersWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get employers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employers'
    });
  }
});

// Get single employer
router.get('/employers/:id', verifyAdminToken, checkPermission('manage_employers'), async (req, res) => {
  try {
    const employer = await User.findOne({
      _id: req.params.id,
      userType: 'employer'
    }).select('-password');

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    res.json({
      success: true,
      employer: {
        ...employer.toObject(),
        jobCount: 0 // TODO: Add when Job model is created
      }
    });
  } catch (error) {
    console.error('Get employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employer'
    });
  }
});

// Update employer
router.put('/employers/:id', verifyAdminToken, checkPermission('manage_employers'), async (req, res) => {
  try {
    const { fullName, email, companyName, companyWebsite, companySize, industry, adminNotes } = req.body;

    const employer = await User.findOne({
      _id: req.params.id,
      userType: 'employer'
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    if (fullName) employer.fullName = fullName;
    if (email) employer.email = email;
    if (companyName !== undefined) employer.companyName = companyName;
    if (companyWebsite !== undefined) employer.companyWebsite = companyWebsite;
    if (companySize !== undefined) employer.companySize = companySize;
    if (industry !== undefined) employer.industry = industry;
    if (adminNotes !== undefined) employer.adminNotes = adminNotes;

    await employer.save();

    res.json({
      success: true,
      message: 'Employer updated successfully',
      employer: employer.getPublicProfile()
    });
  } catch (error) {
    console.error('Update employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employer'
    });
  }
});

// Verify employer
router.post('/employers/:id/verify', verifyAdminToken, checkPermission('manage_employers'), async (req, res) => {
  try {
    const employer = await User.findOne({
      _id: req.params.id,
      userType: 'employer'
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    employer.isVerified = true;
    employer.verifiedAt = new Date();
    employer.verifiedBy = req.admin._id;

    await employer.save();

    res.json({
      success: true,
      message: 'Employer verified successfully',
      employer: employer.getPublicProfile()
    });
  } catch (error) {
    console.error('Verify employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify employer'
    });
  }
});

// Suspend employer
router.post('/employers/:id/suspend', verifyAdminToken, checkPermission('manage_employers'), async (req, res) => {
  try {
    const { reason } = req.body;

    const employer = await User.findOne({
      _id: req.params.id,
      userType: 'employer'
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    employer.isSuspended = true;
    employer.suspendedAt = new Date();
    employer.suspendedBy = req.admin._id;
    employer.suspensionReason = reason || 'No reason provided';

    await employer.save();

    res.json({
      success: true,
      message: 'Employer suspended successfully',
      employer: employer.getPublicProfile()
    });
  } catch (error) {
    console.error('Suspend employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend employer'
    });
  }
});

// Activate employer
router.post('/employers/:id/activate', verifyAdminToken, checkPermission('manage_employers'), async (req, res) => {
  try {
    const employer = await User.findOne({
      _id: req.params.id,
      userType: 'employer'
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    employer.isSuspended = false;
    employer.suspendedAt = null;
    employer.suspendedBy = null;
    employer.suspensionReason = null;

    await employer.save();

    res.json({
      success: true,
      message: 'Employer activated successfully',
      employer: employer.getPublicProfile()
    });
  } catch (error) {
    console.error('Activate employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate employer'
    });
  }
});

// Delete employer
router.delete('/employers/:id', verifyAdminToken, checkRole('super_admin'), async (req, res) => {
  try {
    const employer = await User.findOne({
      _id: req.params.id,
      userType: 'employer'
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    // TODO: Delete employer's jobs when Job model is created

    await employer.deleteOne();

    res.json({
      success: true,
      message: 'Employer deleted successfully'
    });
  } catch (error) {
    console.error('Delete employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employer'
    });
  }
});

// ============================================
// RESUME MANAGEMENT ROUTES
// ============================================

// Get all resumes
router.get('/resumes', verifyAdminToken, checkPermission('manage_resumes'), async (req, res) => {
  try {
    const { page = 1, limit = 50, isVerified, isFlagged, isActive, search } = req.query;

    const query = {};
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (isFlagged !== undefined) query.isFlagged = isFlagged === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const resumes = await Resume.find(query)
      .populate('userId', 'fullName email jobTitle')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Filter by search if provided
    let filteredResumes = resumes;
    if (search) {
      filteredResumes = resumes.filter(resume =>
        resume.userId?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        resume.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        resume.originalFileName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Resume.countDocuments(query);

    res.json({
      success: true,
      resumes: filteredResumes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes'
    });
  }
});

// Get single resume
router.get('/resumes/:id', verifyAdminToken, checkPermission('manage_resumes'), async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
      .populate('userId', 'fullName email jobTitle location');

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      resume
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume'
    });
  }
});

// Verify resume
router.post('/resumes/:id/verify', verifyAdminToken, checkPermission('manage_resumes'), async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.isVerified = true;
    resume.verifiedAt = new Date();
    resume.verifiedBy = req.admin._id;

    await resume.save();

    res.json({
      success: true,
      message: 'Resume verified successfully',
      resume
    });
  } catch (error) {
    console.error('Verify resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify resume'
    });
  }
});

// Flag resume
router.post('/resumes/:id/flag', verifyAdminToken, checkPermission('manage_resumes'), async (req, res) => {
  try {
    const { reason } = req.body;

    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.isFlagged = true;
    resume.flagReason = reason || 'No reason provided';

    await resume.save();

    res.json({
      success: true,
      message: 'Resume flagged successfully',
      resume
    });
  } catch (error) {
    console.error('Flag resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag resume'
    });
  }
});

// Unflag resume
router.post('/resumes/:id/unflag', verifyAdminToken, checkPermission('manage_resumes'), async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.isFlagged = false;
    resume.flagReason = null;

    await resume.save();

    res.json({
      success: true,
      message: 'Resume unflagged successfully',
      resume
    });
  } catch (error) {
    console.error('Unflag resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unflag resume'
    });
  }
});

// Delete resume
router.delete('/resumes/:id', verifyAdminToken, checkRole('super_admin'), async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // TODO: Delete file from storage

    await resume.deleteOne();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume'
    });
  }
});

// ============================================
// ANALYTICS & STATS ROUTES
// ============================================

// Get platform statistics
router.get('/stats', verifyAdminToken, async (req, res) => {
  try {
    const [
      totalEngineers,
      totalEmployers,
      totalResumes,
      activeEngineers,
      activeEmployers,
      verifiedEngineers,
      verifiedEmployers,
      pendingVerifications,
      flaggedContent
    ] = await Promise.all([
      User.countDocuments({ userType: 'engineer' }),
      User.countDocuments({ userType: 'employer' }),
      Resume.countDocuments(),
      User.countDocuments({ userType: 'engineer', isActive: true }),
      User.countDocuments({ userType: 'employer', isActive: true }),
      User.countDocuments({ userType: 'engineer', isVerified: true }),
      User.countDocuments({ userType: 'employer', isVerified: true }),
      User.countDocuments({ isVerified: false }),
      Resume.countDocuments({ isFlagged: true })
    ]);

    res.json({
      success: true,
      totalEngineers,
      totalEmployers,
      totalResumes,
      totalJobs: 0, // Add when Job model is created
      activeEngineers,
      activeEmployers,
      verifiedEngineers,
      verifiedEmployers,
      pendingVerifications,
      flaggedContent
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get recent activity
router.get('/activity/recent', verifyAdminToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent users
    const recentEngineers = await User.find({ userType: 'engineer' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email createdAt')
      .lean();

    const recentEmployers = await User.find({ userType: 'employer' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email companyName createdAt')
      .lean();

    const recentResumes = await Resume.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'fullName email')
      .select('originalFileName createdAt userId')
      .lean();

    // Combine and sort all activities
    const activities = [
      ...recentEngineers.map(e => ({
        type: 'engineer',
        action: 'New engineer registered',
        user: e.fullName,
        email: e.email,
        time: e.createdAt
      })),
      ...recentEmployers.map(e => ({
        type: 'employer',
        action: 'New employer registered',
        user: e.companyName || e.fullName,
        email: e.email,
        time: e.createdAt
      })),
      ...recentResumes.map(r => ({
        type: 'resume',
        action: 'Resume uploaded',
        user: r.userId?.fullName || 'Unknown',
        email: r.userId?.email,
        fileName: r.originalFileName,
        time: r.createdAt
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
});

// Get analytics data
router.get('/analytics/overview', verifyAdminToken, async (req, res) => {
  try {
    // Get data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [engineers, employers, resumes] = await Promise.all([
        User.countDocuments({
          userType: 'engineer',
          createdAt: { $gte: date, $lt: nextDate }
        }),
        User.countDocuments({
          userType: 'employer',
          createdAt: { $gte: date, $lt: nextDate }
        }),
        Resume.countDocuments({
          createdAt: { $gte: date, $lt: nextDate }
        })
      ]);

      dailyData.push({
        name: days[date.getDay()],
        engineers,
        employers,
        resumes,
        date: date.toISOString()
      });
    }

    res.json({
      success: true,
      data: dailyData
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;

