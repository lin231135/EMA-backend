import pool from "../../db/connection.js";

/**
 * Crea un nuevo booking
 * POST /api/bookings
 */
export async function createBooking(req, res) {
  const client = await pool.connect();
  
  try {
    const { kid_id, schedule_id, note, payment_method } = req.body;
    
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
      'SELECT id, cost FROM Course WHERE id = $1',
      [course_id]
    );
    
    if (courseQuery.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Course not found"
      });
    }
    
    const courseCost = courseQuery.rows[0].cost;
    
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
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    try {
      // Insertar el booking
      const insertQuery = await client.query(
        `INSERT INTO Booking (user_id, kid_id, course_id, schedule_id, teacher_id, modality, status, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, user_id, kid_id, course_id, schedule_id, teacher_id, modality, status, booked_at, note`,
        [userId, kid_id, course_id, schedule_id, teacher_id, modality, 'programada', finalNote]
      );
      
      const booking = insertQuery.rows[0];
      
      // Crear el pago asociado automáticamente
      const paymentQuery = await client.query(
        `INSERT INTO Payment (user_id, payment_method, total, state, note)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, payment_method, total, payment_date, state, reference_pic, note, admin_note`,
        [userId, payment_method, courseCost, 'pendiente', `Pago automático para booking #${booking.id}`]
      );
      
      const payment = paymentQuery.rows[0];
      
      // Commit de la transacción
      await client.query('COMMIT');
      
      return res.status(201).json({
        ok: true,
        data: {
          booking,
          payment
        }
      });
      
    } catch (transactionErr) {
      // Rollback en caso de error
      await client.query('ROLLBACK');
      throw transactionErr;
    }
    
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

/**
 * Obtiene todos los bookings del usuario autenticado
 * GET /api/bookings
 */
export async function getUserBookings(req, res) {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    
    // Obtener todos los bookings del usuario con información relevante
    const query = `
      SELECT 
        b.id,
        b.kid_id,
        b.status,
        b.modality,
        b.note,
        c.name as course_name,
        s.schedule_date,
        s.start_time,
        s.end_time,
        t.name as teacher_name,
        t.last_name as teacher_last_name,
        t.phone as teacher_phone
      FROM Booking b
      INNER JOIN Course c ON b.course_id = c.id
      INNER JOIN Schedule s ON b.schedule_id = s.id
      INNER JOIN "User" t ON b.teacher_id = t.id
      WHERE b.user_id = $1
      ORDER BY s.schedule_date DESC, s.start_time DESC
    `;
    
    const result = await client.query(query, [userId]);
    
    const bookings = result.rows.map(row => ({
      id: row.id,
      kid_id: row.kid_id,
      status: row.status,
      modality: row.modality,
      note: row.note,
      course_name: row.course_name,
      schedule_date: row.schedule_date,
      start_time: row.start_time,
      end_time: row.end_time,
      teacher_name: row.teacher_name,
      teacher_last_name: row.teacher_last_name,
      teacher_phone: row.teacher_phone
    }));
    
    return res.status(200).json({
      ok: true,
      data: bookings
    });
    
  } catch (err) {
    console.error("[getUserBookings] error:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  } finally {
    client.release();
  }
}

/**
 * Obtiene un booking por ID con toda la información relacionada
 * GET /api/bookings/:id
 */
export async function getBookingById(req, res) {
  const client = await pool.connect();
  
  try {
    const bookingId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Obtener el booking con toda la información relacionada
    const query = `
      SELECT 
        b.id,
        b.user_id,
        b.kid_id,
        b.course_id,
        b.schedule_id,
        b.teacher_id,
        b.modality,
        b.status,
        b.booked_at,
        b.note,
        -- Información del usuario (padre)
        u.name as parent_name,
        u.last_name as parent_last_name,
        u.email as parent_email,
        u.phone as parent_phone,
        -- Información del hijo (si aplica)
        k.name as kid_name,
        k.birth_date as kid_birth_date,
        -- Información del curso
        c.name as course_name,
        c.cost as course_cost,
        c.capacity as course_capacity,
        -- Información del horario
        s.schedule_date,
        s.start_time,
        s.end_time,
        -- Información del maestro
        t.name as teacher_name,
        t.last_name as teacher_last_name,
        t.email as teacher_email,
        t.phone as teacher_phone,
        t.profile_image as teacher_profile_image,
        -- Información del pago asociado
        p.id as payment_id,
        p.payment_method,
        p.total as payment_total,
        p.payment_date,
        p.state as payment_state,
        p.reference_pic as payment_reference_pic,
        p.note as payment_note,
        -- Feedback (si existe)
        f.id as feedback_id,
        f.content as feedback_content,
        f.created_at as feedback_created_at
      FROM Booking b
      INNER JOIN "User" u ON b.user_id = u.id
      LEFT JOIN Kid k ON b.kid_id = k.id
      INNER JOIN Course c ON b.course_id = c.id
      INNER JOIN Schedule s ON b.schedule_id = s.id
      INNER JOIN "User" t ON b.teacher_id = t.id
      LEFT JOIN Payment p ON p.user_id = b.user_id 
        AND p.note LIKE '%booking #' || b.id || '%'
      LEFT JOIN Feedback f ON f.booking_id = b.id
      WHERE b.id = $1
    `;
    
    const result = await client.query(query, [bookingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Booking not found"
      });
    }
    
    const row = result.rows[0];
    
    // Validar que el booking pertenece al usuario autenticado
    // (o que el usuario es admin/maestro - según tu lógica de negocio)
    const userRole = req.user.role;
    if (userRole === 'padre' && row.user_id !== userId) {
      return res.status(403).json({
        ok: false,
        error: "You don't have permission to view this booking"
      });
    }
    
    // Estructurar la respuesta de forma legible
    const bookingData = {
      id: row.id,
      status: row.status,
      modality: row.modality,
      booked_at: row.booked_at,
      note: row.note,
      parent: {
        id: row.user_id,
        name: row.parent_name,
        last_name: row.parent_last_name,
        email: row.parent_email,
        phone: row.parent_phone
      },
      kid: row.kid_id ? {
        id: row.kid_id,
        name: row.kid_name,
        birth_date: row.kid_birth_date
      } : null,
      course: {
        id: row.course_id,
        name: row.course_name,
        cost: row.course_cost,
        capacity: row.course_capacity
      },
      schedule: {
        id: row.schedule_id,
        date: row.schedule_date,
        start_time: row.start_time,
        end_time: row.end_time
      },
      teacher: {
        id: row.teacher_id,
        name: row.teacher_name,
        last_name: row.teacher_last_name,
        email: row.teacher_email,
        phone: row.teacher_phone,
        profile_image: row.teacher_profile_image
      },
      payment: row.payment_id ? {
        id: row.payment_id,
        method: row.payment_method,
        total: row.payment_total,
        date: row.payment_date,
        state: row.payment_state,
        reference_pic: row.payment_reference_pic,
        note: row.payment_note
      } : null,
      feedback: row.feedback_id ? {
        id: row.feedback_id,
        content: row.feedback_content,
        created_at: row.feedback_created_at
      } : null
    };
    
    return res.status(200).json({
      ok: true,
      data: bookingData
    });
    
  } catch (err) {
    console.error("[getBookingById] error:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  } finally {
    client.release();
  }
}

export default { createBooking, getUserBookings, getBookingById };
