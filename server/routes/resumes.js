const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, query, validationResult } = require('express-validator');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { uploadLimiter, validateFileType } = require('../middleware/security');
const {
  cacheResumeData,
  invalidateCacheOnModification
} = require('../middleware/cache');
const ocrService = require('../services/ocrService');
const openaiService = require('../services/openaiService');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: fileFilter
});

// Validation middleware
const validateResumeUpdate = [
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('skills.*').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Each skill must be 1-50 characters'),
  body('experienceYears').optional().isInt({ min: 0, max: 50 }).withMessage('Experience years must be 0-50'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location max 100 characters')
];

// @route   POST /api/resumes/upload
// @desc    Upload a new resume (engineers only)
// @access  Private
router.post('/upload', uploadLimiter, auth, requireRole(['engineer']), invalidateCacheOnModification(['resume:', 'user:']), upload.single('resume'), validateFileType(), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { skills, experienceYears, location, jobPreferences, autoActivate } = req.body;

    // Parse skills if it's a string (from form data)
    let parsedSkills = [];
    if (skills) {
      parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    }

    // Parse job preferences if it's a string (from form data)
    let parsedJobPreferences = {};
    if (jobPreferences) {
      parsedJobPreferences = typeof jobPreferences === 'string' ? JSON.parse(jobPreferences) : jobPreferences;
    }

    // Check if auto-activation is requested
    const shouldAutoActivate = autoActivate === 'true';
    const now = new Date();
    const activationExpiry = shouldAutoActivate ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null; // 7 days from now

    const resume = new Resume({
      userId: req.user._id,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      skills: parsedSkills,
      experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
      location: location?.trim(),
      jobPreferences: parsedJobPreferences,
      isActive: shouldAutoActivate,
      activatedAt: shouldAutoActivate ? now : null,
      activationExpiresAt: activationExpiry
    });

    await resume.save();

    // Process OCR in background
    processResumeOCR(resume._id, req.file.path, req.file.mimetype);

    res.status(201).json({
      success: true,
      message: shouldAutoActivate 
        ? 'Resume uploaded and activated successfully. It is now visible to employers for 7 days.'
        : 'Resume uploaded successfully',
      data: { resume }
    });

  } catch (error) {
    // Delete uploaded file if database save fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed'
    });
  }
});

