import pg from 'pg';
const { Client } = pg;

const ddl = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE role AS ENUM ('admin', 'maestro', 'padre');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "User"(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role role NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_email_lower ON "User"(LOWER(email));
`;

function makeClient() {
  return new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'elliesdb_test'
  });
}

export async function setupDB() {
  const client = makeClient();
  await client.connect();
  await client.query(ddl);
  await client.end();
}

export async function truncateAll() {
  const client = makeClient();
  await client.connect();
  await client.query('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;');
  await client.end();
}