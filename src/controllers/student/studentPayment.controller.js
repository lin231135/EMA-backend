// src/controllers/student/studentPayment.controller.js
//
// Este controlador maneja los pagos de estudiantes/padres de familia.
// Permite consultar bookings pendientes de pago y crear nuevos pagos.
//
// Flujo de pagos:
// 1. El padre/estudiante consulta sus bookings pendientes del mes (GET /payments/pending)
// 2. Crea un pago eligiendo método y adjuntando comprobante (POST /payments)
// 3. El pago queda en estado "en revisión" hasta que un admin lo apruebe
// 4. Una vez aprobado, el estado cambia a "solvente"

import pool from '../../db/connection.js';
import { DateTime } from 'luxon';

/**
 * Normaliza un mes en formato YYYY-MM a un rango de fechas [inicio, fin)
 * 
 * @param {string|undefined} yyyyMM - Mes en formato 'YYYY-MM' (ej: '2025-10'). Si no se proporciona, usa el mes actual.
 * @returns {Object} Objeto con propiedades start y end en formato ISO (YYYY-MM-DD)
 * @returns {string} return.start - Primer día del mes (inicio del rango)
 * @returns {string} return.end - Primer día del mes siguiente (fin del rango, no inclusivo)
 * 
 */
function monthRange(yyyyMM) {
  const base = yyyyMM
    ? DateTime.fromFormat(yyyyMM, 'yyyy-MM', { zone: 'utc' })
    : DateTime.utc(); // mes actual si no envían
  const start = base.startOf('month');
  const end = start.plus({ months: 1 });
  return {
    start: start.toISODate(), // YYYY-MM-DD
    end: end.toISODate()
  };
}

/**
 * GET /api/students/payments/pending
 * 
 * Obtiene todos los bookings pendientes de pago para el usuario autenticado en un mes específico.
 * 
 * Un booking se considera "pendiente" cuando:
 * - Pertenece a un hijo (Kid) del usuario autenticado
 * - Tiene una fecha (schedule_date) dentro del mes consultado
 * - NO está asociado a un Payment_item de un pago con estado 'solvente', 'pendiente' o 'en revision' del mismo mes
 * 
 * @returns {Object} 200 - Información de pagos pendientes
 * @returns {string} return.month - Mes consultado en formato 'YYYY-MM'
 * @returns {Object} return.parent - Información del padre/adulto
 * @returns {number} return.parent.id - ID del usuario
 * @returns {string} return.parent.name - Nombre del usuario
 * @returns {string} return.parent.last_name - Apellido del usuario
 * @returns {Array<Object>} return.items - Lista de bookings pendientes
 * @returns {number} return.items[].booking_id - ID del booking
 * @returns {string} return.items[].schedule_date - Fecha de la clase en formato ISO
 * @returns {string} return.items[].student_name - Nombre del estudiante
 * @returns {string} return.items[].parent_name - Nombre del padre
 * @returns {string} return.items[].parent_last_name - Apellido del padre
 * @returns {string} return.items[].course_name - Nombre del curso
 * @returns {string} return.items[].unit_cost - Costo unitario del curso (formato decimal)
 * @returns {string} return.total_due - Total a pagar (suma de todos los unit_cost)
 * 
 * @returns {Object} 401 - Usuario no autorizado
 * @returns {Object} 404 - Usuario no encontrado
 * @returns {Object} 500 - Error del servidor
 */
