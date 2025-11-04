import pool from "../../db/connection.js";

/**
 * Crea un nuevo booking
 * POST /api/bookings
 */
export async function createBooking(req, res) {
  const client = await pool.connect();
  
  try {
    const { kid_id, schedule_id, note } = req.body;
    
    // user_id siempre se toma del JWT
    const userId = req.user.id;
    
    // Validar que el usuario existe
    const userQuery = await client.query(
      'SELECT id FROM "User" WHERE id = $1',
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "User not found"
      });
    }
    
    // Si kid_id viene en el body, validar que existe y que pertenece al usuario
    if (kid_id) {
      const kidQuery = await client.query(
        'SELECT id, parent_id FROM Kid WHERE id = $1',
        [kid_id]
      );
      
      if (kidQuery.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: "Kid not found"
        });
      }
      
      // Validar que el kid pertenece al usuario del JWT
      if (kidQuery.rows[0].parent_id !== userId) {
        return res.status(403).json({
          ok: false,
          error: "Kid does not belong to the authenticated user"
        });
      }
    }
    
    // Validar que el schedule existe y obtener course_id, teacher_id y modality
    const scheduleQuery = await client.query(
      `SELECT s.course_id, s.teacher_id, c.modality 
       FROM Schedule s
       INNER JOIN Course c ON s.course_id = c.id
       WHERE s.id = $1`,
      [schedule_id]
    );
    
    if (scheduleQuery.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Schedule not found"
      });
    }
    
    const { course_id, teacher_id, modality } = scheduleQuery.rows[0];
    
    // Validar que el teacher existe
    const teacherQuery = await client.query(
      'SELECT id FROM "User" WHERE id = $1 AND role = $2',
      [teacher_id, 'maestro']
    );
    
    if (teacherQuery.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Teacher not found"
      });
    }
    
    // Validar que el course existe
    const courseQuery = await client.query(
      'SELECT id FROM Course WHERE id = $1',
      [course_id]
    );
    
    if (courseQuery.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Course not found"
      });
    }
    
    // Validar que el schedule no esté ya reservado (status programada o completada)
    const existingBookingQuery = await client.query(
      'SELECT id FROM Booking WHERE schedule_id = $1 AND status IN ($2, $3)',
      [schedule_id, 'programada', 'completada']
    );
    
    if (existingBookingQuery.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Schedule is already booked"
      });
    }
    
    // Crear el booking
    const finalNote = note && note.trim() !== "" ? note : null;
    
    const insertQuery = await client.query(
      `INSERT INTO Booking (user_id, kid_id, course_id, schedule_id, teacher_id, modality, status, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, kid_id, course_id, schedule_id, teacher_id, modality, status, booked_at, note`,
      [userId, kid_id, course_id, schedule_id, teacher_id, modality, 'programada', finalNote]
    );
    
    const booking = insertQuery.rows[0];
    
    return res.status(201).json({
      ok: true,
      data: booking
    });
    
  } catch (err) {
    console.error("[createBooking] error:", err);
    
    // Error de validación de foreign key
    if (err.code === '23503') {
      return res.status(400).json({
        ok: false,
        error: "Invalid reference to related entity"
      });
    }
    
    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  } finally {
    client.release();
  }
}

export default { createBooking };
