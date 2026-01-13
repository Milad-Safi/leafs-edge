// Shared PostgresSQL connection + query helper 

import { Pool, type QueryResultRow } from "pg";

// Stores the pool on the global object 
declare global {
  var __pgPool: Pool | undefined;
}

// Reads  database url and decides if SSL should be enabled
function sslFromUrl(u?: string) {
  if (!u) return undefined;

  const needsSsl = u.includes("sslmode=require") || u.includes("ssl=true");
  return needsSsl ? { rejectUnauthorized: false } : undefined;
}

// Reuse the existing pool in development if it already exists,
// else create a new pool using DATABASE_URL (in .env)
const pool =
  global.__pgPool ??

  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslFromUrl(process.env.DATABASE_URL),
    max: 5,
  });

// Save pool globally in development 
if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

// Runs a parameterized SQL query using the shared pool
export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
) {
  // Returns rows and metadata from pg
  return pool.query<T>(text, params);
}

