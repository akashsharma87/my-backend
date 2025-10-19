const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Job = require('../models/Job');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateJob = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('company').trim().isLength({ min: 1, max: 100 }).withMessage('Company must be 1-100 characters'),
  body('location').trim().isLength({ min: 1, max: 100 }).withMessage('Location must be 1-100 characters'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'freelance', 'internship']).withMessage('Invalid job type'),
  body('experienceLevel').isIn(['entry', 'mid', 'senior', 'lead', 'executive']).withMessage('Invalid experience level'),
  body('requiredSkills').optional().isArray().withMessage('Required skills must be an array'),
  body('preferredSkills').optional().isArray().withMessage('Preferred skills must be an array'),
  body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date')
];

// @route   POST /api/jobs
// @desc    Create a new job posting (employers only)
// @access  Private
router.post('/', auth, requireRole(['employer']), validateJob, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      company,
      location,
      jobType,
      experienceLevel,
      requiredSkills,
      preferredSkills,
      salaryRange,
      benefits,
      deadline
    } = req.body;

    const job = new Job({
      employerId: req.user._id,
      title,
      description,
      company,
      location,
      jobType,
      experienceLevel,
      requiredSkills: requiredSkills || [],
      preferredSkills: preferredSkills || [],
      salaryRange,
      benefits: benefits || [],
      deadline: deadline ? new Date(deadline) : undefined
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job }
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job'
    });
  }
});

// @route   GET /api/jobs
// @desc    Get jobs (with filters)
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('skills').optional().isString(),
  query('experienceLevel').optional().isString(),
  query('jobType').optional().isString(),
  query('location').optional().isString(),
  query('search').optional().isString(),
  query('salaryMin').optional().isInt({ min: 0 }),
  query('salaryMax').optional().isInt({ min: 0 })
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

    if (req.user.userType === 'employer') {
      // Employers can see their own jobs
      query.employerId = req.user._id;
    } else {
      // Engineers can see all active jobs
      query.isActive = true;
      
      // Apply filters for engineers
      const { skills, experienceLevel, jobType, location, search, salaryMin, salaryMax } = req.query;
      
      if (skills) {
        const skillsArray = skills.split(',').map(s => s.trim());
        query.requiredSkills = { $in: skillsArray };
      }
      
      if (experienceLevel) {
        query.experienceLevel = experienceLevel;
      }
      
      if (jobType) {
        query.jobType = jobType;
      }
      
      if (location) {
        query.location = new RegExp(location, 'i');
      }
      
      if (search) {
        query.$text = { $search: search };
      }
      
      if (salaryMin !== undefined) {
        query['salaryRange.min'] = { $gte: parseInt(salaryMin) };
      }
      
      if (salaryMax !== undefined) {
        query['salaryRange.max'] = { $lte: parseInt(salaryMax) };
      }
    }

    const jobs = await Job.find(query)
      .populate('employerId', 'fullName email company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs'
    });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get a specific job
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('employerId', 'fullName email company');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views for engineers viewing jobs
    if (req.user.userType === 'engineer' && !job.employerId._id.equals(req.user._id)) {
      await job.incrementViews();
    }

    res.json({
      success: true,
      data: { job }
    });

  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job'
    });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job (employers only, own jobs)
// @access  Private
router.put('/:id', auth, requireRole(['employer']), validateJob, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const job = await Job.findOne({ 
      _id: req.params.id, 
      employerId: req.user._id 
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const {
      title,
      description,
      company,
      location,
      jobType,
      experienceLevel,
      requiredSkills,
      preferredSkills,
      salaryRange,
      benefits,
      deadline,
      isActive
    } = req.body;

    // Update fields
    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (company !== undefined) job.company = company;
    if (location !== undefined) job.location = location;
    if (jobType !== undefined) job.jobType = jobType;
    if (experienceLevel !== undefined) job.experienceLevel = experienceLevel;
    if (requiredSkills !== undefined) job.requiredSkills = requiredSkills;
    if (preferredSkills !== undefined) job.preferredSkills = preferredSkills;
    if (salaryRange !== undefined) job.salaryRange = salaryRange;
    if (benefits !== undefined) job.benefits = benefits;
    if (deadline !== undefined) job.deadline = deadline ? new Date(deadline) : null;
    if (isActive !== undefined) job.isActive = isActive;

    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job }
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job'
    });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job (employers only, own jobs)
// @access  Private
router.delete('/:id', auth, requireRole(['employer']), async (req, res) => {
  try {
    const job = await Job.findOne({ 
      _id: req.params.id, 
      employerId: req.user._id 
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job'
    });
  }
});

// @route   GET /api/jobs/search/advanced
// @desc    Advanced job search
// @access  Private
router.get('/search/advanced', auth, [
  query('skills').optional().isString(),
  query('experienceLevel').optional().isString(),
  query('jobType').optional().isString(),
  query('location').optional().isString(),
  query('searchTerm').optional().isString(),
  query('salaryMin').optional().isInt({ min: 0 }),
  query('salaryMax').optional().isInt({ min: 0 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { skills, experienceLevel, jobType, location, searchTerm, salaryMin, salaryMax } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      skills: skills ? skills.split(',').map(s => s.trim()) : undefined,
      experienceLevel,
      jobType,
      location,
      searchTerm,
      salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
      salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
      sortBy: { createdAt: -1 }
    };

    const jobs = await Job.advancedSearch(filters)
      .skip(skip)
      .limit(limit);

    // Count total for pagination
    const countQuery = await Job.advancedSearch(filters);
    const total = await Job.countDocuments(countQuery.getQuery());

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs'
    });
  }
});

module.exports = router;