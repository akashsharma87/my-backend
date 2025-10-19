// Validation utilities for form inputs and data

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  test: (value: unknown) => boolean;
  message: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name) {
    errors.push('Name is required');
  } else {
    if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    if (name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// Phone validation
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (phone) {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-()]/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// URL validation
export const validateUrl = (url: string): ValidationResult => {
  const errors: string[] = [];
  
  if (url) {
    try {
      new URL(url);
    } catch {
      errors.push('Please enter a valid URL');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// File validation
export const validateFile = (file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}): ValidationResult => {
  const errors: string[] = [];
  const { maxSize = 10485760, allowedTypes = [], required = false } = options;
  
  if (!file && required) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  if (file) {
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// Skills validation
export const validateSkills = (skills: string[]): ValidationResult => {
  const errors: string[] = [];
  
  if (skills.length === 0) {
    errors.push('At least one skill is required');
  } else {
    if (skills.length > 50) {
      errors.push('Maximum 50 skills allowed');
    }
    
    skills.forEach((skill, index) => {
      if (!skill.trim()) {
        errors.push(`Skill ${index + 1} cannot be empty`);
      } else if (skill.length > 50) {
        errors.push(`Skill "${skill}" must be less than 50 characters`);
      }
    });
  }
  
  return { isValid: errors.length === 0, errors };
};

// Experience years validation
export const validateExperienceYears = (years: number): ValidationResult => {
  const errors: string[] = [];
  
  if (years < 0) {
    errors.push('Experience years cannot be negative');
  } else if (years > 50) {
    errors.push('Experience years cannot exceed 50');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Generic field validation
export const validateField = (value: unknown, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// Sanitize HTML input
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Validate form data
export const validateFormData = (data: Record<string, unknown>, schema: Record<string, ValidationRule[]>): {
  isValid: boolean;
  errors: Record<string, string[]>;
} => {
  const errors: Record<string, string[]> = {};
  
  Object.keys(schema).forEach(field => {
    const result = validateField(data[field], schema[field]);
    if (!result.isValid) {
      errors[field] = result.errors;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
