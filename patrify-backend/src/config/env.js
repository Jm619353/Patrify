const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const isTest = process.env.NODE_ENV === 'test';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    MONGODB_URI: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1).optional(),
    MONGODB_DB_NAME: z.string().min(1).optional(),
    DB_POOL_MAX: z.coerce.number().int().positive().default(10),

    JWT_SECRET: z.string().min(32).optional(),
    JWT_EXPIRES_IN: z.string().default('2h'),
    JWT_ISSUER: z.string().default('patrify-api'),
    JWT_AUDIENCE: z.string().default('patrify-app'),

    BASE_URL: z.string().url().default('http://localhost:3000'),
    FRONTEND_URL: z.string().url().default('http://localhost:4200'),
    CORS_ORIGINS: z.string().default('http://localhost:4200'),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_SECURE: z.enum(['true', 'false']).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),

    GOOGLE_MAPS_API_KEY: z.string().optional(),
    GOOGLE_API: z.string().optional(),

    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    UPLOAD_DIR: z.string().default('uploads'),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().default(5),

    BRASIL_API_URL: z.string().url().default('https://brasilapi.com.br/api/cnpj/v1')
  })
  .superRefine((value, ctx) => {
    if (!value.MONGODB_URI && !value.DATABASE_URL && !isTest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGODB_URI'],
        message: 'Informe MONGODB_URI ou DATABASE_URL no arquivo .env'
      });
    }

    if (!value.JWT_SECRET && !isTest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET é obrigatório (mínimo de 32 caracteres)'
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\nConfiguração de ambiente inválida:\n${details}\n`);
  process.exit(1);
}

const raw = parsed.data;
const databaseUrl =
  raw.MONGODB_URI ||
  raw.DATABASE_URL ||
  (isTest ? 'mongodb://127.0.0.1:27017/patrify_test' : 'mongodb://127.0.0.1:27017/patrify');

const resolveDbName = (uri, explicitDbName) => {
  if (explicitDbName) return explicitDbName;
  try {
    const parsedUrl = new URL(uri);
    const pathname = (parsedUrl.pathname || '').replace(/^\/+/, '').trim();
    if (pathname) return decodeURIComponent(pathname);
  } catch {
    // Fallback para nome padrão
  }
  return isTest ? 'patrify_test' : 'patrify';
};

const mongodbDbName = resolveDbName(databaseUrl, raw.MONGODB_DB_NAME);

module.exports = Object.freeze({
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest,
  databaseUrl,
  mongodbUri: databaseUrl,
  mongodbDbName,
  jwtSecret: raw.JWT_SECRET || 'test-secret-with-at-least-32-characters-long',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  googleMapsApiKey: raw.GOOGLE_MAPS_API_KEY || raw.GOOGLE_API,
  maxUploadBytes: raw.MAX_UPLOAD_MB * 1024 * 1024,
  uploadDir: path.isAbsolute(raw.UPLOAD_DIR)
    ? raw.UPLOAD_DIR
    : path.resolve(process.cwd(), raw.UPLOAD_DIR),
  emailFrom: raw.EMAIL_FROM || raw.SMTP_USER || raw.EMAIL_USER || 'no-reply@patrify.app'
});
