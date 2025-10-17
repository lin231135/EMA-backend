BEGIN;

-- =========================
-- Schedules NUEVOS (HOY y próximos días)
-- Nota: usamos CTEs para capturar los IDs generados y usarlos en Booking
-- Cursos y maestros compatibles (según Teacher_course):
--   (1,7) Piano - Miguel Ángel
--   (2,9) Canto  - Ricardo Fernández
--   (3,10) Estimulación n1 - Elena Morales
-- =========================
WITH
s_hoy_1 AS (
  INSERT INTO Schedule (course_id, teacher_id, schedule_date, start_time, end_time)
  VALUES (1, 7, CURRENT_DATE, '10:00:00', '11:00:00')
  RETURNING id
),
s_hoy_2 AS (
  INSERT INTO Schedule (course_id, teacher_id, schedule_date, start_time, end_time)
  VALUES (2, 9, CURRENT_DATE, '11:30:00', '12:30:00')
  RETURNING id
),
s_hoy_3 AS (
  INSERT INTO Schedule (course_id, teacher_id, schedule_date, start_time, end_time)
  VALUES (3, 10, CURRENT_DATE, '16:00:00', '17:00:00')
  RETURNING id
),
s_manana AS (
  INSERT INTO Schedule (course_id, teacher_id, schedule_date, start_time, end_time)
  VALUES (1, 7, CURRENT_DATE + INTERVAL '1 day', '10:00:00', '11:00:00')
  RETURNING id
),
s_pasado AS (
  INSERT INTO Schedule (course_id, teacher_id, schedule_date, start_time, end_time)
  VALUES (2, 9, CURRENT_DATE + INTERVAL '2 day', '11:30:00', '12:30:00')
  RETURNING id
)

-- =========================
-- Bookings para los hijos del parent_id = 27
--  - 3 clases HOY (kids 1,2,3)
--  - 2 clases PRÓXIMOS DÍAS (kid 17 mañana; kid 1 en 2 días)
-- =========================
INSERT INTO Booking (kid_id, course_id, schedule_id, teacher_id, modality, status, booked_at, note)
SELECT 1, 1, s.id, 7,  'academia'::modality, 'programada'::bookingstatus, NOW(), 'Clase HOY (Diego)'
FROM s_hoy_1 s
UNION ALL
SELECT 2, 2, s.id, 9,  'academia'::modality, 'programada'::bookingstatus, NOW(), 'Clase HOY (Valeria)'
FROM s_hoy_2 s
UNION ALL
SELECT 3, 3, s.id, 10, 'academia'::modality, 'programada'::bookingstatus, NOW(), 'Clase HOY (Santiago)'
FROM s_hoy_3 s
UNION ALL
SELECT 17, 1, s.id, 7, 'academia'::modality, 'programada'::bookingstatus, NOW(), 'Clase mañana (Juan)'
FROM s_manana s
UNION ALL
SELECT 1, 2, s.id, 9, 'academia'::modality, 'programada'::bookingstatus, NOW(), 'Clase en 2 días (Diego)'
FROM s_pasado s
;

COMMIT;