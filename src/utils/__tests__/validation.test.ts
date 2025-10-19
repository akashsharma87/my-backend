import { describe, it, expect } from 'vitest';
import { validateFile, validateSkills, validateEmail } from '../validation';

describe('Validation Utils', () => {
  describe('validateFile', () => {
    it('should accept valid PDF files', () => {
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid DOCX files', () => {
      const file = new File(['content'], 'resume.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const result = validateFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'resume.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('size');
    });

    it('should reject invalid file types', () => {
      const file = new File(['content'], 'resume.txt', { type: 'text/plain' });
      const result = validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('type');
    });
  });

  describe('validateSkills', () => {
    it('should accept valid skills array', () => {
      const skills = ['JavaScript', 'React', 'Node.js'];
      const result = validateSkills(skills);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty skills array', () => {
      const skills: string[] = [];
      const result = validateSkills(skills);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least one skill');
    });

    it('should reject skills with too many items', () => {
      const skills = new Array(21).fill('Skill');
      const result = validateSkills(skills);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('maximum');
    });

    it('should reject skills with empty strings', () => {
      const skills = ['JavaScript', '', 'React'];
      const result = validateSkills(skills);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com'
      ];
      
      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        ''
      ];
      
      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });
});

