const crypto = require('crypto');

// Environment validation
const validateEnvironment = () => {
  // Required variables for all environments
  const baseRequiredVars = [
    'JWT_SECRET',
    'SESSION_SECRET'
  ];

  // Additional required variables for production
  const productionRequiredVars = [
    'MONGODB_URL',
    'FRONTEND_URL'
  ];

  const requiredEnvVars = process.env.NODE_ENV === 'production'
    ? [...baseRequiredVars, ...productionRequiredVars]
    : baseRequiredVars;

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Missing required environment variables:', missingVars);
      process.exit(1);
    } else {
      console.warn('⚠️  Missing environment variables (development mode):', missingVars);
      console.log('   Application will continue with default values');
    }
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ JWT_SECRET must be at least 32 characters long');
      process.exit(1);
    } else {
      console.warn('⚠️  JWT_SECRET is shorter than recommended (32 characters)');
    }
  }

  // Validate session secret strength
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 64) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ SESSION_SECRET must be at least 64 characters long');
      process.exit(1);
    } else {
      console.warn('⚠️  SESSION_SECRET is shorter than recommended (64 characters)');
    }
  }

  // Warn about default secrets in production
  if (process.env.NODE_ENV === 'production') {
    const defaultSecrets = [
      'your-super-secret-jwt-key-here-please-change-in-production',
      'your-session-secret'
    ];

    if (defaultSecrets.includes(process.env.JWT_SECRET)) {
      console.error('❌ Default JWT_SECRET detected in production! Please change it.');
      process.exit(1);
    }

    if (defaultSecrets.includes(process.env.SESSION_SECRET)) {
      console.error('❌ Default SESSION_SECRET detected in production! Please change it.');
      process.exit(1);
    }
  }
};

// Generate secure random strings
const generateSecureSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Password strength validation
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Security headers configuration
const getSecurityConfig = () => {
  return {
    // Content Security Policy
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'", 
          "https://api.openai.com", 
          "https://openrouter.ai",
          process.env.FRONTEND_URL
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
      },
    },
    
    // HSTS configuration
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // CORS configuration
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          'http://localhost:5173',
          'http://localhost:4173',
          'https://admin.engineer.cv',
          'http://localhost:3000'
        ].filter(Boolean);
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400 // 24 hours
    }
  };
};

// Rate limiting configurations
const getRateLimitConfig = () => {
  return {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    },
    
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true
    },
    
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each IP to 10 uploads per hour
      message: 'Too many file uploads, please try again later.'
    },
    
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 password reset attempts per hour
      message: 'Too many password reset attempts, please try again later.'
    }
  };
};

// File upload security configuration
const getFileUploadConfig = () => {
  return {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['pdf', 'doc', 'docx'],
    uploadPath: './uploads',
    tempPath: './temp'
  };
};

// Database security configuration
const getDatabaseConfig = () => {
  return {
    options: {
      // Remove deprecated options (useNewUrlParser, useUnifiedTopology are default in v4+)
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    }
  };
};

// JWT configuration
const getJWTConfig = () => {
  return {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: 'engineer-cv',
    audience: 'engineer-cv-users'
  };
};

// Session configuration
const getSessionConfig = () => {
  return {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    },
    name: 'sessionId' // Don't use default session name
  };
};

module.exports = {
  validateEnvironment,
  generateSecureSecret,
  validatePasswordStrength,
  getSecurityConfig,
  getRateLimitConfig,
  getFileUploadConfig,
  getDatabaseConfig,
  getJWTConfig,
  getSessionConfig
};
