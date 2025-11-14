// src/controllers/admin/bookings.controller.js
import db from '../../db/connection.js';

/**
 * Obtiene los bookings sin pagar de los hijos de un padre específico
 * GET /api/admins/bookings/unpaid?parent_id=X
 */
export const getUnpaidBookingsByParent = async (req, res) => {
  try {
    const { parent_id } = req.query;

    if (!parent_id) {
      return res.status(400).json({ error: 'parent_id es requerido' });
    }

    // Obtener bookings que no tienen payment_item (no están pagados)
    const query = `
      SELECT 
        b.id as booking_id,
        b.kid_id,
        k.name as student_name,
        b.course_id,
        c.name as course_name,
        c.cost,
        b.modality,
        b.status,
        s.schedule_date,
        s.start_time,
        s.end_time
      FROM Booking b
      JOIN Kid k ON b.kid_id = k.id
      JOIN Course c ON b.course_id = c.id
      LEFT JOIN Schedule s ON b.schedule_id = s.id
      WHERE k.parent_id = $1
        AND b.status = 'programada'
        AND b.id NOT IN (
          SELECT booking_id 
          FROM Payment_item 
          WHERE booking_id IS NOT NULL
        )
      ORDER BY k.name, s.schedule_date;
    `;

    const result = await db.query(query, [parent_id]);

    // Agrupar por estudiante
    const bookingsByStudent = {};
    result.rows.forEach(row => {
      if (!bookingsByStudent[row.kid_id]) {
        bookingsByStudent[row.kid_id] = {
          kid_id: row.kid_id,
          student_name: row.student_name,
          bookings: []
        };
      }
      bookingsByStudent[row.kid_id].bookings.push({
        booking_id: row.booking_id,
        course_id: row.course_id,
        course_name: row.course_name,
        cost: parseFloat(row.cost),
        modality: row.modality,
        schedule_date: row.schedule_date,
        start_time: row.start_time,
        end_time: row.end_time
      });
    });

    // Convertir a array
    const students = Object.values(bookingsByStudent);

    res.status(200).json({
      success: true,
      parent_id: parseInt(parent_id),
      students,
      total_students: students.length,
      total_bookings: result.rows.length
    });

  } catch (error) {
    console.error('Error en getUnpaidBookingsByParent:', error);
    res.status(500).json({ error: 'Error al obtener los bookings sin pagar' });
  }
};

/**
 * Obtiene los bookings sin pagar del estudiante autenticado
 * GET /api/students/bookings/unpaid
 */
export const getUnpaidBookingsByStudent = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Obtener bookings del estudiante que no están pagados
    // Un estudiante adulto es su propio "parent" en la tabla Kid
    const query = `
      SELECT 
        b.id as booking_id,
        b.kid_id,
        k.name as student_name,
        b.course_id,
        c.name as course_name,
        c.cost,
        b.modality,
        b.status,
        s.schedule_date,
        s.start_time,
        s.end_time
      FROM Booking b
      JOIN Kid k ON b.kid_id = k.id
      JOIN Course c ON b.course_id = c.id
      LEFT JOIN Schedule s ON b.schedule_id = s.id
      WHERE k.parent_id = $1
        AND b.status = 'programada'
        AND b.id NOT IN (
          SELECT booking_id 
          FROM Payment_item 
          WHERE booking_id IS NOT NULL
        )
      ORDER BY s.schedule_date;
    `;

    const result = await db.query(query, [userId]);

    // Agrupar por estudiante (aunque será solo uno para estudiantes adultos)
    const bookingsByStudent = {};
    result.rows.forEach(row => {
      if (!bookingsByStudent[row.kid_id]) {
        bookingsByStudent[row.kid_id] = {
          kid_id: row.kid_id,
          student_name: row.student_name,
          bookings: []
        };
      }
      bookingsByStudent[row.kid_id].bookings.push({
        booking_id: row.booking_id,
        course_id: row.course_id,
        course_name: row.course_name,
        cost: parseFloat(row.cost),
        modality: row.modality,
        schedule_date: row.schedule_date,
        start_time: row.start_time,
        end_time: row.end_time
      });
    });

    const students = Object.values(bookingsByStudent);

    res.status(200).json({
      success: true,
      students,
      total_students: students.length,
      total_bookings: result.rows.length
    });

  } catch (error) {
    console.error('Error en getUnpaidBookingsByStudent:', error);
    res.status(500).json({ error: 'Error al obtener los bookings sin pagar' });
  }
};
