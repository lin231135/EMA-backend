// src/controllers/student/studentPayment.controller.js
//
// Controlador de pagos (pendientes y creación).
// - Valida y normaliza método de pago a: 'efectivo' | 'transferencia' | 'deposito'
// - Compara ENUM state como texto (p.state::text) para evitar 500
//
// Si tu enum paymentstate NO tiene 'en revision', agrega con:
//   ALTER TYPE paymentstate ADD VALUE IF NOT EXISTS 'en revision';

import pool from '../../db/connection.js';
import { DateTime } from 'luxon';

/**
 * Calcula el rango de fechas (inicio y fin) de un mes específico en formato ISO
 * @param {string} yyyyMM - Mes en formato 'YYYY-MM' (ej: '2025-11'). Si no se proporciona, usa el mes actual UTC
 * @returns {Object} - Objeto con { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
 * @example monthRange('2025-11') => { start: '2025-11-01', end: '2025-12-01' }
 */
function monthRange(yyyyMM) {
  // Si se proporciona un mes, lo parsea; si no, usa el mes actual en UTC
  const base = yyyyMM
    ? DateTime.fromFormat(yyyyMM, 'yyyy-MM', { zone: 'utc' })
    : DateTime.utc();
  
  // Obtiene el primer día del mes
  const start = base.startOf('month');
  // Obtiene el primer día del mes siguiente (para usar como límite superior en queries)
  const end = start.plus({ months: 1 });
  
  return { start: start.toISODate(), end: end.toISODate() };
}

// --- Métodos de pago permitidos (coinciden con el ENUM paymentmethod de PostgreSQL) ---
const ALLOWED_METHODS = new Set(['efectivo', 'transferencia', 'deposito']);

/**
 * Normaliza el método de pago recibido del frontend a uno de los 3 valores permitidos
 * Acepta variantes en inglés y español para mayor flexibilidad
 * @param {string} methodRaw - Método de pago recibido (ej: 'cash', 'transfer', 'efectivo')
 * @returns {string|null} - Método normalizado ('efectivo'|'transferencia'|'deposito') o null si es inválido
 */
function normalizeMethod(methodRaw) {
  // Retorna null si no se proporciona método
  if (!methodRaw) return null;
  
  // Convierte a minúsculas y elimina espacios para comparación case-insensitive
  const m = String(methodRaw).toLowerCase().trim();

  // Si ya es un método válido, lo retorna directamente
  if (ALLOWED_METHODS.has(m)) return m;

  // Mapeo de variantes en inglés/español a los métodos permitidos
  const map = {
    cash: 'efectivo',
    efectivo: 'efectivo',
    transfer: 'transferencia',
    transferencia: 'transferencia',
    deposit: 'deposito',
    deposito: 'deposito',
    'depósito': 'deposito', // Con acento
  };
  
  // Busca en el mapeo y retorna el método normalizado
  const normalized = map[m] || null;
  console.log(`[normalizeMethod] "${methodRaw}" -> "${normalized}"`);
  return normalized;
}

/**
 * GET /api/students/payments/pending
 * Obtiene la lista de bookings (clases) que aún no han sido pagados para el usuario autenticado
 * @route GET /api/students/payments/pending?month=YYYY-MM
 * @param {string} req.query.month - (Opcional) Mes a consultar en formato 'YYYY-MM'
 * @returns {Object} - Lista de bookings pendientes con información del padre, hijos y total adeudado
 */