// @route   GET /api/resumes
// @desc    Get resumes (with filters for employers, own resumes for engineers)
// @access  Private
router.get('/', auth, cacheResumeData(300), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('skills').optional().isString(),
  query('minExperience').optional().isInt({ min: 0 }),
  query('maxExperience').optional().isInt({ min: 0 }),
  query('location').optional().isString(),
  query('search').optional().isString()
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    let populate = 'userId';
    let populateSelect = 'fullName email';

    if (req.user.userType === 'engineer') {
      // Engineers can only see their own resumes
      query.userId = req.user._id;
    } else {
      // For employers: only show active and non-expired resumes
      query.isActive = true;
      query.activationExpiresAt = { $gt: new Date() };

      // Debug logging for employer queries
      if (process.env.NODE_ENV === 'development') {
        console.log('Employer query filters:', {
          isActive: query.isActive,
          activationExpiresAt: query.activationExpiresAt,
          currentTime: new Date(),
          userType: req.user.userType,
          publicVisibilityFilter: query.$or
        });
      }
      
      // Apply filters for employers
      const { skills, minExperience, maxExperience, location, search } = req.query;
      
      if (skills) {
        const skillsArray = skills.split(',').map(s => s.trim());
        query.skills = { $in: skillsArray };
      }
      
      if (minExperience !== undefined) {
        query.experienceYears = { ...query.experienceYears, $gte: parseInt(minExperience) };
      }
      
      if (maxExperience !== undefined) {
        query.experienceYears = { ...query.experienceYears, $lte: parseInt(maxExperience) };
      }
      
      if (location) {
        query.location = new RegExp(location, 'i');
      }
      
      if (search) {
        query.$text = { $search: search };
      }
    }

    const resumes = await Resume.find(query)
      .populate(populate, populateSelect)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Resume.countDocuments(query);

    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Resume query results: Found ${resumes.length} resumes out of ${total} total matching query`);

      if (req.user.userType === 'employer') {
        console.log('Sample resume for employer:', resumes[0] ? {
          id: resumes[0]._id,
          isActive: resumes[0].isActive,
          activationExpiresAt: resumes[0].activationExpiresAt,
          fileName: resumes[0].fileName,
          jobPreferences: resumes[0].jobPreferences
        } : 'No resumes found');

        // If no resumes found with strict filtering, let's check what's actually in the database
        if (resumes.length === 0) {
          console.log('No resumes found with strict filtering. Checking database contents...');
          const allResumes = await Resume.find({}).limit(5).select('isActive activationExpiresAt fileName jobPreferences');
          console.log('Sample resumes in database:', allResumes.map(r => ({
            id: r._id,
            isActive: r.isActive,
            activationExpiresAt: r.activationExpiresAt,
            fileName: r.fileName,
            hasJobPreferences: !!r.jobPreferences,
            showPublicly: r.jobPreferences?.showPublicly
          })));

          // Check how many resumes are active
          const activeCount = await Resume.countDocuments({ isActive: true });
          const nonExpiredCount = await Resume.countDocuments({
            activationExpiresAt: { $gt: new Date() }
          });
          const bothActiveAndNonExpired = await Resume.countDocuments({
            isActive: true,
            activationExpiresAt: { $gt: new Date() }
          });

          console.log('Database stats:', {
            totalResumes: await Resume.countDocuments({}),
            activeResumes: activeCount,
            nonExpiredResumes: nonExpiredCount,
            bothActiveAndNonExpired: bothActiveAndNonExpired
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        resumes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
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

// @route   GET /api/resumes/:id
// @desc    Get a specific resume
// @access  Private
router.get('/:id', auth, cacheResumeData(600), async (req, res) => {
  try {
    let resume = await Resume.findById(req.params.id).populate('userId', 'fullName email');
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Check permissions
    if (req.user.userType === 'engineer' && !resume.userId._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // For employers, ensure resume is active and not expired
    if (req.user.userType === 'employer' && !resume.userId._id.equals(req.user._id)) {
      if (!resume.isActive || !resume.activationExpiresAt || resume.activationExpiresAt <= new Date()) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found or no longer available'
        });
      }
    }

    // Increment views for employers viewing resumes
    if (req.user.userType === 'employer' && !resume.userId._id.equals(req.user._id)) {
      await resume.incrementViews();
    }

    res.json({
      success: true,
      data: { resume }
    });

  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume'
    });
  }
});

// @route   PUT /api/resumes/:id
// @desc    Update resume metadata (engineers only, own resumes)
// @access  Private
router.put('/:id', auth, requireRole(['engineer']), invalidateCacheOnModification(['resume:', 'user:']), validateResumeUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const { skills, experienceYears, location } = req.body;

    if (skills !== undefined) resume.skills = skills;
    if (experienceYears !== undefined) resume.experienceYears = experienceYears;
    if (location !== undefined) resume.location = location;

    await resume.save();

    res.json({
      success: true,
      message: 'Resume updated successfully',
      data: { resume }
    });

  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resume'
    });
  }
});

// @route   DELETE /api/resumes/:id
// @desc    Delete resume (engineers only, own resumes)
// @access  Private
router.delete('/:id', auth, requireRole(['engineer']), invalidateCacheOnModification(['resume:', 'user:']), async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Delete file from disk
    const filePath = path.join(uploadsDir, resume.fileName);
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    // Delete from database
    await Resume.findByIdAndDelete(req.params.id);

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

// @route   GET /api/resumes/:id/download
// @desc    Download resume file
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Check permissions
    if (req.user.userType === 'engineer' && !resume.userId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const filePath = path.join(uploadsDir, resume.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Increment downloads for employers
    if (req.user.userType === 'employer') {
      await resume.incrementDownloads();
    }

    res.download(filePath, resume.originalFileName);

  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download resume'
    });
  }
});

// Enhanced resume processing with OpenAI
async function processResumeOCR(resumeId, filePath, mimeType) {
  try {
    console.log(`🚀 Starting enhanced OpenAI resume processing for resume ${resumeId}`);
    
    // Update status to processing
    await Resume.findByIdAndUpdate(resumeId, {
      'extractedData.extractionStatus': 'processing'
    });

    // Step 1: Extract text from file using OCR
    console.log('📄 Extracting text from file...');
    const rawText = await ocrService.extractTextFromFile(filePath, mimeType);
    
    if (!rawText || rawText.trim().length < 50) {
      throw new Error('Insufficient text extracted from resume');
    }

    // Step 2: Parse with OpenAI for structured data
    console.log('🤖 Processing with OpenAI...');
    const openaiData = await openaiService.parseResume(rawText);
    
    // Step 3: Prepare update data
    const skillsArray = openaiData.skills?.all || [];
    const experienceYears = openaiData.metadata?.totalExperienceYears || 0;
    const location = openaiData.metadata?.location || openaiData.personalInfo?.address || null;
    
    // Step 4: Update resume with extracted data
    const updateData = {
      extractedData: {
        ...openaiData,
        rawText: rawText,
        extractionStatus: 'completed',
        extractedAt: new Date()
      },
      skills: skillsArray,
      experienceYears: experienceYears,
      location: location,
      searchableText: `${rawText} ${skillsArray.join(' ')}`.toLowerCase()
    };
    
    await Resume.findByIdAndUpdate(resumeId, updateData);
    
    // Step 5: Enhance user profile (background)
    enhanceUserProfile(resumeId, openaiData);

    console.log(`✅ OpenAI processing completed for resume ${resumeId}`);
    
  } catch (error) {
    console.error(`❌ Enhanced processing failed for resume ${resumeId}:`, error);
    
    // Update status to failed
    await Resume.findByIdAndUpdate(resumeId, {
      'extractedData.extractionStatus': 'failed',
      'extractedData.extractedAt': new Date(),
      'extractedData.errorMessage': error.message
    });
  }
}

// Background function to enhance user profile with resume data
async function enhanceUserProfile(resumeId, resumeData) {
  try {
    console.log('👤 Starting user profile enhancement...');
    
    const resume = await Resume.findById(resumeId);
    if (!resume) return;
    
    const user = await User.findById(resume.userId);
    if (!user) return;
    
    // Get existing profile data
    const existingProfile = {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      jobTitle: user.jobTitle,
      company: user.company,
      website: user.website,
      skills: user.skills,
      experience: user.experience,
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio
    };
    
    // Enhance profile with OpenAI
    const enhancedProfile = await openaiService.enhanceProfile(existingProfile, resumeData);
    
    // Update user profile
    const profileUpdate = {
      fullName: enhancedProfile.fullName || user.fullName,
      phone: enhancedProfile.phone || user.phone,
      bio: enhancedProfile.bio || user.bio,
      location: enhancedProfile.location || user.location,
      jobTitle: enhancedProfile.jobTitle || user.jobTitle,
      company: enhancedProfile.company || user.company,
      website: enhancedProfile.website || user.website,
      skills: enhancedProfile.skills || user.skills,
      experience: enhancedProfile.experience || user.experience,
      linkedin: enhancedProfile.linkedin || user.linkedin,
      github: enhancedProfile.github || user.github,
      portfolio: enhancedProfile.portfolio || user.portfolio,
      totalExperience: enhancedProfile.totalExperience || user.totalExperience,
      currentRole: enhancedProfile.currentRole || user.currentRole,
      availability: enhancedProfile.availability || user.availability,
      profileEnhancedFromResume: true,
      lastProfileUpdate: new Date()
    };
    
    await User.findByIdAndUpdate(resume.userId, profileUpdate);
    console.log('✅ User profile enhanced successfully');
    
  } catch (error) {
    console.error('❌ Profile enhancement failed:', error);
    // Don't throw error as this is background process
  }
}

// @route   POST /api/resumes/:id/process-ocr
// @desc    Manually trigger OCR processing for a resume
// @access  Private (Engineers for own resumes, Employers for any resume)
router.post('/:id/process-ocr', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Check permissions
    if (req.user.userType === 'engineer' && !resume.userId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const filePath = path.join(uploadsDir, resume.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    // Start OCR processing
    processResumeOCR(resume._id, filePath, resume.mimeType);

    res.json({
      success: true,
      message: 'OCR processing started'
    });

  } catch (error) {
    console.error('Process OCR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start OCR processing'
    });
  }
});

// @route   POST /api/resumes/:id/reprocess
// @desc    Reprocess OCR for a resume with enhanced algorithms
// @access  Private (Engineers for own resumes)
router.post('/:id/reprocess', auth, async (req, res) => {
  try {
    const resumeId = req.params.id;
    console.log(`🔄 Reprocessing OCR for resume ${resumeId}`);
    
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    
    const filePath = path.join(uploadsDir, resume.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, message: 'No file found for this resume' });
    }
    
    // Extract text from file
    console.log('🔍 Re-extracting text from file:', filePath);
    const extractedText = await ocrService.extractTextFromFile(filePath, resume.mimeType);
    
    // Extract structured data
    console.log('📊 Re-extracting structured data');
    const extractedData = ocrService.extractStructuredData(extractedText);
    
    console.log('📝 Extracted data structure:', JSON.stringify(extractedData, null, 2));
    
    // Convert skills object to array for database compatibility
    let skillsArray = [];
    if (extractedData.skills && typeof extractedData.skills === 'object') {
      if (Array.isArray(extractedData.skills)) {
        skillsArray = extractedData.skills;
      } else {
        // Convert categorized skills to flat array
        skillsArray = Object.values(extractedData.skills)
          .flat()
          .filter(skill => typeof skill === 'string' && skill.trim().length > 0);
      }
    }
    
    // Update resume with extracted data
    const updateData = {
      extractedData: {
        ...extractedData,
        rawText: extractedText,
        extractionStatus: 'completed',
        extractedAt: new Date()
      },
      skills: skillsArray,
      searchableText: extractedText
    };
    
    console.log('💾 Final update data:', JSON.stringify(updateData, null, 2));
    
    const updatedResume = await Resume.findByIdAndUpdate(
      resumeId,
      updateData,
      { new: true }
    ).populate('userId', 'fullName email');
    
    console.log('✅ Resume reprocessed successfully');
    
    res.json({
      success: true,
      message: 'Resume reprocessed successfully',
      resume: updatedResume
    });
    
  } catch (error) {
    console.error('❌ Error reprocessing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Error reprocessing resume',
      error: error.message
    });
  }
});

// @route   GET /api/resumes/:id/extracted-data
// @desc    Get extracted data from resume
// @access  Private
router.get('/:id/extracted-data', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id).populate('userId', 'fullName email');
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Check permissions
    if (req.user.userType === 'engineer' && !resume.userId._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment views for employers
    if (req.user.userType === 'employer' && !resume.userId._id.equals(req.user._id)) {
      await resume.incrementViews();
    }

    res.json({
      success: true,
      data: {
        resume: {
          _id: resume._id,
          fileName: resume.fileName,
          originalFileName: resume.originalFileName,
          createdAt: resume.createdAt,
          userId: resume.userId,
          extractedData: resume.extractedData
        }
      }
    });

  } catch (error) {
    console.error('Get extracted data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch extracted data'
    });
  }
});

// @route   POST /api/resumes/:id/activate
// @desc    Activate a resume for 7 days
// @access  Private (Engineers only, own resumes)
router.post('/:id/activate', auth, requireRole(['engineer']), invalidateCacheOnModification(['resume:']), async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (!resume.canReactivateResume()) {
      return res.status(400).json({
        success: false,
        message: 'Resume cannot be reactivated at this time'
      });
    }

    await resume.activateResume();

    res.json({
      success: true,
      message: 'Resume activated successfully for 7 days',
      data: { 
        resume: {
          _id: resume._id,
          isActive: resume.isActive,
          activatedAt: resume.activatedAt,
          activationExpiresAt: resume.activationExpiresAt
        }
      }
    });

  } catch (error) {
    console.error('Activate resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate resume'
    });
  }
});

// @route   POST /api/resumes/:id/deactivate
// @desc    Deactivate a resume
// @access  Private (Engineers only, own resumes)
router.post('/:id/deactivate', auth, requireRole(['engineer']), invalidateCacheOnModification(['resume:']), async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    await resume.deactivateResume();

    res.json({
      success: true,
      message: 'Resume deactivated successfully',
      data: { 
        resume: {
          _id: resume._id,
          isActive: resume.isActive
        }
      }
    });

  } catch (error) {
    console.error('Deactivate resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate resume'
    });
  }
});

// @route   GET /api/resumes/check-expired
// @desc    Check and deactivate expired resumes (internal use)
// @access  Private
router.get('/check-expired', auth, async (req, res) => {
  try {
    const expiredResumes = await Resume.find({
      isActive: true,
      activationExpiresAt: { $lt: new Date() }
    });

    for (const resume of expiredResumes) {
      await resume.deactivateResume();
    }

    res.json({
      success: true,
      message: `Deactivated ${expiredResumes.length} expired resumes`,
      data: { count: expiredResumes.length }
    });

  } catch (error) {
    console.error('Check expired resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check expired resumes'
    });
  }
});

// @route   POST /api/resumes/test-parsing
// @desc    Test parsing with sample resume text
// @access  Private
router.post('/test-parsing', auth, async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'Resume text is required'
      });
    }

    console.log('Testing parsing with sample text...');
    const extractedData = ocrService.extractStructuredData(resumeText);
    
    res.json({
      success: true,
      message: 'Parsing test completed',
      data: { extractedData }
    });

  } catch (error) {
    console.error('Test parsing error:', error);
    res.status(500).json({
      success: false,
      message: 'Test parsing failed',
      error: error.message
    });
  }
});

// @route   POST /api/resumes/test-openai
// @desc    Test OpenAI parsing with sample resume text
// @access  Private
router.post('/test-openai', auth, async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'Resume text is required'
      });
    }

    console.log('🤖 Testing OpenAI parsing with sample text...');
    const extractedData = await openaiService.parseResume(resumeText);
    
    res.json({
      success: true,
      message: 'OpenAI parsing test completed',
      data: { extractedData }
    });

  } catch (error) {
    console.error('OpenAI test parsing error:', error);
    res.status(500).json({
      success: false,
      message: 'OpenAI parsing test failed',
      error: error.message
    });
  }
});

// @route   GET /api/resumes/:id/enhanced-data
// @desc    Get enhanced resume data with OpenAI parsing results
// @access  Private
router.get('/:id/enhanced-data', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
      .populate('userId', 'fullName email phone linkedin github portfolio');
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Check permissions
    if (req.user.userType === 'engineer' && !resume.userId._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment views for employers
    if (req.user.userType === 'employer') {
      await resume.incrementViews();
    }

    res.json({
      success: true,
      data: {
        resume: {
          _id: resume._id,
          fileName: resume.fileName,
          originalFileName: resume.originalFileName,
          fileUrl: resume.fileUrl,
          fileSize: resume.fileSize,
          skills: resume.skills,
          experienceYears: resume.experienceYears,
          location: resume.location,
          isActive: resume.isActive,
          views: resume.views,
          extractedData: resume.extractedData,
          createdAt: resume.createdAt,
          user: resume.userId
        }
      }
    });

  } catch (error) {
    console.error('Get enhanced data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enhanced resume data'
    });
  }
});

// @route   POST /api/resumes/:id/reprocess-openai
// @desc    Reprocess resume with OpenAI (force re-parse)
// @access  Private (Engineers for own resumes)
router.post('/:id/reprocess-openai', auth, requireRole(['engineer']), async (req, res) => {
  try {
    const resumeId = req.params.id;
    console.log(`🔄 Reprocessing with OpenAI for resume ${resumeId}`);
    
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume not found or access denied' 
      });
    }
    
    const filePath = path.join(uploadsDir, resume.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Resume file not found' 
      });
    }
    
    // Start enhanced OpenAI processing
    processResumeOCR(resumeId, filePath, resume.mimeType);
    
    res.json({
      success: true,
      message: 'OpenAI reprocessing started. This may take a few moments.'
    });
    
  } catch (error) {
    console.error('Reprocess OpenAI error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start OpenAI reprocessing'
    });
  }
});

// @route   GET /api/resumes/user-profile-data
// @desc    Get user profile data enhanced from resumes
// @access  Private (Engineers only)
router.get('/user-profile-data', auth, requireRole(['engineer']), async (req, res) => {
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
    .select('extractedData');

    res.json({
      success: true,
      data: {
        user: user,
        latestResumeData: latestResume?.extractedData || null,
        hasEnhancedProfile: user.profileEnhancedFromResume
      }
    });

  } catch (error) {
    console.error('Get user profile data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile data'
    });
  }
});

// @route   POST /api/resumes/:id/activate
// @desc    Activate a resume for 7 days (engineers only)
// @access  Private
router.post('/:id/activate', auth, requireRole(['engineer']), invalidateCacheOnModification(['resume:']), async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Check if resume can be activated
    if (resume.isActive && resume.activationExpiresAt > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Resume is already active',
        data: {
          expiresAt: resume.activationExpiresAt
        }
      });
    }

    // Activate the resume for 7 days
    const activationDate = new Date();
    const expirationDate = new Date(activationDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    resume.isActive = true;
    resume.activatedAt = activationDate;
    resume.activationExpiresAt = expirationDate;
    resume.canReactivate = true;

    await resume.save();

    res.json({
      success: true,
      message: 'Resume activated successfully for 7 days',
      data: {
        resume: {
          _id: resume._id,
          isActive: resume.isActive,
          activatedAt: resume.activatedAt,
          activationExpiresAt: resume.activationExpiresAt,
          canReactivate: resume.canReactivate
        }
      }
    });
  } catch (error) {
    console.error('Resume activation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resume activation'
    });
  }
});

// @route   POST /api/resumes/:id/refresh
// @desc    Refresh resume visibility (restart 7-day timer)
// @access  Private (Engineers only, own resumes)
router.post('/:id/refresh', auth, requireRole(['engineer']), invalidateCacheOnModification(['resume:']), async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Allow refresh regardless of current status - restart the timer
    const activationDate = new Date();
    const expirationDate = new Date(activationDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    resume.isActive = true;
    resume.activatedAt = activationDate;
    resume.activationExpiresAt = expirationDate;
    resume.canReactivate = true;

    await resume.save();

    res.json({
      success: true,
      message: 'Resume visibility refreshed successfully for 7 days',
      data: {
        resume: {
          _id: resume._id,
          isActive: resume.isActive,
          activatedAt: resume.activatedAt,
          activationExpiresAt: resume.activationExpiresAt,
          canReactivate: resume.canReactivate
        }
      }
    });
  } catch (error) {
    console.error('Resume refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resume refresh'
    });
  }
});

// @route   POST /api/resumes/:id/deactivate
// @desc    Deactivate a resume (engineers only)
// @access  Private
router.post('/:id/deactivate', auth, requireRole(['engineer']), invalidateCacheOnModification(['resume:']), async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.isActive = false;
    await resume.save();

    res.json({
      success: true,
      message: 'Resume deactivated successfully',
      data: {
        resume: {
          _id: resume._id,
          isActive: resume.isActive,
          activatedAt: resume.activatedAt,
          activationExpiresAt: resume.activationExpiresAt,
          canReactivate: resume.canReactivate
        }
      }
    });
  } catch (error) {
    console.error('Resume deactivation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resume deactivation'
    });
  }
});

module.exports = router;