import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  API_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // S3/MinIO
  S3_ENDPOINT: z.string(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET_PHOTOS: z.string(),
  S3_BUCKET_BACKUPS: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_PUBLIC_URL: z.string(),
  S3_FORCE_PATH_STYLE: z.string().transform(val => val === 'true').default('true'),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // Stripe (optional pour l'instant)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  STRIPE_PRICE_ID_SCHOOL: z.string().optional(),

  // Email (optional pour l'instant)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Application Settings
  MAX_STUDENTS_FREE: z.string().transform(Number).default('5'),
  MAX_STUDENTS_PRO: z.string().transform(Number).default('30'),
  MAX_STUDENTS_SCHOOL: z.string().transform(Number).default('999'),
  MAX_UPLOAD_SIZE_MB: z.string().transform(Number).default('10'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

// Helper pour vérifier l'environnement
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
