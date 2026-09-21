import login from './login';
import register from './register';
import { centralPrisma } from '../../services/prisma/prismaClient';
import bcrypt from 'bcrypt';
import * as jwtUtil from '../../utils/jwt';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  centralPrisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    tenantUserAccess: {
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn().mockResolvedValue('salt123'),
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
}));

jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

describe('Auth Controllers (Login & Register)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 401 when user is not found', async () => {
      mockRequest.body = { email: 'nonexistent@example.com', password: 'password123' };
      (centralPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'error_invalid_credentials' });
    });

    it('should return 401 when password does not match', async () => {
      mockRequest.body = { email: 'user@example.com', password: 'wrongPassword' };
      (centralPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        email: 'user@example.com',
        isActive: true,
        status: 'active',
        passwordHash: 'hashedPass',
        tenantAccess: [],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'error_invalid_credentials' });
    });

    it('should return 200 and JWT token when credentials are valid', async () => {
      mockRequest.body = { email: 'user@example.com', password: 'correctPassword' };
      (centralPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        status: 'active',
        passwordHash: 'hashedPass',
        tenantAccess: [
          {
            role: 'ADMIN',
            tenant: { id: BigInt(10), code: 'tenant-10', name: 'Tenant 10' },
          },
        ],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock-jwt-token',
          user: expect.objectContaining({ email: 'user@example.com' }),
        })
      );
    });
  });

  describe('register', () => {
    it('should return 400 if user email already exists', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };
      (centralPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: BigInt(2),
        email: 'existing@example.com',
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'error_email_already_exists' });
    });

    it('should create user, hash password, and return 201 with JWT', async () => {
      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      (centralPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (centralPrisma.user.create as jest.Mock).mockResolvedValue({
        id: BigInt(5),
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt123');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock-jwt-token',
          user: expect.objectContaining({ email: 'newuser@example.com' }),
        })
      );
    });
  });
});
