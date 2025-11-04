// src/controllers/schedule.controller.js
import pool from '../db/connection.js';

/**
 * POST /api/schedules
 * Crea un nuevo horario (schedule) para un curso
 * El teacher_id se extrae del JWT del usuario autenticado
 */
export async function createSchedule(req, res) {
  try {
    // Extraer el ID del usuario autenticado desde el token JWT (agregado por middleware de autenticación)
    const authUserId = req.user?.id;
    
    // Verificar que el usuario esté autenticado
    if (!authUserId) {
      return res.status(401).json({ 
        error: "Unauthorized",
        message: "Usuario no autenticado" 
      });
    }

    // Extraer datos validados del body (ya validados por middleware Zod)
    const { course_id, schedule_date, start_time, end_time } = req.body;

    // 1. Verificar que el maestro existe, está activo y tiene el rol correcto
    const teacherCheck = await pool.query(
      `SELECT id, role FROM "User" WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [authUserId]
    );
    
    if (teacherCheck.rowCount === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "El maestro no existe o no está activo"
      });
    }

    // Validar que el usuario tenga el rol de 'maestro'
    if (teacherCheck.rows[0].role !== "maestro") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Solo los maestros pueden crear horarios"
      });
    }

    // 2. Verificar que el curso existe y está activo
    const courseCheck = await pool.query(
      `SELECT id, name FROM Course WHERE id = $1 LIMIT 1`,
      [course_id]
    );
    
    if (courseCheck.rowCount === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "El curso especificado no existe"
      });
    }

    // 3. Verificar que no exista un horario conflictivo para el mismo maestro
    // (mismo día, horarios que se solapan)
    const conflictCheck = await pool.query(
      `SELECT id FROM Schedule 
       WHERE teacher_id = $1 
       AND schedule_date = $2 
       AND (
         (start_time <= $3 AND end_time > $3) OR  -- El nuevo horario empieza durante un horario existente
         (start_time < $4 AND end_time >= $4) OR  -- El nuevo horario termina durante un horario existente
         (start_time >= $3 AND end_time <= $4)    -- El nuevo horario engloba un horario existente
       )
       LIMIT 1`,
      [authUserId, schedule_date, start_time, end_time]
    );
    
    if (conflictCheck.rowCount > 0) {
      return res.status(409).json({
        error: "Conflict",
        message: "Ya existe un horario programado para este maestro en el mismo día y rango de horas"
      });
    }

    // 4. Insertar el nuevo schedule en la base de datos
    const insertQuery = `
      INSERT INTO Schedule (course_id, teacher_id, schedule_date, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, course_id, teacher_id, schedule_date, start_time, end_time, created_at
    `;

    const result = await pool.query(insertQuery, [
      course_id,
      authUserId,
      schedule_date,
      start_time,
      end_time
    ]);

    // Obtener el horario recién creado
    const newSchedule = result.rows[0];

    // 5. Retornar el schedule creado (201 Created)
    return res.status(201).json({
      message: "Horario creado exitosamente",
      schedule: {
        id: newSchedule.id,
        courseId: newSchedule.course_id,
        courseName: courseCheck.rows[0].name,
        teacherId: newSchedule.teacher_id,
        scheduleDate: newSchedule.schedule_date,
        startTime: newSchedule.start_time,
        endTime: newSchedule.end_time,
        createdAt: newSchedule.created_at
      }
    });

  } catch (err) {
    // Registrar el error completo en consola para debugging
    console.error("createSchedule error:", err);
    
    // Errores de violación de constraint de base de datos (23xxx en PostgreSQL)
    if (err.code && err.code.startsWith('23')) {
      // 23503 = foreign_key_violation
      if (err.code === '23503') {
        return res.status(400).json({
          error: "Bad Request",
          message: "Referencia inválida: el curso o maestro especificado no existe"
        });
      }
      
      return res.status(400).json({
        error: "Bad Request",
        message: "Error de validación en la base de datos"
      });
    }
    
    // Error genérico del servidor (500 Internal Server Error)
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: "Ocurrió un error inesperado al crear el horario" 
    });
  }
}

/**
 * GET /api/schedules
 * Obtiene todos los horarios programados
 * Incluye información del curso y del maestro
 */
export async function getAllSchedules(req, res) {
  try {
    // Consultar todos los schedules con información relacionada
    const query = `
      SELECT 
        s.id,
        s.course_id,
        s.teacher_id,
        s.schedule_date,
        s.start_time,
        s.end_time,
        c.name as course_name,
        u.name as teacher_name,
        u.last_name as teacher_last_name
      FROM Schedule s
      INNER JOIN Course c ON c.id = s.course_id
      INNER JOIN "User" u ON u.id = s.teacher_id
      WHERE u.is_active = TRUE
        AND s.schedule_date >= CURRENT_DATE + INTERVAL '1 day'
    `;

    const result = await pool.query(query);

    // Transformar los datos al formato esperado por el frontend
    const schedules = result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      courseName: row.course_name,
      teacherId: row.teacher_id,
      teacherName: `${row.teacher_name} ${row.teacher_last_name}`.trim(),
      scheduleDate: row.schedule_date,
      startTime: row.start_time,
      endTime: row.end_time
    }));

    // Retornar la lista de schedules
    return res.status(200).json({
      message: "Horarios obtenidos exitosamente",
      count: schedules.length,
      schedules
    });

  } catch (err) {
    // Registrar el error completo en consola para debugging
    console.error("getAllSchedules error:", err);
    
    // Error genérico del servidor (500 Internal Server Error)
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: "Ocurrió un error inesperado al obtener los horarios" 
    });
  }
}

/**
 * GET /api/schedules/:courseId
 * Obtiene todos los horarios de un curso específico
 * Incluye información del curso y del maestro
 */
export async function getSchedulesByCourse(req, res) {
  try {
    // Extraer el courseId validado de los parámetros (ya validado por middleware Zod)
    const { courseId } = req.params;

    // Verificar que el curso existe
    const courseCheck = await pool.query(
      `SELECT * FROM Course WHERE id = $1 LIMIT 1`,
      [courseId]
    );
    
    if (courseCheck.rowCount === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "El curso especificado no existe"
      });
    }

    // Consultar todos los schedules del curso con información relacionada
    const query = `
      SELECT
        id,
        schedule_date,
        start_time,
        end_time
      FROM Schedule
      WHERE course_id = $1 
        AND schedule_date >= CURRENT_DATE + INTERVAL '1 day'
      ORDER BY schedule_date ASC, start_time ASC
    `;

    const result = await pool.query(query, [courseId]);

    // Transformar los datos al formato esperado por el frontend
    const schedules = result.rows.map(row => ({
      id: row.id,
      scheduleDate: row.schedule_date,
      startTime: row.start_time,
      endTime: row.end_time
    }));

    // Retornar información del curso y sus schedules
    return res.status(200).json({
      message: "Horarios del curso obtenidos exitosamente",
      count: schedules.length,
      schedules
    });

  } catch (err) {
    // Registrar el error completo en consola para debugging
    console.error("getSchedulesByCourse error:", err);
    
    // Error genérico del servidor (500 Internal Server Error)
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: "Ocurrió un error inesperado al obtener los horarios del curso" 
    });
  }
}

// ---------- IGNORAR ----------

export const getClassFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await db.query(
      `SELECT f.id, f.content, f.created_at, u.name as teacher_name
       FROM Feedback f
       JOIN "User" u ON u.id = f.teacher_id
       WHERE f.booking_id = $1
       ORDER BY f.created_at DESC`,
      [bookingId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en getClassFeedback:', err);
    res.status(500).json({ message: 'Error al obtener feedback de la clase' });
  }
};

// Add feedback for a specific class
export const addClassFeedback = async (req, res) => {
  // TODO: Implement logic to add class feedback
};

// Get the calendar (all scheduled classes)
export const getCalendar = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.schedule_date, s.start_time, s.end_time,
              c.name as course_name, u.name as teacher_name
       FROM Schedule s
       JOIN Course c ON c.id = s.course_id
       JOIN "User" u ON u.id = s.teacher_id
       ORDER BY s.schedule_date, s.start_time`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en getCalendar:', err);
    res.status(500).json({ message: 'Error al obtener calendario' });
  }
};

// Add a new class to the schedule
export const addClass = async (req, res) => {
  // TODO: Implement logic to add a class
};
