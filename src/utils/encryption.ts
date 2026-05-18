import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import config from '../services/config';
import logger from './logger';

/**
 * Encryption utility for handling sensitive data in the multi-tenant application.
 * Uses AES-256-GCM for symmetric encryption and Argon2 for password hashing.
 */

// Constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // For GCM, 12 bytes is recommended
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Encrypts a string using AES-256-GCM
 * @param text The text to encrypt
 * @param key The encryption key (should be 32 bytes)
 * @returns The encrypted text in format: iv:salt:tag:encryptedData
 */
export function encrypt(text: string, key: string): string {
  try {
    // Generate a random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Generate a random salt
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive a key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get the authentication tag
    const tag = cipher.getAuthTag();

    // Return the IV, salt, tag, and encrypted data as a single string
    return `${iv.toString('base64')}:${salt.toString('base64')}:${tag.toString(
      'base64'
    )}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption error', { error });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts a string that was encrypted with the encrypt function
 * @param encryptedText The encrypted text in format: iv:salt:tag:encryptedData
 * @param key The encryption key (should be 32 bytes)
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string | null, key: string): string {
  if (!encryptedText) {
    throw new Error('Encrypted text is null');
  }

  try {
    // Split the encrypted text into its components
    const [ivBase64, saltBase64, tagBase64, encryptedData] = encryptedText.split(':');

    // Convert from base64
    const iv = Buffer.from(ivBase64, 'base64');
    const salt = Buffer.from(saltBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');

    // Derive the key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);

    // Set the authentication tag
    decipher.setAuthTag(tag);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption error', { error });
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hashes a password using Argon2id
 * @param password The password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MiB
      timeCost: 3, // 3 iterations
      parallelism: 1, // 1 thread
      hashLength: 32,
    });
  } catch (error) {
    logger.error('Password hashing error', { error });
    throw new Error('Failed to hash password');
  }
}

/**
 * Verifies a password against a hash
 * @param hash The hashed password
 * @param password The password to verify
 * @returns True if the password matches the hash
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    logger.error('Password verification error', { error });
    throw new Error('Failed to verify password');
  }
}

/**
 * Encrypts a database password for storage
 * @param password The database password to encrypt
 * @returns The encrypted password
 */
export function encryptDatabasePassword(password: string): string {
  const encryptionKey = getEncryptionKey();
  return encrypt(password, encryptionKey);
}

/**
 * Decrypts a database password
 * @param encryptedPassword The encrypted database password
 * @returns The decrypted password
 */
export function decryptDatabasePassword(encryptedPassword: string): string {
  const encryptionKey = getEncryptionKey();
  return decrypt(encryptedPassword, encryptionKey);
}

/**
 * Gets the encryption key from environment variables
 * @returns The encryption key
 */
function getEncryptionKey(): string {
  const key = config.encryption.key;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Ensure the key is 32 bytes (256 bits)
  if (Buffer.from(key, 'base64').length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits)`);
  }

  return key;
}

/**
 * Generates a secure random encryption key
 * @returns A base64-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Generates a secure random password
 * @param length The length of the password
 * @returns A secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}
