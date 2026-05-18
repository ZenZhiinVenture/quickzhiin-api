import * as crypto from 'crypto';

/**
 * Shuffles a string using Fisher-Yates algorithm
 * @param str The string to shuffle
 * @returns The shuffled string
 */
function shuffleString(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
}

/**
 * Generates a secure random password
 * @param length The length of the password (default: 16)
 * @returns A secure random password
 */
export default function generateRandomPassword(length: number = 16): string {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Combine all character sets
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  // Ensure at least one character from each set
  let password = '';
  password += uppercaseChars[crypto.randomInt(uppercaseChars.length)];
  password += lowercaseChars[crypto.randomInt(lowercaseChars.length)];
  password += numberChars[crypto.randomInt(numberChars.length)];
  password += specialChars[crypto.randomInt(specialChars.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password
  return shuffleString(password);
}
