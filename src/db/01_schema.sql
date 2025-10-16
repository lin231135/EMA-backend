-- ==========================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - SISTEMA DE CLASES
-- ==========================================================
-- Incluye definición de ENUMs, tablas y llaves foráneas.
-- Diseñado para PostgreSQL.
-- ==========================================================

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
    CREATE TYPE paymentstate AS ENUM ('pendiente', 'en revision', 'solvente', 'rechazado', 'cancelado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('class_reminder', 'class_cancellation', 'payment_reminder', 'class_feedback');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'read');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
  END IF;
END $$;

-- ======================== TABLAS PRINCIPALES ================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role role NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de hijos asociados a padres
CREATE TABLE IF NOT EXISTS Kid (
  id SERIAL PRIMARY KEY,
  parent_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  birth_date VARCHAR(255) NOT NULL,
  is_solvent BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de direcciones
CREATE TABLE IF NOT EXISTS Address (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  apartment VARCHAR(100),
  street_avenue VARCHAR(100) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  house_number VARCHAR(50) NOT NULL,
  neighborhood VARCHAR(50) NOT NULL,
  municipality VARCHAR(100) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

-- Relación muchos a muchos entre usuarios y direcciones
CREATE TABLE IF NOT EXISTS User_Address (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  address_id INT NOT NULL REFERENCES Address(id) ON DELETE CASCADE
);

-- Relación muchos a muchos entre hijos y direcciones
CREATE TABLE IF NOT EXISTS Kid_Address (
  id SERIAL PRIMARY KEY,
  kid_id INT NOT NULL REFERENCES Kid(id) ON DELETE CASCADE,
  address_id INT NOT NULL REFERENCES Address(id) ON DELETE CASCADE
);

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS Course (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  modality modality NOT NULL,
  capacity INT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Relación entre maestro y curso
CREATE TABLE IF NOT EXISTS Teacher_course (
  id SERIAL PRIMARY KEY,
  teacher_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  course_id INT REFERENCES Course(id) ON DELETE SET NULL
);

-- Horarios de clases
CREATE TABLE IF NOT EXISTS Schedule (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES Course(id) ON DELETE CASCADE,
  teacher_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reservas o inscripciones de clases
CREATE TABLE IF NOT EXISTS Booking (
  id SERIAL PRIMARY KEY,
  kid_id INT NOT NULL REFERENCES Kid(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES Course(id) ON DELETE CASCADE,
  schedule_id INT NOT NULL REFERENCES Schedule(id) ON DELETE CASCADE,
  teacher_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  modality modality NOT NULL,
  status bookingstatus NOT NULL,
  booked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  note VARCHAR(255)
);

-- Tabla de libros disponibles
CREATE TABLE IF NOT EXISTS Book (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  cost FLOAT NOT NULL,
  stock INT NOT NULL,
  img_url VARCHAR(255) NOT NULL
);

-- Pagos realizados
CREATE TABLE IF NOT EXISTS Payment (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  payment_method paymentmethod NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  state paymentstate NOT NULL,
  reference_pic VARCHAR(255),
  note VARCHAR(255)
);

-- Ítems de pago (pueden ser clases o libros)
CREATE TABLE IF NOT EXISTS Payment_item (
  id SERIAL PRIMARY KEY,
  payment_id INT NOT NULL REFERENCES Payment(id) ON DELETE CASCADE,
  booking_id INT REFERENCES Booking(id) ON DELETE SET NULL,
  book_id INT REFERENCES Book(id) ON DELETE SET NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- Retroalimentación de clases (feedback de maestros)
CREATE TABLE IF NOT EXISTS Feedback (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES Booking(id) ON DELETE CASCADE,
  teacher_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notas generales de los alumnos
CREATE TABLE IF NOT EXISTS Notes (
  id SERIAL PRIMARY KEY,
  kid_id INT NOT NULL REFERENCES Kid(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla para almacenar usuarios de WhatsApp y sus preferencias
CREATE TABLE IF NOT EXISTS whatsapp_users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  language VARCHAR(2) DEFAULT 'es' CHECK (language IN ('es', 'en')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para registrar todas las interacciones
CREATE TABLE IF NOT EXISTS whatsapp_interactions (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (phone_number) REFERENCES whatsapp_users(phone_number) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_whatsapp_users_phone ON whatsapp_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_interactions_phone ON whatsapp_interactions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_interactions_created ON whatsapp_interactions(created_at DESC);

-- Comentarios
COMMENT ON TABLE whatsapp_users IS 'Usuarios que interactúan con el bot de WhatsApp';
COMMENT ON TABLE whatsapp_interactions IS 'Historial de todas las interacciones con el bot';
COMMENT ON COLUMN whatsapp_users.language IS 'Idioma preferido: es (español) o en (inglés)';

COMMIT;
