-- ============================================================================
-- 02_normalization.sql  |  Reglas de integridad y normalización
-- ============================================================================
BEGIN;

-- Email único case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_email_lower ON "User"(LOWER(email));

-- Única dirección primaria por usuario
CREATE UNIQUE INDEX IF NOT EXISTS ux_address_primary_per_user
  ON Address (user_id) WHERE is_primary = TRUE;

-- No permitir reservas duplicadas del mismo niño en el mismo horario
ALTER TABLE Booking
  ADD CONSTRAINT IF NOT EXISTS uq_booking_kid_schedule UNIQUE (kid_id, schedule_id);

-- Evitar slots idénticos por curso y fecha
ALTER TABLE Schedule
  ADD CONSTRAINT IF NOT EXISTS uq_schedule_slot UNIQUE (course_id, schedule_date, start_time, end_time);

-- Duración positiva (extra a time_order)
ALTER TABLE Schedule
  ADD CONSTRAINT IF NOT EXISTS chk_schedule_positive_duration
  CHECK ((EXTRACT(EPOCH FROM (end_time - start_time))) > 0);

-- -------- Triggers de consistencia --------

-- Asegurar que teacher_id sea un 'maestro'
CREATE OR REPLACE FUNCTION ensure_teacher_role()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r role;
BEGIN
  SELECT role INTO r FROM "User" WHERE id = NEW.teacher_id;
  IF r IS DISTINCT FROM 'maestro' THEN
    RAISE EXCEPTION 'teacher_id % no es maestro (rol=%)', NEW.teacher_id, r;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_course_teacher_role ON Course;
CREATE TRIGGER trg_course_teacher_role
BEFORE INSERT OR UPDATE ON Course
FOR EACH ROW EXECUTE FUNCTION ensure_teacher_role();

DROP TRIGGER IF EXISTS trg_schedule_teacher_role ON Schedule;
CREATE TRIGGER trg_schedule_teacher_role
BEFORE INSERT OR UPDATE ON Schedule
FOR EACH ROW EXECUTE FUNCTION ensure_teacher_role();

DROP TRIGGER IF EXISTS trg_booking_teacher_role ON Booking;
CREATE TRIGGER trg_booking_teacher_role
BEFORE INSERT OR UPDATE ON Booking
FOR EACH ROW EXECUTE FUNCTION ensure_teacher_role();

-- Consistencia de Booking con Schedule y Course
CREATE OR REPLACE FUNCTION ensure_booking_consistency()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s_course INT; s_teacher INT; c_mod modality;
BEGIN
  SELECT course_id, teacher_id INTO s_course, s_teacher FROM Schedule WHERE id = NEW.schedule_id;
  IF s_course IS DISTINCT FROM NEW.course_id THEN
    RAISE EXCEPTION 'course_id en Booking no coincide con Schedule (% vs %)', NEW.course_id, s_course;
  END IF;
  IF s_teacher IS DISTINCT FROM NEW.teacher_id THEN
    RAISE EXCEPTION 'teacher_id en Booking no coincide con Schedule (% vs %)', NEW.teacher_id, s_teacher;
  END IF;

  SELECT modality INTO c_mod FROM Course WHERE id = NEW.course_id;
  IF NEW.modality IS DISTINCT FROM c_mod THEN
    RAISE EXCEPTION 'modality en Booking % no coincide con Course %', NEW.modality, c_mod;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_booking_consistency ON Booking;
CREATE TRIGGER trg_booking_consistency
BEFORE INSERT OR UPDATE ON Booking
FOR EACH ROW EXECUTE FUNCTION ensure_booking_consistency();

COMMIT;