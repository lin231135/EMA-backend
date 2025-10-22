// src/controllers/payments/payment.history.controller.js
//
// Historial de pagos para PADRE y para ESTUDIANTE (por kid).
// - Devuelve una lista "achatada" de ítems de pago (con o sin booking).//
// DB: Payment -> Payment_item -> (Booking -> Kid -> Course -> Schedule) | Book

import pool from '../../db/connection.js';

/** Formatea $ dinero en string con 2 decimales, prefijo $ */
function money(n) {
  const num = Number(n || 0);
  return `$${num.toFixed(2)}`;
}

/** Convierte payment_date a { month: 'January', year: '2024' } en EN (el front traduce). */
function monthYearEN(iso) {
  const d = iso ? new Date(iso) : new Date();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = String(d.getFullYear());
  return { month, year };
}

/** Normaliza fila SQL a item plano que la UI espera */
function normalizeRow(r) {
  const { month, year } = monthYearEN(r.payment_date);
  const serial = `EMA-${r.payment_id}-${r.item_id}`; // estable y único
  const isBook = !!r.book_id;

  const description = isBook
    ? (r.book_name || 'Book')
    : [r.course_name || 'Course', r.kid_name ? `- ${r.kid_name}` : null]
        .filter(Boolean)
        .join(' ');

  // preferimos subtotal del item; si viene null, caer a unit_cost o total pago
  const amount = r.subtotal ?? r.unit_cost ?? r.payment_total;

  return {
    id: r.item_id,
    serialNumber: serial,
    description,
    monthPaid: month,   // EN; el frontend ya traduce el mes
    year,
    totalCost: money(amount),
  };
}

/* =========================================================================
   GET /api/parents/payments/history[?kid_id=123]
   - Requiere rol: padre (o admin)
   - Trae TODOS los Payment del padre y sus Payment_item.
   - Si ?kid_id, filtra a ítems de booking de ese niño. Los items de libros
     (book_id) sólo se incluyen SI no se manda kid_id (porque no tienen kid).
   ========================================================================= */
