import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(),
  EMAIL_FROM: z.string().default('PCYC Space <notifications@pcyc.ph>'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 'http://localhost:3000';
      const trimmed = val.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
      }
      return trimmed;
    }),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/**
 * Validates process.env against server & client schemas.
 * Throws a descriptive error at startup if required variables are invalid.
 */
function validateEnv() {
  const isServer = typeof window === 'undefined';

  const clientResult = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!clientResult.success) {
    console.error('❌ Invalid client environment variables:', clientResult.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  if (isServer) {
    const serverResult = serverSchema.safeParse(process.env);
    if (!serverResult.success) {
      console.error('❌ Invalid server environment variables:', serverResult.error.flatten().fieldErrors);
      throw new Error('Invalid server environment variables');
    }
    return { ...clientResult.data, ...serverResult.data };
  }

  return clientResult.data as z.infer<typeof clientSchema> & Partial<z.infer<typeof serverSchema>>;
}

export const env = validateEnv();
