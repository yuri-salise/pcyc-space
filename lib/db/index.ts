import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Singleton database connection pool for PostgreSQL (Supabase).
 * Uses Postgres.js with connection pooling in serverless environments.
 */
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

declare global {
  // eslint-disable-next-line no-var
  var _postgresClient: postgres.Sql | undefined;
}

const poolMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10;

// Disable prefetch as it is not supported for "Transaction" pool mode in Supabase
export const client =
  globalThis._postgresClient ??
  postgres(connectionString, {
    prepare: false,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
    max: poolMax,
    idle_timeout: 15,
    connect_timeout: 10,
  });

if (!globalThis._postgresClient) {
  globalThis._postgresClient = client;
}

export const db = drizzle(client, { schema });
export type DB = typeof db;

