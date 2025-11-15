import pg from 'pg';
const { Client } = pg;

const ddl = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE role AS ENUM ('admin', 'maestro', 'padre');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modality') THEN
    CREATE TYPE modality AS ENUM ('presencial', 'en linea');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pendiente', 'aceptado', 'rechazado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'deposito');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('programada', 'completada', 'cancelada');
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

CREATE TABLE IF NOT EXISTS Kid(
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Course(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  modality modality NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Schedule(
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES Course(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Booking(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  kid_id INTEGER REFERENCES Kid(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES Course(id) ON DELETE CASCADE,
  schedule_id INTEGER NOT NULL REFERENCES Schedule(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  modality modality NOT NULL,
  status booking_status NOT NULL DEFAULT 'programada',
  booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE TABLE IF NOT EXISTS Payment(
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pendiente',
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE TABLE IF NOT EXISTS Payment_item(
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES Payment(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES Booking(id) ON DELETE CASCADE,
  book_id INTEGER,
  amount NUMERIC(10,2) NOT NULL
);
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
  await client.query(`
    TRUNCATE TABLE 
      Payment_item,
      Payment,
      Booking,
      Schedule,
      Course,
      Kid,
      "User"
    RESTART IDENTITY CASCADE;
  `);
  await client.end();
}