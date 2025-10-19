const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const validator = require('validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify for server-side use
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Rate limiting configurations
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Rate limiting for auth endpoints (more permissive in development)
const authLimiter = createRateLimit(
  process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 minutes in dev, 15 in prod
  process.env.NODE_ENV === 'development' ? 20 : 5, // 20 attempts in dev, 5 in prod
  'Too many authentication attempts, please try again later.',
  true // skip successful requests
);

// File upload rate limiting
const uploadLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // limit each IP to 10 uploads per hour
  'Too many file uploads, please try again later.'
);

// Password reset rate limiting
const passwordResetLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 password reset attempts per hour
  'Too many password reset attempts, please try again later.'
);

// Helmet configuration for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://openrouter.ai"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for file uploads
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurify.sanitize(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = DOMPurify.sanitize(req.query[key]);
      }
    }
  }

  next();
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};

// Request size limiting
const requestSizeLimit = (limit = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length'));
    const maxSize = parseInt(limit.replace(/\D/g, '')) * 1024 * 1024; // Convert to bytes
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
    }
    
    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS header for HTTPS
  if (req.secure || req.get('x-forwarded-proto') === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// File type validation
const validateFileType = (allowedTypes = ['pdf', 'doc', 'docx']) => {
  return (req, res, next) => {
    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      const mimeType = req.file.mimetype;
      
      const allowedMimeTypes = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      if (!allowedTypes.includes(fileExtension) || 
          !Object.values(allowedMimeTypes).includes(mimeType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only PDF and Word documents are allowed.'
        });
      }
    }
    
    next();
  };
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_FRONTEND_URL,  // Admin dashboard URL
      'http://localhost:5173',         // Main app dev
      'http://localhost:5174',         // Admin dashboard dev
      'http://localhost:4173',         // Preview
      'http://localhost:3000',         // Backend
      'https://engineercv2.netlify.app',
      'https://admin.engineer.cv',     // Production admin (if deployed separately)
      'https://engineer.cv'            // Production main app
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('❌ CORS Error - Origin not allowed:', origin);
      console.error('❌ CORS Error - Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  passwordResetLimiter,
  helmetConfig,
  sanitizeInput,
  ipWhitelist,
  requestSizeLimit,
  securityHeaders,
  validateFileType,
  corsOptions,
  mongoSanitize: mongoSanitize(),
  hpp: hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'skills', 'location', 'experience']
  })
};
