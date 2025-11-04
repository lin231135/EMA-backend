// src/controllers/admin/reports.global.controller.js
import pool from '../../db/connection';

// Helper para convertir valores a número
const num = (v) => (v == null ? 0 : Number(v));

/**
 * GET /api/admin/reports/kpis?from=YYYY-MM-DD&to=YYYY-MM-DD
 * KPIs globales: estudiantes, maestros, clases (completadas), ingresos aceptados.
 */
export async function getGlobalKPIs(req, res) {
  const { from, to } = req.query;
  const wherePay = [];
  const paramsPay = [];
  let i = 1;

  // Construir filtros de fecha para pagos
  if (from) { wherePay.push(`p.payment_date >= $${i++}`); paramsPay.push(from); }
  if (to)   { wherePay.push(`p.payment_date <= $${i++}`); paramsPay.push(to); }

  const payWhereSQL = wherePay.length ? `AND ${wherePay.join(' AND ')}` : '';

  try {
    const client = await pool.connect();

    // Queries para cada KPI
    const studentsQ = `SELECT COUNT(*)::int AS total FROM Kid WHERE is_active = TRUE`;
    const teachersQ = `SELECT COUNT(*)::int AS total FROM "User" WHERE role = 'maestro' AND is_active = TRUE`;
    const classesQ  = `SELECT COUNT(*)::int AS total FROM Booking WHERE status = 'completada'`;

    const incomeQ = `
      SELECT COALESCE(SUM(p.total),0) AS income
      FROM Payment p
      WHERE p.state = 'aceptado' ${payWhereSQL}
    `;

    // Ejecutar todas las consultas en paralelo
    const [{ rows: [stu] }, { rows: [tch] }, { rows: [cls] }, { rows: [inc] }] =
      await Promise.all([
        client.query(studentsQ),
        client.query(teachersQ),
        client.query(classesQ),
        client.query(incomeQ, paramsPay),
      ]);

    client.release();

    res.json({
      students: stu?.total || 0,
      teachers: tch?.total || 0,
      classesCompleted: cls?.total || 0,
      incomeAccepted: num(inc?.income),
    });
  } catch (err) {
    console.error('getGlobalKPIs', err);
    res.status(500).json({ error: 'Error al obtener KPIs globales' });
  }
}

/**
 * GET /api/admin/reports/trends/students?granularity=month|week&from&to
 * Tendencia: Activos (con bookings) y Nuevos registros (Kid.created_at)
 */
export async function getStudentTrends(req, res) {
  const { granularity = 'month', from, to } = req.query;
  
  // Generar serie de fechas (por defecto últimos 12 meses)
  const daterange = `
    SELECT d::date
    FROM generate_series(
      COALESCE($1::date, (CURRENT_DATE - INTERVAL '11 months')::date),
      COALESCE($2::date, CURRENT_DATE),
      '1 day'
    ) AS d
  `;

  // Formato de agrupación para nuevos registros (semana o mes)
  const bucketDays = granularity === 'week'
    ? `to_char(days.d, 'IYYY-"W"IW')`
    : `to_char(date_trunc('month', days.d), 'YYYY-MM')`;

  try {
    // Query 1: Nuevos estudiantes registrados por periodo
    const newRegsQ = `
      WITH days AS (${daterange})
      SELECT ${bucketDays} AS bucket,
             COUNT(*)::int AS new_registrations
      FROM Kid k
      JOIN days ON k.created_at::date = days.d
      GROUP BY bucket
      ORDER BY MIN(days.d);
    `;

    // Formato de agrupación para bookings activos
    const bucketBookings = granularity === 'week'
      ? `to_char(s.schedule_date, 'IYYY-"W"IW')`
      : `to_char(date_trunc('month', s.schedule_date), 'YYYY-MM')`;

    // Query 2: Estudiantes activos (con al menos 1 booking) por periodo
    const activeQ = `
      WITH date_range AS (${daterange})
      SELECT ${bucketBookings} AS bucket,
             COUNT(DISTINCT b.kid_id)::int AS active_students
      FROM Booking b
      JOIN Schedule s ON s.id = b.schedule_id
      JOIN date_range dr ON s.schedule_date::date = dr.d
      GROUP BY bucket
      ORDER BY MIN(s.schedule_date);
    `;

    // Ejecutar ambas queries en paralelo
    const [newRegs, active] = await Promise.all([
      pool.query(newRegsQ, [from || null, to || null]),
      pool.query(activeQ,   [from || null, to || null]),
    ]);

    res.json({
      granularity: granularity === 'week' ? 'week' : 'month',
      newRegistrations: newRegs.rows,
      activeStudents: active.rows,
    });
  } catch (err) {
    console.error('getStudentTrends', err);
    res.status(500).json({ error: 'Error al obtener tendencia de estudiantes' });
  }
}

