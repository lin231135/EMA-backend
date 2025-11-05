// src/controllers/teacher/teacher.controller.js
import db from '../../db/connection.js';

/**
 * Utilidad: obtiene el id de maestro desde el JWT
 */
function getTeacherId(req) {
  // Ajusta si tu JWT guarda otro campo
  return req.user?.id || null;
}

/**
 * GET /teacher/courses  (alias de /teacher/dashboard)
 * Lista de cursos que imparte el maestro autenticado, con métricas básicas.
 * Responde: { items: [ { id, name, modality, capacity, cost, studentsCount, widget? } ] }
 */
export const getCourses = async (req, res) => {
  const teacherId = getTeacherId(req);
  if (!teacherId) return res.status(401).json({ message: 'No autorizado' });

  try {
    // Cursos impartidos por el maestro
    const qCourses = `
      SELECT
        c.id,
        c.name,
        c.modality,
        c.capacity,
        c.cost
      FROM Teacher_course tc
      JOIN Course c ON c.id = tc.course_id
      WHERE tc.teacher_id = $1
      ORDER BY c.name ASC;
    `;
    const { rows: courses } = await db.query(qCourses, [teacherId]);

    // Conteo de estudiantes por curso (distinct kids con reservas con este maestro)
    const qCounts = `
      SELECT
        b.course_id,
        COUNT(DISTINCT b.kid_id) AS students_count
      FROM Booking b
      WHERE b.teacher_id = $1
      GROUP BY b.course_id;
    `;
    const { rows: counts } = await db.query(qCounts, [teacherId]);
    const mapCounts = new Map(counts.map(r => [Number(r.course_id), Number(r.students_count)]));

    // (Opcional) Si algún día guardas configuración de widget por curso/maestro,
    // puedes crear una tabla Teacher_course_widget y hacer LEFT JOIN aquí.
    // Por ahora, devolvemos sin widget y el frontend usa defaults.

    const items = courses.map(c => ({
      id: c.id,
      name: c.name,
      modality: c.modality,
      capacity: c.capacity,
      cost: Number(c.cost),
      studentsCount: mapCounts.get(Number(c.id)) || 0,
      // widget: null // si en el futuro guardas config, hidrátalo aquí
    }));

    return res.json({ items });
  } catch (err) {
    console.error('getCourses error:', err);
    return res.status(500).json({ message: 'Error al obtener cursos del maestro' });
  }
};

/**
 * GET /teacher/calendar/today-classes
 * Clases (schedules) del día para el maestro autenticado.
 * Responde: { items: [ { scheduleId, courseId, courseName, startTime, endTime } ] }
 */
export const getTodayClasses = async (req, res) => {
  const teacherId = getTeacherId(req);
  if (!teacherId) return res.status(401).json({ message: 'No autorizado' });

  try {
    const q = `
      SELECT
        s.id           AS schedule_id,
        s.course_id    AS course_id,
        c.name         AS course_name,
        s.schedule_date,
        s.start_time,
        s.end_time
      FROM Schedule s
      JOIN Course c ON c.id = s.course_id
      WHERE s.teacher_id = $1
        AND s.schedule_date = CURRENT_DATE
      ORDER BY s.start_time ASC;
    `;
    const { rows } = await db.query(q, [teacherId]);

    const items = rows.map(r => ({
      scheduleId: Number(r.schedule_id),
      courseId: Number(r.course_id),
      courseName: r.course_name,
      date: r.schedule_date,            // YYYY-MM-DD
      startTime: r.start_time,          // HH:MM:SS
      endTime: r.end_time,              // HH:MM:SS
    }));

    return res.json({ items });
  } catch (err) {
    console.error('getTodayClasses error:', err);
    return res.status(500).json({ message: 'Error al obtener clases de hoy' });
  }
};

/**
 * GET /teacher/courses/:courseId/students
 * Lista alumnos (Kid) + padre/tutor (User) asignados al curso impartido por el maestro autenticado.
 * Responde: { courseId, teacherId, items: [ { kid:{...}, parent:{...}, stats:{...} } ] }
 */
export const getCourseStudents = async (req, res) => {
  const teacherId = getTeacherId(req);
  const { courseId } = req.params;

  if (!teacherId) return res.status(401).json({ message: 'No autorizado' });
  if (!courseId || isNaN(Number(courseId))) {
    return res.status(400).json({ message: 'courseId inválido' });
  }

  try {
    // Validar que el maestro imparte el curso
    const check = await db.query(
      `SELECT 1 FROM Teacher_course WHERE teacher_id = $1 AND course_id = $2 LIMIT 1`,
      [teacherId, Number(courseId)]
    );
    if (check.rowCount === 0) {
      return res.status(403).json({ message: 'No impartes este curso' });
    }

    // Traer alumnos (kids) + padre/tutor desde reservas del curso con este maestro
    const q = `
      SELECT
        b.kid_id,
        k.name               AS kid_name,
        k.birth_date,
        k.is_solvent,
        b.user_id            AS parent_id,
        (u.name || ' ' || u.last_name) AS parent_name,
        u.email              AS parent_email,
        u.phone              AS parent_phone,
        MIN(b.booked_at)     AS first_booking_at,
        MAX(b.booked_at)     AS last_booking_at,
        COUNT(*) FILTER (WHERE b.status = 'programada') AS scheduled_count,
        COUNT(*) FILTER (WHERE b.status = 'cancelada')  AS canceled_count
      FROM Booking b
      JOIN Kid k     ON k.id = b.kid_id
      JOIN "User" u  ON u.id = b.user_id
      WHERE b.teacher_id = $1
        AND b.course_id  = $2
      GROUP BY b.kid_id, k.name, k.birth_date, k.is_solvent,
               b.user_id, u.name, u.last_name, u.email, u.phone
      ORDER BY k.name ASC;
    `;
    const { rows } = await db.query(q, [teacherId, Number(courseId)]);

    return res.json({
      courseId: Number(courseId),
      teacherId,
      items: rows.map(r => ({
        kid: {
          id: Number(r.kid_id),
          name: r.kid_name,
          birthDate: r.birth_date,
          isSolvent: r.is_solvent,
        },
        parent: {
          id: Number(r.parent_id),
          name: r.parent_name,
          email: r.parent_email,
          phone: r.parent_phone,
        },
        stats: {
          firstBookingAt: r.first_booking_at,
          lastBookingAt: r.last_booking_at,
          scheduledCount: Number(r.scheduled_count || 0),
          canceledCount: Number(r.canceled_count || 0),
        }
      }))
    });
  } catch (err) {
    console.error('getCourseStudents error:', err);
    return res.status(500).json({ message: 'Error al obtener estudiantes del curso' });
  }
};