// src/controllers/admin/bookings.controller.js
import db from '../../db/connection.js';

/**
 * Obtiene los pagos pendientes de comprobante de los hijos de un padre específico
 * GET /api/admins/bookings/unpaid?parent_id=X
 * 
 * Devuelve bookings con pagos en estado 'pendiente' (esperando que suban comprobante)
 */
export const getUnpaidBookingsByParent = async (req, res) => {
  try {
    const { parent_id } = req.query;

    if (!parent_id) {
      return res.status(400).json({ error: 'parent_id es requerido' });
    }

    // Obtener bookings con pagos en estado 'pendiente' (necesitan subir comprobante)
    // Soporta tanto hijos (con kid_id) como estudiantes adultos (sin kid_id)
    const query = `
      SELECT 
        b.id as booking_id,
        b.kid_id,
        COALESCE(k.name, u.name) as student_name,
        b.course_id,
        c.name as course_name,
        c.cost,
        b.modality,
        b.status,
        s.schedule_date,
        s.start_time,
        s.end_time,
        p.id as payment_id,
        p.state as payment_state,
        p.payment_method
      FROM Booking b
      LEFT JOIN Kid k ON b.kid_id = k.id
      JOIN "User" u ON b.user_id = u.id
      JOIN Course c ON b.course_id = c.id
      LEFT JOIN Schedule s ON b.schedule_id = s.id
      JOIN Payment_item pi ON pi.booking_id = b.id
      JOIN Payment p ON p.id = pi.payment_id
      WHERE (k.parent_id = $1 OR (b.kid_id IS NULL AND b.user_id = $1))
        AND b.status = 'programada'
        AND p.state = 'pendiente'
      ORDER BY COALESCE(k.name, u.name), s.schedule_date;
    `;

    const result = await db.query(query, [parent_id]);

    // Agrupar por estudiante (kid_id o 'adult' para estudiantes adultos)
    const bookingsByStudent = {};
    result.rows.forEach(row => {
      const studentKey = row.kid_id || 'adult';
      if (!bookingsByStudent[studentKey]) {
        bookingsByStudent[studentKey] = {
          kid_id: row.kid_id,
          student_name: row.student_name,
          bookings: []
        };
      }
      bookingsByStudent[studentKey].bookings.push({
        booking_id: row.booking_id,
        course_id: row.course_id,
        course_name: row.course_name,
        cost: parseFloat(row.cost),
        modality: row.modality,
        schedule_date: row.schedule_date,
        start_time: row.start_time,
        end_time: row.end_time,
        payment_id: row.payment_id,
        payment_state: row.payment_state
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
    res.status(500).json({ error: 'Error al obtener los pagos pendientes' });
  }
};

/**
 * Obtiene los pagos pendientes de comprobante del estudiante autenticado
 * GET /api/students/bookings/unpaid
 * 
 * Devuelve bookings con pagos en estado 'pendiente' (esperando que suban comprobante)
 * Los pagos en efectivo van directo a 'en revision', por lo que no aparecen aquí
 */
export const getUnpaidBookingsByStudent = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Obtener bookings con pagos en estado 'pendiente' (necesitan subir comprobante)
    // Soporta estudiantes adultos (sin kid_id) y estudiantes con kid_id
    const query = `
      SELECT 
        b.id as booking_id,
        b.kid_id,
        COALESCE(k.name, u.name) as student_name,
        b.course_id,
        c.name as course_name,
        c.cost,
        b.modality,
        b.status,
        s.schedule_date,
        s.start_time,
        s.end_time,
        p.id as payment_id,
        p.state as payment_state,
        p.payment_method
      FROM Booking b
      LEFT JOIN Kid k ON b.kid_id = k.id
      JOIN "User" u ON b.user_id = u.id
      JOIN Course c ON b.course_id = c.id
      LEFT JOIN Schedule s ON b.schedule_id = s.id
      JOIN Payment_item pi ON pi.booking_id = b.id
      JOIN Payment p ON p.id = pi.payment_id
      WHERE (k.parent_id = $1 OR (b.kid_id IS NULL AND b.user_id = $1))
        AND b.status = 'programada'
        AND p.state = 'pendiente'
      ORDER BY s.schedule_date;
    `;

    const result = await db.query(query, [userId]);

    // Agrupar por estudiante (kid_id o 'adult' para estudiantes adultos)
    const bookingsByStudent = {};
    result.rows.forEach(row => {
      const studentKey = row.kid_id || 'adult';
      if (!bookingsByStudent[studentKey]) {
        bookingsByStudent[studentKey] = {
          kid_id: row.kid_id,
          student_name: row.student_name,
          bookings: []
        };
      }
      bookingsByStudent[studentKey].bookings.push({
        booking_id: row.booking_id,
        course_id: row.course_id,
        course_name: row.course_name,
        cost: parseFloat(row.cost),
        modality: row.modality,
        schedule_date: row.schedule_date,
        start_time: row.start_time,
        end_time: row.end_time,
        payment_id: row.payment_id,
        payment_state: row.payment_state
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
    res.status(500).json({ error: 'Error al obtener los pagos pendientes' });
  }
};