export const getPendingPayments = async (req, res) => {
  // Obtiene el ID del usuario autenticado desde el token JWT (agregado por middleware verifyToken)
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'No autorizado' });

  try {
    // Extrae el mes del query string (opcional)
    const { month } = req.query;
    // Calcula el rango de fechas del mes (inicio y fin)
    const range = monthRange(month);
    // Formatea el mes para la respuesta (usa el proporcionado o el calculado)
    const monthStr = (month || DateTime.fromISO(range.start).toFormat('yyyy-MM'));

    // Obtiene una conexión a la base de datos
    const client = await pool.connect();
    try {
      // Busca la información del usuario (padre) en la BD
      const parentRes = await client.query(
        `SELECT id, name, last_name FROM "User" WHERE id = $1`,
        [userId]
      );
      
      // Si el usuario no existe, retorna error 404
      if (parentRes.rowCount === 0) {
        client.release();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const parent = parentRes.rows[0];

      /**
       * Query SQL con CTEs (Common Table Expressions) para obtener bookings pendientes:
       * 1. monthly_bookings: Todos los bookings del usuario en el mes especificado
       * 2. covered: Bookings que ya tienen un pago asociado en estados activos
       * 3. SELECT final: Bookings que NO están en 'covered' (los pendientes de pago)
       * 
       * NOTA: Se usa p.state::text para convertir el ENUM a texto y evitar errores
       * de comparación con tipos ENUM en PostgreSQL
       */
      const q = `
        WITH monthly_bookings AS (
          SELECT
            b.id               AS booking_id,
            s.schedule_date    AS schedule_date,
            k.name             AS student_name,
            u.name             AS parent_name,
            u.last_name        AS parent_last_name,
            c.name             AS course_name,
            c.cost::numeric(10,2) AS unit_cost
          FROM Booking b
          JOIN Kid k         ON k.id = b.kid_id          -- Relación: Booking → Kid (hijo)
          JOIN "User" u      ON u.id = k.parent_id       -- Relación: Kid → User (padre)
          JOIN Schedule s    ON s.id = b.schedule_id     -- Relación: Booking → Schedule (horario)
          JOIN Course c      ON c.id = b.course_id       -- Relación: Booking → Course (curso)
          WHERE k.parent_id = $1                         -- Filtra por el padre autenticado
            AND s.schedule_date >= $2::date              -- Desde el inicio del mes
            AND s.schedule_date <  $3::date              -- Hasta el inicio del mes siguiente (exclusivo)
        ),
        covered AS (
          -- Bookings que ya tienen un pago asociado en estados: solvente, pendiente o en revision
          SELECT DISTINCT pi.booking_id
          FROM Payment_item pi
          JOIN Payment p ON p.id = pi.payment_id
          WHERE p.state::text IN ('solvente', 'pendiente', 'en revision')
            AND p.payment_date >= $2::date
            AND p.payment_date <  $3::date
        )
        SELECT mb.*
        FROM monthly_bookings mb
        LEFT JOIN covered cv ON cv.booking_id = mb.booking_id
        WHERE cv.booking_id IS NULL                      -- Solo los bookings NO cubiertos
        ORDER BY mb.schedule_date, mb.student_name, mb.course_name;
      `;
      
      // Ejecuta la query con los parámetros: userId, fecha_inicio, fecha_fin
      const { rows } = await client.query(q, [userId, range.start, range.end]);

      // Calcula el total sumando los costos de todos los bookings pendientes
      const total = rows.reduce((acc, r) => acc + Number(r.unit_cost), 0);
      client.release();

      // Retorna la respuesta con información del padre, lista de items y total adeudado
      return res.json({
        month: monthStr,
        parent: { id: parent.id, name: parent.name, last_name: parent.last_name },
        items: rows,
        total_due: total.toFixed(2),
      });
    } catch (e) {
      client.release();
      throw e;
    }
  } catch (error) {
    console.error('getPendingPayments error:', error);
    return res.status(500).json({
      message: 'No se pudieron obtener los pagos pendientes. Intenta nuevamente.',
      detail: error?.message,
    });
  }
};

/**
 * POST /api/students/payments
 * Crea un nuevo pago para cubrir uno o varios bookings pendientes del usuario
 * El pago se crea en estado 'en revision' y debe ser aprobado por un administrador
 * @route POST /api/students/payments
 * @param {string} req.body.paymentMethod - Método de pago ('efectivo'|'transferencia'|'deposito' o variantes)
 * @param {string} req.body.month - (Opcional) Mes en formato 'YYYY-MM'
 * @param {Array<number>} req.body.bookingIds - (Opcional) IDs específicos de bookings a pagar
 * @param {string} req.body.referencePic - (Opcional) URL del comprobante de pago
 * @param {string} req.body.note - (Opcional) Nota adicional sobre el pago
 * @returns {Object} - Información del pago creado (ID, total, itemIds)
 */
