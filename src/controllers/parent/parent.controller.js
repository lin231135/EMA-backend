// src/controllers/parent/parent.controller.js
import pool from '../../db/connection.js';

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

// Convierte ?kid_ids=1,2,3 -> [1,2,3]
function parseKidIds(queryStr) {
  if (!queryStr) return [];
  return String(queryStr)
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

/* -------------------------------------------------------------------------- */
/*                        Dashboard - Hijos del padre                         */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/parents/dashboard/children
 * Devuelve los hijos del padre autenticado (por JWT) para el dashboard.
 * Tablas: "User" (padre), Kid (hijos)
 */
export const getChildrenForDashboard = async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });

    // Validar que el usuario exista y sea padre (o admin para pruebas)
    const u = await pool.query(
      `SELECT id, role, is_active
         FROM "User"
        WHERE id = $1
        LIMIT 1`,
      [authUserId]
    );

    if (u.rowCount === 0 || u.rows[0].is_active === false) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    const role = u.rows[0].role;
    if (role !== 'padre' && role !== 'admin') {
      return res.status(403).json({ error: 'Only parents (or admin) can access this resource' });
    }

    // Traer hijos
    const kidsQ = await pool.query(
      `SELECT id, name, is_solvent, is_active, created_at
         FROM Kid
        WHERE parent_id = $1
        ORDER BY name`,
      [authUserId]
    );

    // Respuesta pensada para reemplazar los MOCK_* en el frontend
    const children = kidsQ.rows.map(k => ({
      id: k.id,
      name: k.name,
      is_solvent: !!k.is_solvent,
      is_active: !!k.is_active,
      created_at: k.created_at,
      // Campos de conveniencia para el front actual:
      avatarUrl: null,
      type: 'student'
    }));

    return res.json({
      parent_id: authUserId,
      count: children.length,
      children
    });
  } catch (err) {
    console.error('[getChildrenForDashboard] ', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

/* -------------------------------------------------------------------------- */
/*                           Notas y Retroalimentación                        */
/* -------------------------------------------------------------------------- */

export const addNote = async (req, res) => {
  return res.status(501).json({ error: 'Not implemented yet' });
};

export const getFeedback = async (req, res) => {
  return res.status(501).json({ error: 'Not implemented yet' });
};

/* -------------------------------------------------------------------------- */
/*                             Clases del Dashboard                           */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/parents/dashboard/today-classes?kid_ids=1,2
 * Devuelve las clases del día actual para los hijos del padre autenticado.
 */
export const getTodayClasses = async (req, res) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) return res.status(401).json({ error: 'Unauthorized' });

    const kidIds = parseKidIds(req.query.kid_ids);

    const params = [parentId];
    let kidFilter = '';
    if (kidIds.length > 0) {
      params.push(kidIds);
      kidFilter = ` AND k.id = ANY($2::int[]) `;
    }

    const q = `
      SELECT
        b.id                                   AS booking_id,
        b.status                               AS status,
        k.id                                   AS kid_id,
        k.name                                 AS kid_name,
        c.id                                   AS course_id,
        c.name                                 AS course_name,
        s.schedule_date                        AS date,
        to_char(s.start_time, 'HH24:MI')       AS start_time,
        to_char(s.end_time, 'HH24:MI')         AS end_time,
        u.id                                   AS teacher_id,
        (u.name || ' ' || u.last_name)         AS teacher_name,
        b.modality                             AS modality
      FROM Booking b
      JOIN Kid k       ON k.id = b.kid_id
      JOIN Schedule s  ON s.id = b.schedule_id
      JOIN Course c    ON c.id = b.course_id
      JOIN "User" u    ON u.id = b.teacher_id
      WHERE k.parent_id = $1
        ${kidFilter}
        AND s.schedule_date = CURRENT_DATE
        AND b.status IN ('programada', 'completada')
      ORDER BY s.start_time ASC;
    `;

    const { rows } = await pool.query(q, params);

    return res.json({
      date: new Date().toISOString().slice(0, 10),
      count: rows.length,
      classes: rows.map((r) => ({
        id: r.booking_id,
        kid_id: r.kid_id,
        kid_name: r.kid_name,
        course_id: r.course_id,
        course_name: r.course_name,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        teacher_id: r.teacher_id,
        teacher_name: r.teacher_name,
        status: r.status,
        modality: r.modality,
      })),
    });
  } catch (err) {
    console.error('[getTodayClasses] ', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/parents/dashboard/next-classes?days=3&kid_ids=1,2
 * Devuelve las clases próximas (por defecto, 3 días siguientes).
 */
export const getNextClasses = async (req, res) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) return res.status(401).json({ error: 'Unauthorized' });

    const days = Math.max(1, Math.min(30, Number(req.query.days) || 3));
    const kidIds = parseKidIds(req.query.kid_ids);

    const params = [parentId, days];
    let kidFilter = '';
    if (kidIds.length > 0) {
      params.push(kidIds);
      kidFilter = ` AND k.id = ANY($3::int[]) `;
    }

    const q = `
      SELECT
        b.id                                   AS booking_id,
        b.status                               AS status,
        k.id                                   AS kid_id,
        k.name                                 AS kid_name,
        c.id                                   AS course_id,
        c.name                                 AS course_name,
        s.schedule_date                        AS date,
        to_char(s.start_time, 'HH24:MI')       AS start_time,
        to_char(s.end_time, 'HH24:MI')         AS end_time,
        u.id                                   AS teacher_id,
        (u.name || ' ' || u.last_name)         AS teacher_name,
        b.modality                             AS modality
      FROM Booking b
      JOIN Kid k       ON k.id = b.kid_id
      JOIN Schedule s  ON s.id = b.schedule_id
      JOIN Course c    ON c.id = b.course_id
      JOIN "User" u    ON u.id = b.teacher_id
      WHERE k.parent_id = $1
        ${kidFilter}
        AND s.schedule_date > CURRENT_DATE
        AND s.schedule_date <= CURRENT_DATE + ($2 || ' days')::interval
        AND b.status <> 'cancelada'
      ORDER BY s.schedule_date ASC, s.start_time ASC;
    `;

    const { rows } = await pool.query(q, params);

    return res.json({
      range: { from: new Date().toISOString().slice(0, 10), days },
      count: rows.length,
      classes: rows.map((r) => ({
        id: r.booking_id,
        kid_id: r.kid_id,
        kid_name: r.kid_name,
        course_id: r.course_id,
        course_name: r.course_name,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        teacher_id: r.teacher_id,
        teacher_name: r.teacher_name,
        status: r.status,
        modality: r.modality,
      })),
    });
  } catch (err) {
    console.error('[getNextClasses] ', err);
    return res.status(500).json({ error: 'Server error' });
  }
};