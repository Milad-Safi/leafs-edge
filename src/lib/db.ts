import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function sslFromUrl(u?: string) {
  if (!u) return undefined;
  // Supabase URLs often include sslmode=require
  const needsSsl = u.includes("sslmode=require") || u.includes("ssl=true");
  return needsSsl ? { rejectUnauthorized: false } : undefined;
}

const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslFromUrl(process.env.DATABASE_URL),
    max: 5,
  });

if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
) {
  return pool.query<T>(text, params);
}
