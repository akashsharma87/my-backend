const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the User model
jest.mock('../models/User');
const User = require('../models/User');

// Create a test app
const app = express();
app.use(express.json());

// Import auth routes
const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new engineer user', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'engineer@test.com',
        fullName: 'Test Engineer',
        userType: 'engineer',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.mockImplementation(() => mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'engineer@test.com',
          password: 'TestPass123!',
          fullName: 'Test Engineer',
          userType: 'engineer'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('engineer@test.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should register a new employer user', async () => {
      const mockUser = {
        _id: 'user456',
        email: 'employer@test.com',
        fullName: 'Test Employer',
        userType: 'employer',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.mockImplementation(() => mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'employer@test.com',
          password: 'TestPass123!',
          fullName: 'Test Employer',
          userType: 'employer'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.userType).toBe('employer');
    });

    it('should reject registration with existing email', async () => {
      User.findOne = jest.fn().mockResolvedValue({
        email: 'existing@test.com'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'TestPass123!',
          fullName: 'Test User',
          userType: 'engineer'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPass123!',
          fullName: 'Test User',
          userType: 'engineer'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          fullName: 'Test User',
          userType: 'engineer'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should sign in with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: hashedPassword,
        fullName: 'Test User',
        userType: 'engineer',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!',
          userType: 'engineer'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject sign in with wrong password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        userType: 'engineer',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
          userType: 'engineer'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject sign in with non-existent user', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
          userType: 'engineer'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject engineer trying to sign in as employer', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'engineer@example.com',
        userType: 'engineer',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'engineer@example.com',
          password: 'TestPass123!',
          userType: 'employer'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('registered as');
    });
  });
});