export async function getParentPaymentHistory(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // validar rol del usuario
    const roleQ = await pool.query(`SELECT role FROM "User" WHERE id = $1 LIMIT 1`, [userId]);
    if (roleQ.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    const role = roleQ.rows[0].role;
    if (role !== 'padre' && role !== 'admin') {
      return res.status(403).json({ message: 'Only parents or admin can access this resource' });
    }

    const kidId = req.query.kid_id ? Number(req.query.kid_id) : null;
    const params = [userId];
    let kidFilterJoin = '';
    let kidFilterWhere = '';

    if (Number.isInteger(kidId) && kidId > 0) {
      // Cuando hay kid_id: filtramos items de booking de ese Kid
      // y excluimos items de libros (porque no están ligados a kid)
      params.push(kidId);
      kidFilterJoin = ` LEFT JOIN Booking bk ON bk.id = pi.booking_id
                        LEFT JOIN Kid k ON k.id = bk.kid_id `;
      kidFilterWhere = ` AND k.id = $2 `;
    } else {
      // Sin kid_id: incluimos tanto booking items como libros
      kidFilterJoin = ` LEFT JOIN Booking bk ON bk.id = pi.booking_id
                        LEFT JOIN Kid k ON k.id = bk.kid_id `;
    }

    const q = `
      SELECT
        p.id                AS payment_id,
        p.payment_date      AS payment_date,
        p.total             AS payment_total,
        p.payment_method    AS payment_method,
        p.state             AS payment_state,
        pi.id               AS item_id,
        pi.subtotal         AS subtotal,
        pi.unit_cost        AS unit_cost,
        pi.booking_id       AS booking_id,
        pi.book_id          AS book_id,
        -- booking side
        c.name              AS course_name,
        s.schedule_date     AS schedule_date,
        k.id                AS kid_id,
        k.name              AS kid_name,
        -- book side
        b.name              AS book_name
      FROM Payment p
      JOIN Payment_item pi       ON pi.payment_id = p.id
      ${kidFilterJoin}
      LEFT JOIN Course c         ON c.id = bk.course_id
      LEFT JOIN Schedule s       ON s.id = bk.schedule_id
      LEFT JOIN Book b           ON b.id = pi.book_id
      WHERE p.user_id = $1
        ${kidFilterWhere}
      ORDER BY p.payment_date DESC, p.id DESC, pi.id DESC;
    `;

    const { rows } = await pool.query(q, params);

    // Si se pidió kid_id, filtramos por seguridad también del lado JS:
    const filtered = (Number.isInteger(kidId) && kidId > 0)
      ? rows.filter(r => r.kid_id === kidId)
      : rows;

    const items = filtered.map(normalizeRow);
    return res.json({ items });
  } catch (err) {
    console.error('[getParentPaymentHistory]', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/* =========================================================================
   GET /api/students/payments/history?kid_id=123
   - Requiere kid_id (por ahora). Verifica ownership si quien llama es padre.
   - Devuelve ítems de pago asociados a bookings del kid indicado.
   - ÚTIL para la pantalla que muestra el historial del estudiante específico.
   ========================================================================= */
export async function getStudentPaymentHistory(req, res) {
  const authId = req.user?.id;
  if (!authId) return res.status(401).json({ message: 'Unauthorized' });

  // Si viene ?kid_id, intentaremos validarlo según el rol
  const requestedKidId = req.query.kid_id ? Number(req.query.kid_id) : null;

  try {
    // Rol de quien consulta
    const roleQ = await pool.query(`SELECT role FROM "User" WHERE id = $1 LIMIT 1`, [authId]);
    if (roleQ.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    const role = roleQ.rows[0].role;

    // Helper: arma la lista de kid_ids a consultar y valida ownership si aplica
    async function resolveStudentKidIds() {
      const kidIds = new Set();

      // 1) Regla de negocio: estudiante-adulto o estudiante con hijos también
      //    -> Todos los Kid con parent_id = authId
      const ownKids = await pool.query(`SELECT id FROM Kid WHERE parent_id = $1`, [authId]);
      for (const r of ownKids.rows) kidIds.add(r.id);
      try {
        const link = await pool.query(
          `SELECT kid_id FROM Student_User WHERE user_id = $1`,
          [authId]
        );
        for (const r of link.rows) kidIds.add(r.kid_id);
      } catch {
      }

      return Array.from(kidIds);
    }

    // ===== Rama por rol =====
    if (role === 'estudiante') {
      const allowedKidIds = await resolveStudentKidIds();

      if (requestedKidId) {
        // Debe pertenecerle
        if (!allowedKidIds.includes(requestedKidId)) {
          return res.status(403).json({
            message: 'kid_id does not belong to the authenticated student.',
          });
        }
        // Consultar SOLO ese kid_id
        const items = await queryHistoryForKidIds([requestedKidId]);
        return res.json({ items });
      }

      // Sin kid_id: traer historial para TODOS sus kid_ids (adulto = él mismo)
      if (allowedKidIds.length === 0) {
        return res.status(404).json({ message: 'Student has no Kid records.' });
      }
      const items = await queryHistoryForKidIds(allowedKidIds);
      return res.json({ items });
    }

    if (role === 'padre') {
      // Para padre mantenemos la regla explícita: debe enviar kid_id y ser suyo
      if (!Number.isInteger(requestedKidId) || requestedKidId <= 0) {
        return res.status(400).json({ message: 'kid_id (number) is required for parent role' });
      }
      const own = await pool.query(
        `SELECT 1 FROM Kid WHERE id = $1 AND parent_id = $2`,
        [requestedKidId, authId]
      );
      if (own.rowCount === 0) {
        return res.status(403).json({ message: 'You do not own this student (kid)' });
      }
      const items = await queryHistoryForKidIds([requestedKidId]);
      return res.json({ items });
    }

    if (role === 'admin') {
      // Admin puede consultar por kid_id o rechazar si no manda nada
      if (!Number.isInteger(requestedKidId) || requestedKidId <= 0) {
        return res.status(400).json({ message: 'kid_id (number) is required for admin role' });
      }
      const items = await queryHistoryForKidIds([requestedKidId]);
      return res.json({ items });
    }

    // Otros roles no permitidos
    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    console.error('[getStudentPaymentHistory]', err);
    return res.status(500).json({ message: 'Server error' });
  }

  // === Helper local ===
  async function queryHistoryForKidIds(kidIds) {
    // Genera placeholders para IN (...)
    const placeholders = kidIds.map((_, i) => `$${i + 1}`).join(', ');

    const q = `
      SELECT
        p.id                AS payment_id,
        p.payment_date      AS payment_date,
        p.total             AS payment_total,
        p.payment_method    AS payment_method,
        p.state             AS payment_state,
        pi.id               AS item_id,
        pi.subtotal         AS subtotal,
        pi.unit_cost        AS unit_cost,
        pi.booking_id       AS booking_id,
        -- booking side
        c.name              AS course_name,
        s.schedule_date     AS schedule_date,
        k.id                AS kid_id,
        k.name              AS kid_name
      FROM Payment p
      JOIN Payment_item pi   ON pi.payment_id = p.id
      JOIN Booking bk        ON bk.id = pi.booking_id
      JOIN Kid k             ON k.id = bk.kid_id
      JOIN Course c          ON c.id = bk.course_id
      LEFT JOIN Schedule s   ON s.id = bk.schedule_id
      WHERE k.id IN (${placeholders})
      ORDER BY p.payment_date DESC, p.id DESC, pi.id DESC;
    `;
    const { rows } = await pool.query(q, kidIds);
    return rows.map(normalizeRow);
  }
}

