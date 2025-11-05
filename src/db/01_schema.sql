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
    CREATE TYPE role AS ENUM ('admin', 'maestro', 'padre', 'estudiante');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modality') THEN
    CREATE TYPE modality AS ENUM ('academia', 'domicilio');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookingstatus') THEN
    CREATE TYPE bookingstatus AS ENUM ('programada', 'cancelada', 'completada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentmethod') THEN
    CREATE TYPE paymentmethod AS ENUM ('efectivo', 'transferencia', 'deposito');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstate') THEN
    CREATE TYPE paymentstate AS ENUM ('pendiente', 'en revision', 'aceptado', 'rechazado', 'cancelado');
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
  profile_image VARCHAR(500),
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
  user_id INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  kid_id INT REFERENCES Kid(id) ON DELETE CASCADE,
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
  note VARCHAR(255),
  admin_note TEXT
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

-- Tabla para almacenar materiales educativos asociados a Teacher_course
CREATE TABLE IF NOT EXISTS Material (
  id SERIAL PRIMARY KEY,
  teacher_course_id INT NOT NULL REFERENCES Teacher_course(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,          -- URL pública (secure_url)
  public_id VARCHAR(255) NOT NULL,         -- ID del archivo en Cloudinary
  file_type VARCHAR(50) NOT NULL,          -- 'image', 'pdf', 'video', etc.
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_whatsapp_users_phone ON whatsapp_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_interactions_phone ON whatsapp_interactions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_interactions_created ON whatsapp_interactions(created_at DESC);

-- Comentarios
COMMENT ON TABLE whatsapp_users IS 'Usuarios que interactúan con el bot de WhatsApp';
COMMENT ON TABLE whatsapp_interactions IS 'Historial de todas las interacciones con el bot';
COMMENT ON COLUMN whatsapp_users.language IS 'Idioma preferido: es (español) o en (inglés)';

-- ======================== TRIGGERS ==========================================

-- Función que crea un Payment automáticamente cuando se crea un Booking
CREATE OR REPLACE FUNCTION create_payment_for_booking()
RETURNS TRIGGER AS $$
DECLARE
  course_cost DECIMAL(10,2);
  new_payment_id INT;
BEGIN
  -- Obtener el costo del curso
  SELECT cost INTO course_cost
  FROM Course
  WHERE id = NEW.course_id;
  
  -- Crear el Payment con estado 'pendiente'
  INSERT INTO Payment (
    user_id,
    payment_method,
    total,
    state,
    note
  ) VALUES (
    NEW.user_id,
    'efectivo',  -- Método de pago por defecto
    course_cost,
    'pendiente',  -- Estado inicial
    'Pago generado automáticamente para booking #' || NEW.id
  )
  RETURNING id INTO new_payment_id;
  
  -- Crear el Payment_item asociando el booking con el payment
  INSERT INTO Payment_item (
    payment_id,
    booking_id,
    unit_cost,
    subtotal
  ) VALUES (
    new_payment_id,
    NEW.id,
    course_cost,
    course_cost
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función después de insertar un Booking
DROP TRIGGER IF EXISTS trigger_create_payment_after_booking ON Booking;
CREATE TRIGGER trigger_create_payment_after_booking
  AFTER INSERT ON Booking
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_for_booking();

COMMIT;