export const getPendingPayments = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'No autorizado' });

  try {
    const { month } = req.query;
    const range = monthRange(month);
    const monthStr = (month || DateTime.fromISO(range.start).toFormat('yyyy-MM'));

    const client = await pool.connect();

    try {
      // Traemos al padre/adulto del sistema
      const parentRes = await client.query(
        `SELECT id, name, last_name
         FROM "User"
         WHERE id = $1`,
        [userId]
      );
      if (parentRes.rowCount === 0) {
        client.release();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const parent = parentRes.rows[0];

      // Query principal: obtiene bookings del mes que NO estén cubiertos por un pago existente
      // 
      // Lógica:
      // 1. monthly_bookings: Todos los bookings del usuario en el rango del mes
      // 2. covered: IDs de bookings que ya tienen Payment_item asociado a un pago válido
      // 3. Resultado final: bookings del mes que NO están en covered (LEFT JOIN + WHERE NULL)
      //
      // Estados de pago considerados como "cubiertos":
      // - 'solvente': Pago aprobado y confirmado
      // - 'pendiente': Pago creado pero no confirmado aún
      // - 'en revision': Pago enviado, esperando aprobación del admin
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
          JOIN Kid k         ON k.id = b.kid_id
          JOIN "User" u      ON u.id = k.parent_id
          JOIN Schedule s    ON s.id = b.schedule_id
          JOIN Course c      ON c.id = b.course_id
          WHERE k.parent_id = $1
            AND s.schedule_date >= $2::date
            AND s.schedule_date <  $3::date
        ),
        covered AS (
          SELECT DISTINCT pi.booking_id
          FROM Payment_item pi
          JOIN Payment p ON p.id = pi.payment_id
          WHERE p.state IN ('solvente', 'pendiente', 'en revision')

            AND p.payment_date >= $2::date
            AND p.payment_date <  $3::date
        )
        SELECT mb.*
        FROM monthly_bookings mb
        LEFT JOIN covered cv ON cv.booking_id = mb.booking_id
        WHERE cv.booking_id IS NULL
        ORDER BY mb.schedule_date, mb.student_name, mb.course_name;
      `;
      const { rows } = await client.query(q, [userId, range.start, range.end]);

      // Calcula el total sumando todos los costos de los bookings pendientes
      const total = rows.reduce((acc, r) => acc + Number(r.unit_cost), 0);

      client.release();

      return res.json({
        month: monthStr,
        parent: {
          id: parent.id,
          name: parent.name,
          last_name: parent.last_name
        },
        items: rows,
        total_due: total.toFixed(2)
      });
    } catch (e) {
      client.release();
      throw e;
    }
  } catch (error) {
    console.error('getPendingPayments error:', error);
    return res.status(500).json({
      message: 'No se pudieron obtener los pagos pendientes. Intenta nuevamente.',
      detail: error?.message
    });
  }
};

/**
 * POST /api/students/payments
 * 
 * Crea un nuevo pago para bookings pendientes del usuario autenticado.
 * El pago se crea en estado "en revision" y debe ser aprobado por un administrador.
 * 
 * Proceso de creación:
 * 1. Valida que el usuario esté autenticado y que se proporcione método de pago
 * 2. Determina qué bookings pagar (todos los pendientes del mes o solo los especificados)
 * 3. Calcula el total sumando los costos de todos los bookings
 * 4. Crea un registro Payment con estado "en revision"
 * 5. Crea un Payment_item por cada booking asociado al pago
 * 6. Retorna la información del pago creado
 * 
 * @route POST /api/students/payments
 * @access Private (requiere token JWT válido)
 * 
 * @bodyparam {string} paymentMethod - Método de pago: 'efectivo', 'transferencia' o 'deposito' (REQUERIDO)
 * @bodyparam {string} [referencePic] - URL de la imagen del comprobante de pago (opcional)
 * @bodyparam {string} [note] - Nota o comentario adicional sobre el pago (opcional)
 * @bodyparam {string} [month] - Mes a pagar en formato 'YYYY-MM'. Si no se envía, usa el mes actual
 * @bodyparam {Array<number>} [bookingIds] - IDs específicos de bookings a pagar. Si no se envía, paga TODOS los pendientes del mes
 * 
 * @returns {Object} 201 - Pago creado exitosamente
 * @returns {string} return.message - Mensaje de confirmación
 * @returns {number} return.paymentId - ID del pago creado
 * @returns {Array<number>} return.itemIds - IDs de los Payment_item creados
 * @returns {string} return.total - Total del pago en formato decimal
 * 
 * @returns {Object} 400 - Datos inválidos o no hay bookings pendientes
 * @returns {Object} 401 - Usuario no autorizado
 * @returns {Object} 500 - Error del servidor
 */
export const createStudentPayment = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'No autorizado' });

  const {
    paymentMethod,
    referencePic = null,
    note = null,
    month,
    bookingIds 
  } = req.body || {};

  if (!paymentMethod) {
    return res.status(400).json({ message: 'Falta el método de pago.' });
  }

  const client = await pool.connect();
  try {
    // Inicia transacción para garantizar atomicidad
    // Si algo falla, se hace ROLLBACK de todos los cambios
    await client.query('BEGIN');

    // Determinar qué bookings se van a pagar
    let targetBookings = [];
    const range = monthRange(month);

    if (Array.isArray(bookingIds) && bookingIds.length > 0) {
      // CASO 1: El usuario especificó bookings específicos
      // Valida que todos los bookings:
      // - Pertenezcan al usuario autenticado
      // - Estén dentro del rango de fechas del mes especificado
      const q = `
        SELECT b.id AS booking_id, c.cost::numeric(10,2) AS unit_cost
        FROM Booking b
        JOIN Kid k      ON k.id = b.kid_id
        JOIN Schedule s ON s.id = b.schedule_id
        JOIN Course c   ON c.id = b.course_id
        WHERE k.parent_id = $1
          AND b.id = ANY($2::int[])
          AND s.schedule_date >= $3::date
          AND s.schedule_date <  $4::date
      `;
      const { rows } = await client.query(q, [userId, bookingIds, range.start, range.end]);

      if (rows.length === 0) {
        throw new Error('Los bookings enviados no pertenecen al usuario o no están en el mes indicado.');
      }
      targetBookings = rows;
    } else {
      // CASO 2: No se especificaron bookings, tomar TODOS los pendientes del mes
      // Usa la misma lógica que el GET para obtener bookings no cubiertos
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
          SELECT DISTINCT pi.booking_id
          FROM Payment_item pi
          JOIN Payment p ON p.id = pi.payment_id
          WHERE p.state IN ('solvente', 'en revision')
            AND p.payment_date >= $2::date
            AND p.payment_date <  $3::date
        )
        SELECT mb.*
        FROM monthly_bookings mb
        LEFT JOIN covered cv ON cv.booking_id = mb.booking_id
        WHERE cv.booking_id IS NULL;
      `;
      const { rows } = await client.query(q, [userId, range.start, range.end]);
      targetBookings = rows;
    }

    // Validación: Si no hay bookings para pagar, retornar error
    if (targetBookings.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No hay bookings pendientes para pagar.' });
    }

    // Calcula el total del pago sumando todos los costos unitarios
    const total = targetBookings.reduce((acc, r) => acc + Number(r.unit_cost), 0);

    // PASO 1: Crear el registro de Payment
    // - user_id: Usuario que realiza el pago
    // - payment_method: Forma de pago seleccionada
    // - total: Monto total calculado
    // - payment_date: Fecha actual (NOW())
    // - state: 'en revision' (requiere aprobación del admin)
    // - reference_pic: Imagen del comprobante (opcional)
    // - note: Nota adicional (opcional)
    const insertPayment = `
      INSERT INTO Payment (user_id, payment_method, total, payment_date, state, reference_pic, note)
      VALUES ($1, $2, $3, NOW(), 'en revision', $4, $5)
      RETURNING id;
    `;
    const payRes = await client.query(insertPayment, [
      userId, paymentMethod, total.toFixed(2), referencePic, note
    ]);
    const paymentId = payRes.rows[0].id;

    // PASO 2: Crear un Payment_item por cada booking
    // Esto vincula cada booking con el pago creado
    // - payment_id: ID del pago creado
    // - booking_id: ID del booking que se está pagando
    // - book_id: NULL (no aplica para pagos de bookings)
    // - unit_cost: Costo del curso
    // - subtotal: Mismo valor que unit_cost (para bookings individuales)
    const itemIds = [];
    for (const row of targetBookings) {
      const insItem = `
        INSERT INTO Payment_item (payment_id, booking_id, book_id, unit_cost, subtotal)
        VALUES ($1, $2, NULL, $3, $3)
        RETURNING id;
      `;
      const itRes = await client.query(insItem, [
        paymentId,
        row.booking_id,
        Number(row.unit_cost).toFixed(2)
      ]);
      itemIds.push(itRes.rows[0].id);
    }

    // Si todo salió bien, confirma la transacción
    await client.query('COMMIT');

    // Retorna información del pago creado
    return res.status(201).json({
      message: 'Pago creado en revisión.',
      paymentId,
      itemIds,
      total: total.toFixed(2)
    });
  } catch (error) {
    // En caso de error, revierte todos los cambios de la transacción
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('createStudentPayment error:', error);
    return res.status(500).json({
      message: 'No se pudo registrar el pago. Revisa los datos y vuelve a intentar.',
      detail: error?.message
    });
  } finally {
    // Siempre libera la conexión de la base de datos
    client.release();
  }
};
