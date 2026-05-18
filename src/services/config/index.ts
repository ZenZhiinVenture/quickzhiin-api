/**
 * Application configuration
 *
 * Centralizes all environment variables with Zod runtime validation.
 */
import { z } from 'zod';

const dbSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().default(5432),
  user: z.string().default('postgres'),
  password: z.string().default(''),
  database: z.string().default('quickzhiin'),
  url: z.string().default('postgresql://postgres:password@localhost:5432/quickzhiin'),
});

const serverSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  apiPrefix: z.string().default('/api'),
  corsOrigin: z.string().default('*'),
  publicUrl: z.string().default('http://localhost:3000'),
});

const jwtSchema = z.object({
  secret: z.string().min(1, 'JWT secret is required'),
  expiresIn: z.string().default('1d'),
  refreshExpiresIn: z.string().default('7d'),
});

const encryptionSchema = z.object({
  key: z.string().min(1, 'Encryption key is required'),
  algorithm: z.string().default('aes-256-gcm'),
});

const emailSchema = z.object({
  host: z.string().default('smtp.example.com'),
  port: z.coerce.number().default(587),
  secure: z.coerce.boolean().default(false),
  auth: z.object({
    user: z.string().default(''),
    pass: z.string().default(''),
  }),
  from: z.string().default('noreply@quickzhiin.com'),
});

const storageSchema = z.object({
  provider: z.enum(['local', 's3']).default('local'),
  localPath: z.string().default('./uploads'),
  s3Bucket: z.string().default(''),
  s3Region: z.string().default(''),
  s3AccessKey: z.string().default(''),
  s3SecretKey: z.string().default(''),
});

const loggingSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  format: z.enum(['json', 'text']).default('json'),
});

const featureFlagsSchema = z.object({
  enableAuditLogs: z.coerce.boolean().default(true),
  enableRateLimiting: z.coerce.boolean().default(true),
});

const configSchema = z.object({
  db: dbSchema,
  server: serverSchema,
  jwt: jwtSchema,
  encryption: encryptionSchema,
  email: emailSchema,
  storage: storageSchema,
  logging: loggingSchema,
  features: featureFlagsSchema,
});

const parseConfig = () => {
  try {
    const dbConfig = dbSchema.parse({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      url: process.env.DATABASE_URL,
    });

    const serverConfig = serverSchema.parse({
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      apiPrefix: process.env.API_PREFIX,
      corsOrigin: process.env.CORS_ORIGIN,
      publicUrl: process.env.PUBLIC_URL,
    });

    const jwtConfig = jwtSchema.parse({
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    const encryptionConfig = encryptionSchema.parse({
      key: process.env.ENCRYPTION_KEY,
      algorithm: process.env.ENCRYPTION_ALGORITHM,
    });

    const emailConfig = emailSchema.parse({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      from: process.env.EMAIL_FROM,
    });

    const storageConfig = storageSchema.parse({
      provider: process.env.STORAGE_PROVIDER,
      localPath: process.env.STORAGE_LOCAL_PATH,
      s3Bucket: process.env.S3_BUCKET,
      s3Region: process.env.S3_REGION,
      s3AccessKey: process.env.S3_ACCESS_KEY,
      s3SecretKey: process.env.S3_SECRET_KEY,
    });

    const loggingConfig = loggingSchema.parse({
      level: process.env.LOG_LEVEL,
      format: process.env.LOG_FORMAT,
    });

    const featureFlags = featureFlagsSchema.parse({
      enableAuditLogs: process.env.ENABLE_AUDIT_LOGS,
      enableRateLimiting: process.env.ENABLE_RATE_LIMITING,
    });

    return configSchema.parse({
      db: dbConfig,
      server: serverConfig,
      jwt: jwtConfig,
      encryption: encryptionConfig,
      email: emailConfig,
      storage: storageConfig,
      logging: loggingConfig,
      features: featureFlags,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      process.stderr.write('Configuration validation error:\n');
      error.errors.forEach((err: z.ZodIssue) => {
        process.stderr.write(`- ${err.path.join('.')}: ${err.message}\n`);
      });
    } else {
      process.stderr.write('Unexpected error parsing configuration.\n');
    }
    process.exit(1);
  }
};

const config = parseConfig();

export const {
  db: dbConfig,
  server: serverConfig,
  jwt: jwtConfig,
  encryption: encryptionConfig,
  email: emailConfig,
  storage: storageConfig,
  logging: loggingConfig,
  features: featureFlags,
} = config;

export default config;
