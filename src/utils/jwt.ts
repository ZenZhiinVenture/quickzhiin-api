import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../services/config';
import { AuthUser } from '../types/auth';
import logger from './logger';

const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

/**
 * Hashes a plain text password.
 * @param password - The plain text password.
 * @returns A promise resolving to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password.
 * @param hash - The hashed password to compare against.
 * @returns A promise resolving to true if passwords match, false otherwise.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generates a JSON Web Token (JWT).
 * @param payload - The data to include in the token payload.
 * @returns The generated JWT string.
 */
export const generateToken = (payload: AuthUser): string => {
  if (!config.jwt.secret) {
    throw new Error('JWT secret is not configured.');
  }

  const expiresIn = Number(config.jwt.expiresIn);

  const options: jwt.SignOptions = {
    expiresIn: expiresIn,
  };

  return jwt.sign(payload, config.jwt.secret, options);
};

/**
 * Verifies a JSON Web Token (JWT).
 * @param token - The JWT string to verify.
 * @returns The decoded payload if the token is valid.
 * @throws JsonWebTokenError if the token is invalid or expired.
 */
export const verifyToken = (token: string): AuthUser => {
  if (!config.jwt.secret) {
    throw new Error('JWT secret is not configured.');
  }
  try {
    return jwt.verify(token, config.jwt.secret) as AuthUser;
  } catch (error) {
    logger.warn('JWT Verification Error', { error: (error as Error).message });
    throw error; // Re-throw the error to be handled by middleware
  }
};
