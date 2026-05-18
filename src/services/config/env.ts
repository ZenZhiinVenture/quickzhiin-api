/**
 * Environment Variables Loader
 *
 * This file ensures that environment variables are loaded before any other code runs.
 * It should be imported at the very beginning of your application.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const result = dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
});

if (result.error) {
  process.stderr.write(`Error loading .env file: ${result.error.message}\n`);
  process.exit(1);
}

export default result.parsed;