export const createStudentPayment = async (req, res) => {
  // Obtiene el ID del usuario autenticado desde el token JWT
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'No autorizado' });

  // Extrae los parámetros del body, con valores por defecto para opcionales
  const {
    paymentMethod,
    referencePic = null,
    note = null,
    month,
    bookingIds,
  } = req.body || {};

  // Log de inicio con información del request para debugging
  console.log('[createStudentPayment] START - userId:', userId);
  console.log('[createStudentPayment] Request body:', {
    paymentMethod,
    month,
    bookingIds: bookingIds || 'null/undefined',
    hasReferencePic: !!referencePic,
    hasNote: !!note,
  });

  // Normaliza el método de pago (ej: 'transfer' → 'transferencia')
  const normalizedMethod = normalizeMethod(paymentMethod);
  
  // Valida que el método normalizado sea uno de los permitidos
  if (!normalizedMethod || !ALLOWED_METHODS.has(normalizedMethod)) {
    console.error('[createStudentPayment] ERROR: Invalid payment method:', paymentMethod);
    return res.status(400).json({
      message:
        "Método de pago inválido. Usa: 'efectivo', 'transferencia' o 'deposito'.",
    });
  }

  // Obtiene conexión a la BD del pool
  const client = await pool.connect();
  try {
    // Inicia una transacción SQL (permite hacer ROLLBACK si hay errores)
    await client.query('BEGIN');

    let targetBookings = []; // Array que contendrá los bookings a pagar
    const range = monthRange(month); // Calcula el rango de fechas del mes
    console.log('[createStudentPayment] Month range:', range);

    /**
     * CASO 1: El usuario especificó bookingIds específicos
     * Solo se pagarán esos bookings en particular
     */
    if (Array.isArray(bookingIds) && bookingIds.length > 0) {
      console.log('[createStudentPayment] Using specific bookingIds:', bookingIds);
      
      // Query para obtener solo los bookings especificados que cumplan las condiciones
      const q = `
        SELECT b.id AS booking_id, c.cost::numeric(10,2) AS unit_cost
        FROM Booking b
        JOIN Kid k      ON k.id = b.kid_id
        JOIN Schedule s ON s.id = b.schedule_id
        JOIN Course c   ON c.id = b.course_id
        WHERE k.parent_id = $1                           -- Deben pertenecer al usuario
          AND b.id = ANY($2::int[])                      -- Deben estar en la lista de IDs proporcionada
          AND s.schedule_date >= $3::date                -- Deben estar en el rango de fechas
          AND s.schedule_date <  $4::date
      `;
      const { rows } = await client.query(q, [userId, bookingIds, range.start, range.end]);
      console.log('[createStudentPayment] Specific bookings found:', rows.length);
      
      // Si no se encuentra ningún booking, significa que los IDs son inválidos
      if (rows.length === 0) {
        console.error('[createStudentPayment] ERROR: Specific bookings not found or not in range');
        throw new Error('Los bookings enviados no pertenecen al usuario o no están en el mes indicado.');
      }
      targetBookings = rows;
    /**
     * CASO 2: No se especificaron bookingIds
     * Se pagarán TODOS los bookings pendientes del mes
     */
    } else {
      console.log('[createStudentPayment] Fetching ALL pending bookings for month');
      
      // --- QUERIES DE DEBUG: Ayudan a diagnosticar problemas ---
      
      // Debug 1: Cuenta total de bookings del usuario (sin filtro de fecha)
      const debugBookings = await client.query(
        `SELECT COUNT(*) as total, 
                MIN(s.schedule_date) as earliest, 
                MAX(s.schedule_date) as latest
         FROM Booking b
         JOIN Kid k ON k.id = b.kid_id
         JOIN Schedule s ON s.id = b.schedule_id
         WHERE k.parent_id = $1`,
        [userId]
      );
      console.log('[createStudentPayment] DEBUG - Total bookings for user:', debugBookings.rows[0]);
      
      // Debug 2: Lista los hijos (kids) del usuario
      const debugKids = await client.query(
        `SELECT id, name, parent_id FROM Kid WHERE parent_id = $1`,
        [userId]
      );
      console.log('[createStudentPayment] DEBUG - Kids for this parent:', debugKids.rows);
      
      // Debug 3: Información del usuario (nombre, rol)
      const debugUser = await client.query(
        `SELECT id, name, last_name, role FROM "User" WHERE id = $1`,
        [userId]
      );
      console.log('[createStudentPayment] DEBUG - User info:', debugUser.rows[0]);
      
      /**
       * Query principal: Obtiene bookings pendientes (similiar al GET pending)
       * Usa CTEs para separar lógica:
       * - monthly_bookings: Todos los bookings del mes
       * - covered: Bookings ya cubiertos por pagos existentes
       * - Resultado: bookings que NO están en 'covered'
       */
      const q = `
        WITH monthly_bookings AS (
          SELECT
            b.id               AS booking_id,
            c.cost::numeric(10,2) AS unit_cost
          FROM Booking b
          JOIN Kid k       ON k.id = b.kid_id
          JOIN Schedule s  ON s.id = b.schedule_id
          JOIN Course c    ON c.id = b.course_id
          WHERE k.parent_id = $1
            AND s.schedule_date >= $2::date
            AND s.schedule_date <  $3::date
        ),
        covered AS (
          -- Bookings que YA tienen un pago asociado en estados activos
          SELECT DISTINCT pi.booking_id
          FROM Payment_item pi
          JOIN Payment p ON p.id = pi.payment_id
          WHERE p.state::text IN ('solvente', 'pendiente', 'en revision')
            AND p.payment_date >= $2::date
            AND p.payment_date <  $3::date
        )
        SELECT mb.*
        FROM monthly_bookings mb
        LEFT JOIN covered cv ON cv.booking_id = mb.booking_id
        WHERE cv.booking_id IS NULL;  -- Solo los NO cubiertos
      `;
      const { rows } = await client.query(q, [userId, range.start, range.end]);
      console.log('[createStudentPayment] Pending bookings found:', rows.length);
      
      // Debug 4: Cuenta bookings en el rango SIN filtrar por pagos (para comparar)
      const debugRange = await client.query(
        `SELECT COUNT(*) as total_in_range
         FROM Booking b
         JOIN Kid k ON k.id = b.kid_id
         JOIN Schedule s ON s.id = b.schedule_id
         WHERE k.parent_id = $1
           AND s.schedule_date >= $2::date
           AND s.schedule_date < $3::date`,
        [userId, range.start, range.end]
      );
      console.log('[createStudentPayment] DEBUG - Bookings in date range:', debugRange.rows[0].total_in_range);
      
      targetBookings = rows;
    }

    // Verifica que haya al menos un booking para pagar
    console.log('[createStudentPayment] Total targetBookings:', targetBookings.length);
    if (targetBookings.length === 0) {
      console.error('[createStudentPayment] ERROR: No pending bookings to pay');
      await client.query('ROLLBACK'); // Cancela la transacción
      return res.status(400).json({ message: 'No hay bookings pendientes para pagar.' });
    }

    // Calcula el total sumando el costo de cada booking
    const total = targetBookings.reduce((acc, r) => acc + Number(r.unit_cost), 0);
    console.log('[createStudentPayment] Total amount:', total.toFixed(2));

    /**
     * Crea el registro Payment en la tabla
     * Estado inicial: 'en revision' (debe ser aprobado por un admin)
     */
    const insertPayment = `
      INSERT INTO Payment (user_id, payment_method, total, payment_date, state, reference_pic, note)
      VALUES ($1, $2, $3, NOW(), 'en revision', $4, $5)
      RETURNING id;
    `;
    const payRes = await client.query(insertPayment, [
      userId,
      normalizedMethod,     // Método normalizado ('efectivo'|'transferencia'|'deposito')
      total.toFixed(2),     // Total calculado con 2 decimales
      referencePic,         // URL del comprobante (puede ser null)
      note,                 // Nota adicional (puede ser null)
    ]);
    const paymentId = payRes.rows[0].id;
    console.log('[createStudentPayment] Payment created with ID:', paymentId);

    /**
     * Crea un Payment_item por cada booking
     * Esto vincula cada clase reservada con el pago realizado
     */
    const itemIds = [];
    for (const row of targetBookings) {
      const insItem = `
        INSERT INTO Payment_item (payment_id, booking_id, book_id, unit_cost, subtotal)
        VALUES ($1, $2, NULL, $3, $3)
        RETURNING id;
      `;
      const itRes = await client.query(insItem, [
        paymentId,                              // ID del pago recién creado
        row.booking_id,                         // ID del booking que se está pagando
        Number(row.unit_cost).toFixed(2),      // Costo unitario y subtotal (son iguales)
      ]);
      itemIds.push(itRes.rows[0].id);
    }
    console.log('[createStudentPayment] Payment items created:', itemIds.length);

    // Confirma la transacción (guarda todos los cambios en la BD)
    await client.query('COMMIT');
    console.log('[createStudentPayment] SUCCESS - Transaction committed');
    
    // Retorna respuesta exitosa con información del pago creado
    return res.status(201).json({
      message: 'Pago creado en revisión.',
      paymentId,
      itemIds,
      total: total.toFixed(2),
    });
    
  } catch (error) {
    // Si hay cualquier error, hace ROLLBACK para cancelar todos los cambios
    try { await client.query('ROLLBACK'); } catch (_) {}
    
    // Log detallado del error para debugging
    console.error('[createStudentPayment] EXCEPTION:', error.message);
    console.error('[createStudentPayment] Stack:', error.stack);
    
    // Retorna error 500 al cliente
    return res.status(500).json({
      message: 'No se pudo registrar el pago. Revisa los datos y vuelve a intentar.',
      detail: error?.message,
    });
  } finally {
    // Siempre libera la conexión de vuelta al pool (éxito o error)
    client.release();
  }
};
