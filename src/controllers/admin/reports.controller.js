import db from '../../db/connection.js';

// Reporte de ingresos por período
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM';
    }

    const query = `
      SELECT 
        TO_CHAR(p.payment_date, $3) AS period,
        COUNT(p.id) AS total_payments,
        COALESCE(SUM(p.total), 0) AS total_revenue,
        COALESCE(AVG(p.total), 0) AS avg_payment,
        COUNT(CASE WHEN p.state = 'solvente' THEN 1 END) AS completed_payments,
        COUNT(CASE WHEN p.state = 'pendiente' THEN 1 END) AS pending_payments
      FROM Payment p
      WHERE ($1::date IS NULL OR p.payment_date >= $1::date)
        AND ($2::date IS NULL OR p.payment_date <= $2::date)
      GROUP BY period
      ORDER BY period DESC
    `;

    const result = await db.query(query, [startDate, endDate, dateFormat]);
    
    res.json({
      success: true,
      data: result.rows,
      summary: {
        totalPeriods: result.rows.length,
        totalRevenue: result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0)
      }
    });
  } catch (error) {
    console.error('Error en reporte de ingresos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Reporte de reservas por estado y período
export const getBookingsReport = async (req, res) => {
  try {
    const { startDate, endDate, status, teacherId, courseId } = req.query;

    const query = `
      SELECT 
        b.status,
        COUNT(b.id) AS total_bookings,
        COUNT(DISTINCT b.kid_id) AS unique_students,
        COUNT(DISTINCT b.teacher_id) AS teachers_involved,
        c.name AS course_name,
        u.name || ' ' || u.last_name AS teacher_name,
        TO_CHAR(s.schedule_date, 'YYYY-MM-DD') AS class_date,
        COUNT(CASE WHEN b.modality = 'academia' THEN 1 END) AS academy_bookings,
        COUNT(CASE WHEN b.modality = 'domicilio' THEN 1 END) AS home_bookings
      FROM Booking b
      INNER JOIN Course c ON b.course_id = c.id
      INNER JOIN "User" u ON b.teacher_id = u.id
      INNER JOIN Schedule s ON b.schedule_id = s.id
      WHERE ($1::date IS NULL OR s.schedule_date >= $1::date)
        AND ($2::date IS NULL OR s.schedule_date <= $2::date)
        AND ($3::text IS NULL OR b.status = $3::bookingstatus)
        AND ($4::int IS NULL OR b.teacher_id = $4)
        AND ($5::int IS NULL OR b.course_id = $5)
      GROUP BY b.status, c.name, u.name, u.last_name, s.schedule_date
      ORDER BY s.schedule_date DESC, b.status
    `;

    const result = await db.query(query, [startDate, endDate, status, teacherId, courseId]);
    
    // Resumen agregado
    const summaryQuery = `
      SELECT 
        b.status,
        COUNT(b.id) AS count
      FROM Booking b
      INNER JOIN Schedule s ON b.schedule_id = s.id
      WHERE ($1::date IS NULL OR s.schedule_date >= $1::date)
        AND ($2::date IS NULL OR s.schedule_date <= $2::date)
        AND ($3::text IS NULL OR b.status = $3::bookingstatus)
        AND ($4::int IS NULL OR b.teacher_id = $4)
        AND ($5::int IS NULL OR b.course_id = $5)
      GROUP BY b.status
    `;

    const summaryResult = await db.query(summaryQuery, [startDate, endDate, status, teacherId, courseId]);
    
    res.json({
      success: true,
      data: result.rows,
      summary: summaryResult.rows
    });
  } catch (error) {
    console.error('Error en reporte de reservas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Reporte de rendimiento de maestros
export const getTeachersPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT 
        u.id AS teacher_id,
        u.name || ' ' || u.last_name AS teacher_name,
        u.email AS teacher_email,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(CASE WHEN b.status = 'completada' THEN 1 END) AS completed_classes,
        COUNT(CASE WHEN b.status = 'cancelada' THEN 1 END) AS cancelled_classes,
        COUNT(DISTINCT b.kid_id) AS unique_students_taught,
        COUNT(DISTINCT b.course_id) AS courses_taught,
        COALESCE(AVG(c.cost), 0) AS avg_course_cost,
        COALESCE(SUM(CASE WHEN b.status = 'completada' THEN c.cost END), 0) AS total_revenue_generated,
        COUNT(DISTINCT f.id) AS feedback_given,
        ROUND(
          (COUNT(CASE WHEN b.status = 'completada' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(b.id), 0)), 2
        ) AS completion_rate
      FROM "User" u
      LEFT JOIN Booking b ON u.id = b.teacher_id
      LEFT JOIN Course c ON b.course_id = c.id
      LEFT JOIN Schedule s ON b.schedule_id = s.id
      LEFT JOIN Feedback f ON b.id = f.booking_id
      WHERE u.role = 'maestro'
        AND u.is_active = true
        AND ($1::date IS NULL OR s.schedule_date >= $1::date)
        AND ($2::date IS NULL OR s.schedule_date <= $2::date)
      GROUP BY u.id, u.name, u.last_name, u.email
      ORDER BY total_revenue_generated DESC, completion_rate DESC
    `;

    const result = await db.query(query, [startDate, endDate]);
    
    res.json({
      success: true,
      data: result.rows,
      summary: {
        totalTeachers: result.rows.length,
        avgCompletionRate: result.rows.reduce((sum, row) => sum + parseFloat(row.completion_rate || 0), 0) / result.rows.length || 0,
        totalRevenue: result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue_generated), 0)
      }
    });
  } catch (error) {
    console.error('Error en reporte de rendimiento de maestros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Reporte de estudiantes más activos
export const getStudentsActivityReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    const query = `
      SELECT 
        k.id AS student_id,
        k.name AS student_name,
        k.birth_date,
        DATE_PART('year', AGE(k.birth_date)) AS age,
        p.name || ' ' || p.last_name AS parent_name,
        p.email AS parent_email,
        p.phone AS parent_phone,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(CASE WHEN b.status = 'completada' THEN 1 END) AS completed_classes,
        COUNT(CASE WHEN b.status = 'cancelada' THEN 1 END) AS cancelled_classes,
        COUNT(DISTINCT b.course_id) AS different_courses_taken,
        COUNT(DISTINCT b.teacher_id) AS different_teachers,
        COALESCE(SUM(c.cost), 0) AS total_cost,
        k.is_solvent,
        MIN(s.schedule_date) AS first_class_date,
        MAX(s.schedule_date) AS last_class_date,
        ROUND(
          (COUNT(CASE WHEN b.status = 'completada' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(b.id), 0)), 2
        ) AS attendance_rate
      FROM Kid k
      INNER JOIN "User" p ON k.parent_id = p.id
      LEFT JOIN Booking b ON k.id = b.kid_id
      LEFT JOIN Course c ON b.course_id = c.id
      LEFT JOIN Schedule s ON b.schedule_id = s.id
      WHERE ($1::date IS NULL OR s.schedule_date >= $1::date)
        AND ($2::date IS NULL OR s.schedule_date <= $2::date)
      GROUP BY k.id, k.name, k.birth_date, p.name, p.last_name, p.email, p.phone, k.is_solvent
      HAVING COUNT(b.id) > 0
      ORDER BY total_bookings DESC, attendance_rate DESC
      LIMIT $3
    `;

    const result = await db.query(query, [startDate, endDate, limit]);
    
    res.json({
      success: true,
      data: result.rows,
      summary: {
        totalActiveStudents: result.rows.length,
        avgAttendanceRate: result.rows.reduce((sum, row) => sum + parseFloat(row.attendance_rate || 0), 0) / result.rows.length || 0,
        totalRevenue: result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost), 0)
      }
    });
  } catch (error) {
    console.error('Error en reporte de actividad de estudiantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Reporte de cursos más populares
export const getCoursesPopularityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT 
        c.id AS course_id,
        c.name AS course_name,
        c.modality,
        c.capacity,
        c.cost,
        u.name || ' ' || u.last_name AS teacher_name,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(CASE WHEN b.status = 'completada' THEN 1 END) AS completed_bookings,
        COUNT(CASE WHEN b.status = 'cancelada' THEN 1 END) AS cancelled_bookings,
        COUNT(DISTINCT b.kid_id) AS unique_students,
        COALESCE(SUM(CASE WHEN b.status = 'completada' THEN c.cost END), 0) AS total_revenue,
        ROUND(AVG(c.capacity), 2) AS avg_capacity_utilization,
        ROUND(
          (COUNT(CASE WHEN b.status = 'completada' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(b.id), 0)), 2
        ) AS completion_rate,
        c.is_active
      FROM Course c
      LEFT JOIN "User" u ON c.teacher_id = u.id
      LEFT JOIN Booking b ON c.id = b.course_id
      LEFT JOIN Schedule s ON b.schedule_id = s.id
      WHERE ($1::date IS NULL OR s.schedule_date >= $1::date)
        AND ($2::date IS NULL OR s.schedule_date <= $2::date)
      GROUP BY c.id, c.name, c.modality, c.capacity, c.cost, u.name, u.last_name, c.is_active
      ORDER BY total_bookings DESC, total_revenue DESC
    `;

    const result = await db.query(query, [startDate, endDate]);
    
    res.json({
      success: true,
      data: result.rows,
      summary: {
        totalCourses: result.rows.length,
        activeCourses: result.rows.filter(row => row.is_active).length,
        totalRevenue: result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0),
        avgCompletionRate: result.rows.reduce((sum, row) => sum + parseFloat(row.completion_rate || 0), 0) / result.rows.length || 0
      }
    });
  } catch (error) {
    console.error('Error en reporte de popularidad de cursos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Reporte financiero de pagos pendientes
export const getPendingPaymentsReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id AS payment_id,
        p.total,
        p.payment_date,
        p.payment_method,
        p.state,
        p.note,
        payer.name || ' ' || payer.last_name AS payer_name,
        payer.email AS payer_email,
        payer.phone AS payer_phone,
        COUNT(pi.booking_id) AS related_bookings,
        COALESCE(SUM(pi.subtotal), 0) AS total_items_cost,
        STRING_AGG(DISTINCT c.name, ', ') AS courses_involved,
        MIN(s.schedule_date) AS earliest_class_date,
        MAX(s.schedule_date) AS latest_class_date,
        EXTRACT(DAYS FROM (NOW() - p.payment_date)) AS days_pending
      FROM Payment p
      INNER JOIN "User" payer ON p.payer_id = payer.id
      LEFT JOIN Payment_item pi ON p.id = pi.payment_id
      LEFT JOIN Booking b ON pi.booking_id = b.id
      LEFT JOIN Course c ON b.course_id = c.id
      LEFT JOIN Schedule s ON b.schedule_id = s.id
      WHERE p.state = 'pendiente'
      GROUP BY p.id, p.total, p.payment_date, p.payment_method, p.state, p.note,
               payer.name, payer.last_name, payer.email, payer.phone
      ORDER BY p.payment_date ASC, days_pending DESC
    `;

    const result = await db.query(query);
    
    // Resumen de totales
    const summaryQuery = `
      SELECT 
        COUNT(id) AS total_pending_payments,
        COALESCE(SUM(total), 0) AS total_pending_amount,
        AVG(EXTRACT(DAYS FROM (NOW() - payment_date))) AS avg_days_pending
      FROM Payment 
      WHERE state = 'pendiente'
    `;

    const summaryResult = await db.query(summaryQuery);
    
    res.json({
      success: true,
      data: result.rows,
      summary: summaryResult.rows[0]
    });
  } catch (error) {
    console.error('Error en reporte de pagos pendientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};