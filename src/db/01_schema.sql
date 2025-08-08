-- ============================================================================
-- 01_schema.sql  |  Ellie's Music Academy - FULL schema (base)
-- ============================================================================
BEGIN;

-- ======================== ENUMS =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE role AS ENUM ('admin', 'maestro', 'padre');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modality') THEN
    CREATE TYPE modality AS ENUM ('academia', 'domicilio');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookingstatus') THEN
    CREATE TYPE bookingstatus AS ENUM ('programada', 'cancelada', 'completada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentmethod') THEN
    CREATE TYPE paymentmethod AS ENUM ('efectivo', 'transferencia');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstate') THEN
    CREATE TYPE paymentstate AS ENUM ('pendiente', 'solvente', 'cancelado');
  END IF;
END $$;

-- ======================== TABLAS ============================================

-- Usuarios
CREATE TABLE IF NOT EXISTS "User" (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  last_name    VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  phone        VARCHAR(20)  NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         role NOT NULL,                   -- 'admin' | 'maestro' | 'padre'
  description  TEXT,                            -- solo maestros
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Direcciones
CREATE TABLE IF NOT EXISTS Address (
  id            SERIAL PRIMARY KEY,
  user_id       INT REFERENCES "User"(id) ON DELETE CASCADE,
  address_line  VARCHAR(255),
  city          VARCHAR(100),
  zone          VARCHAR(50),
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE
);

-- Hijos
CREATE TABLE IF NOT EXISTS Kid (
  id          SERIAL PRIMARY KEY,
  parent_id   INT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  name        VARCHAR(255) NOT NULL,
  birth_date  DATE NOT NULL,
  is_solvent  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cursos
CREATE TABLE IF NOT EXISTS Course (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  teacher_id  INT REFERENCES "User"(id) ON DELETE RESTRICT,
  modality    modality NOT NULL DEFAULT 'academia',
  capacity    INT NOT NULL DEFAULT 1,
  cost        NUMERIC(10,2) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_course_capacity CHECK (capacity BETWEEN 1 AND 5)
);

-- Horarios
CREATE TABLE IF NOT EXISTS Schedule (
  id             SERIAL PRIMARY KEY,
  course_id      INT NOT NULL REFERENCES Course(id) ON DELETE CASCADE,
  teacher_id     INT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  schedule_date  DATE NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schedule_time_order CHECK (end_time > start_time)
);

-- Reservas
CREATE TABLE IF NOT EXISTS Booking (
  id           SERIAL PRIMARY KEY,
  kid_id       INT NOT NULL REFERENCES Kid(id) ON DELETE RESTRICT,
  course_id    INT NOT NULL REFERENCES Course(id) ON DELETE RESTRICT,
  schedule_id  INT NOT NULL REFERENCES Schedule(id) ON DELETE RESTRICT,
  teacher_id   INT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  modality     modality NOT NULL,
  status       bookingstatus NOT NULL DEFAULT 'programada',
  booked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note         VARCHAR(255)
);

-- Feedback
CREATE TABLE IF NOT EXISTS Feedback (
  id          SERIAL PRIMARY KEY,
  booking_id  INT NOT NULL REFERENCES Booking(id) ON DELETE CASCADE,
  teacher_id  INT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  content     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pagos
CREATE TABLE IF NOT EXISTS Payment (
  id             SERIAL PRIMARY KEY,
  payer_id       INT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  payment_method paymentmethod NOT NULL,
  total          NUMERIC(10,2) NOT NULL,
  payment_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  state          paymentstate NOT NULL DEFAULT 'pendiente',
  reference_pic  VARCHAR(255),
  note           VARCHAR(255)
);

-- Detalle de pago
CREATE TABLE IF NOT EXISTS Payment_item (
  id          SERIAL PRIMARY KEY,
  payment_id  INT NOT NULL REFERENCES Payment(id) ON DELETE CASCADE,
  booking_id  INT NOT NULL REFERENCES Booking(id) ON DELETE RESTRICT,
  unit_cost   NUMERIC(10,2),
  subtotal    NUMERIC(10,2)
);

COMMIT;