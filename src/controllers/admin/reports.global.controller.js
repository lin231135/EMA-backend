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

/**
 * GET /api/admin/reports/distribution/courses?from&to
 * Distribución de estudiantes por curso y modalidad (proxy de “instrumento y nivel”).
 */
export async function getCourseDistribution(req, res) {
  const { from, to } = req.query;
  const where = [];
  const params = [];
  let i = 1;

  if (from) { where.push(`s.schedule_date >= $${i++}`); params.push(from); }
  if (to)   { where.push(`s.schedule_date <= $${i++}`); params.push(to); }

  const whereSQL = where.length ? `AND ${where.join(' AND ')}` : '';

  try {
    const q = `
      SELECT
        c.name AS course,
        c.modality::text AS modality,
        COUNT(DISTINCT b.kid_id)::int AS students
      FROM Booking b
      JOIN Course c   ON c.id = b.course_id
      JOIN Schedule s ON s.id = b.schedule_id
      WHERE 1=1
      ${whereSQL}
      GROUP BY c.name, c.modality
      ORDER BY students DESC, course;
    `;
    const { rows } = await pool.query(q, params);
    res.json({ items: rows });
  } catch (err) {
    console.error('getCourseDistribution', err);
    res.status(500).json({ error: 'Error al obtener distribución por curso' });
  }
}

/**
 * GET /api/admin/reports/performance/evolution?granularity=month|week&from&to
 * Evolución de “rendimiento académico” (proxies):
 * - tasa de completadas, canceladas, programadas
 * - horas completadas
 */
export async function getPerformanceEvolution(req, res) {
  const { granularity = 'month', from, to } = req.query;
  
  // Definir formato de agrupación temporal
  const bucket = granularity === 'week'
    ? `to_char(s.schedule_date, 'IYYY-"W"IW')`
    : `to_char(date_trunc('month', s.schedule_date), 'YYYY-MM')`;

  const where = [];
  const params = [];
  let i = 1;
  
  // Construir filtros de rango de fechas
  if (from) { where.push(`s.schedule_date >= $${i++}`); params.push(from); }
  if (to)   { where.push(`s.schedule_date <= $${i++}`); params.push(to); }
  const whereSQL = where.length ? `AND ${where.join(' AND ')}` : '';

  try {
    // Calcular métricas de rendimiento por periodo
    const q = `
      SELECT
        ${bucket} AS bucket,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE b.status='completada')::int AS completed,
        COUNT(*) FILTER (WHERE b.status='cancelada')::int  AS cancelled,
        COUNT(*) FILTER (WHERE b.status='programada')::int AS scheduled,
        CASE WHEN COUNT(*)=0 THEN 0
             ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE b.status='completada') / COUNT(*), 2)
        END AS completion_rate,
        COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))) FILTER (WHERE b.status='completada')/3600.0, 0) AS hours_completed
      FROM Booking b
      JOIN Schedule s ON s.id = b.schedule_id
      WHERE 1=1
      ${whereSQL}
      GROUP BY bucket
      ORDER BY MIN(s.schedule_date);
    `;
    const { rows } = await pool.query(q, params);
    res.json({ granularity: granularity === 'week' ? 'week' : 'month', series: rows });
  } catch (err) {
    console.error('getPerformanceEvolution', err);
    res.status(500).json({ error: 'Error al obtener evolución de rendimiento' });
  }
}

/**
 * GET /api/admin/reports/teachers/performance?from&to
 * Rendimiento por maestro: clases/horas, alumnos únicos, última clase.
 */
export async function getTeacherPerformance(req, res) {
  const { from, to } = req.query;
  const where = [];
  const params = [];
  let i = 1;
  
  // Filtros opcionales de fecha
  if (from) { where.push(`s.schedule_date >= $${i++}`); params.push(from); }
  if (to)   { where.push(`s.schedule_date <= $${i++}`); params.push(to); }
  const whereSQL = where.length ? `AND ${where.join(' AND ')}` : '';

  try {
    // Obtener estadísticas de rendimiento por maestro
    const q = `
      SELECT
        u.id AS teacher_id,
        u.name || ' ' || u.last_name AS teacher_name,
        COUNT(*) FILTER (WHERE b.status='completada')::int AS classes_completed,
        COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))) FILTER (WHERE b.status='completada')/3600.0, 0) AS hours_completed,
        COUNT(DISTINCT b.kid_id)::int AS unique_students,
        MAX(s.schedule_date) AS last_class_date
      FROM Booking b
      JOIN "User" u   ON u.id = b.teacher_id
      JOIN Schedule s ON s.id = b.schedule_id
      WHERE 1=1
      ${whereSQL}
      GROUP BY u.id, teacher_name
      ORDER BY classes_completed DESC, hours_completed DESC;
    `;
    const { rows } = await pool.query(q, params);
    res.json({ items: rows });
  } catch (err) {
    console.error('getTeacherPerformance', err);
    res.status(500).json({ error: 'Error al obtener rendimiento por maestro' });
  }
}
