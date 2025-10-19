const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

/**
 * Generate a secure random token for password reset
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Random token
 */
const generateResetToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random salt
 * @param {number} length - Salt length in bytes (default: 16)
 * @returns {string} - Random salt
 */
const generateSalt = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const maxLength = 128;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (password.length > maxLength) {
    errors.push(`Password must be less than ${maxLength} characters long`);
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
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more secure password');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength score
 * @param {string} password - Password to analyze
 * @returns {Object} - Strength score and level
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Length bonus
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  // Complexity bonus
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 1;
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) score += 1;
  
  // Determine strength level
  let level = 'Very Weak';
  if (score >= 7) level = 'Very Strong';
  else if (score >= 5) level = 'Strong';
  else if (score >= 3) level = 'Medium';
  else if (score >= 1) level = 'Weak';
  
  return {
    score: Math.min(score, 9), // Cap at 9
    level,
    percentage: Math.min((score / 9) * 100, 100)
  };
};

/**
 * Generate a secure temporary password
 * @param {number} length - Password length (default: 12)
 * @returns {string} - Temporary password
 */
const generateTemporaryPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required category
  const categories = [
    'abcdefghijklmnopqrstuvwxyz', // lowercase
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // uppercase
    '0123456789', // numbers
    '!@#$%^&*' // special characters
  ];
  
  // Add one character from each category
  categories.forEach(category => {
    password += category.charAt(crypto.randomInt(0, category.length));
  });
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(crypto.randomInt(0, charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify if a password has been compromised (basic check)
 * @param {string} password - Password to check
 * @returns {boolean} - True if password appears compromised
 */
const isPasswordCompromised = (password) => {
  // Basic check against common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    'password1', 'password12', 'iloveyou', 'princess',
    'rockyou', 'football', 'baseball', 'welcome123'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

module.exports = {
  hashPassword,
  comparePassword,
  generateResetToken,
  generateSalt,
  validatePasswordStrength,
  calculatePasswordStrength,
  generateTemporaryPassword,
  hashToken,
  isPasswordCompromised
};
