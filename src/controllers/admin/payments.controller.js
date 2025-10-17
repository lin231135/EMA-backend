import pool from '../../db/connection.js';

// Alias para mantener consistencia con el código existente
const db = pool;

/**
 * Obtener todos los pagos (sin filtros - se manejan en frontend)
 * GET /api/admins/payments
 * NOTA: Los estudiantes se obtienen desde Payment_item -> Booking -> Kid
 */
export const getPayments = async (req, res) => {
  try {
    // Consulta optimizada: un registro por pago con estudiantes agrupados
    const query = `
      SELECT 
        p.id,
        u.name || ' ' || u.last_name as parent_name,
        u.email as parent_email,
        p.payment_method,
        p.total,
        p.payment_date,
        p.state,
        p.reference_pic,
        (
          SELECT string_agg(DISTINCT k.name, ', ')
          FROM Payment_item pi
          LEFT JOIN Booking b ON pi.booking_id = b.id
          LEFT JOIN Kid k ON b.kid_id = k.id
          WHERE pi.payment_id = p.id AND k.name IS NOT NULL
        ) as students,
        (
          SELECT COUNT(DISTINCT b.kid_id)
          FROM Payment_item pi
          LEFT JOIN Booking b ON pi.booking_id = b.id
          WHERE pi.payment_id = p.id AND b.kid_id IS NOT NULL
        ) as students_count
      FROM Payment p
      JOIN "User" u ON p.user_id = u.id
      ORDER BY p.payment_date DESC, p.id DESC
    `;

    const result = await db.query(query);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al obtener los pagos' });
  }
};

/**
 * Crear un pago manualmente (Admin)
 * POST /api/admins/payments
 * Body: { user_id, payment_method, total, payment_date, booking_ids, state, reference_pic, note }
 * FLUJO: Padre registra pago → estado 'en revision' → Admin confirma/rechaza/cancela
 */
export const createPayment = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    const {
      user_id,
      payment_method,
      total,
      payment_date,
      booking_ids, // Array de IDs de bookings a pagar
      state = 'en revision', // Por defecto en revisión (admin debe confirmar)
      reference_pic = null,
      note = null
    } = req.body;

    // 1. Crear el pago
    const paymentResult = await client.query(
      `INSERT INTO Payment (user_id, payment_method, total, payment_date, state, reference_pic, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, payment_method, total, payment_date, state, reference_pic, note]
    );

    const payment = paymentResult.rows[0];

    // 2. Si hay booking_ids, crear los Payment_items
    if (booking_ids && booking_ids.length > 0) {
      for (const booking_id of booking_ids) {
        // Obtener info del booking para calcular subtotal
        const bookingInfo = await client.query(
          `SELECT b.id, c.cost 
           FROM Booking b
           JOIN Course c ON b.course_id = c.id
           WHERE b.id = $1`,
          [booking_id]
        );

        if (bookingInfo.rows.length > 0) {
          const unit_cost = bookingInfo.rows[0].cost;
          
          await client.query(
            `INSERT INTO Payment_item (payment_id, booking_id, unit_cost, subtotal)
             VALUES ($1, $2, $3, $4)`,
            [payment.id, booking_id, unit_cost, unit_cost]
          );
        }
      }

      // 3. NO actualizar is_solvent aquí - solo cuando se confirme el pago
            // Valores predeterminados
      // El estado inicial es 'en revision', no 'aceptado'
      // is_solvent se actualiza cuando el admin confirma el pago
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pago creado exitosamente',
      payment: payment
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear pago:', error);
    res.status(500).json({ error: 'Error al crear el pago' });
  } finally {
    client.release();
  }
};

/**
 * Obtener un pago específico por ID
 * GET /api/admins/payments/:id
 * NOTA: Los estudiantes se obtienen desde Payment_item -> Booking -> Kid
 */
export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        p.id,
        p.user_id,
        u.name as parent_name,
        u.last_name as parent_last_name,
        u.email as parent_email,
        u.phone as parent_phone,
        p.payment_method,
        p.total,
        p.payment_date,
        p.state,
        p.reference_pic,
        p.note
      FROM Payment p
      JOIN "User" u ON p.user_id = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Obtener items del pago con información de estudiantes
    const itemsResult = await db.query(
      `SELECT 
        pi.id,
        pi.booking_id,
        pi.book_id,
        pi.unit_cost,
        pi.subtotal,
        b.name as book_name,
        bk.schedule_id,
        bk.kid_id,
        k.name as student_name,
        c.name as course_name
      FROM Payment_item pi
      LEFT JOIN Book b ON pi.book_id = b.id
      LEFT JOIN Booking bk ON pi.booking_id = bk.id
      LEFT JOIN Kid k ON bk.kid_id = k.id
      LEFT JOIN Course c ON bk.course_id = c.id
      WHERE pi.payment_id = $1`,
      [id]
    );

    const payment = {
      ...result.rows[0],
      items: itemsResult.rows
    };

    res.status(200).json({ payment });

  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ error: 'Error al obtener el pago' });
  }
};

/**
 * Actualizar un pago (editar campos)
 * PUT /api/admins/payments/:id
 * NOTA: No se edita kid_id ni currency (no existen en la tabla actual)
 */
export const updatePayment = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      payment_method,
      total,
      payment_date,
      state,
      reference_pic,
      note
    } = req.body;

    // Verificar que el pago existe
    const paymentCheck = await client.query(
      'SELECT id, user_id FROM Payment WHERE id = $1',
      [id]
    );

    if (paymentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (payment_method !== undefined) {
      updates.push(`payment_method = $${valueIndex}`);
      values.push(payment_method);
      valueIndex++;
    }

    if (total !== undefined) {
      updates.push(`total = $${valueIndex}`);
      values.push(total);
      valueIndex++;
    }

    if (payment_date !== undefined) {
      updates.push(`payment_date = $${valueIndex}`);
      values.push(payment_date);
      valueIndex++;
    }

    if (state !== undefined) {
      updates.push(`state = $${valueIndex}`);
      values.push(state);
      valueIndex++;
    }

    if (reference_pic !== undefined) {
      updates.push(`reference_pic = $${valueIndex}`);
      values.push(reference_pic);
      valueIndex++;
    }

    if (note !== undefined) {
      updates.push(`note = $${valueIndex}`);
      values.push(note);
      valueIndex++;
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'No se proporcionaron campos para actualizar' 
      });
    }

    values.push(id);

    const result = await client.query(
      `UPDATE Payment 
       SET ${updates.join(', ')} 
       WHERE id = $${valueIndex} 
       RETURNING *`,
      values
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Pago actualizado exitosamente',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ error: 'Error al actualizar el pago' });
  } finally {
    client.release();
  }
};

/**
 * Confirmar un pago (cambiar estado a 'aceptado')
 * PATCH /api/admins/payments/:id/confirm
 * NOTA: Actualiza is_solvent de los estudiantes asociados via Payment_item -> Booking -> Kid
 */
export const confirmPayment = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { note } = req.body;

    // Verificar que el pago existe
    const paymentCheck = await client.query(
      'SELECT id, state FROM Payment WHERE id = $1',
      [id]
    );

    if (paymentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Verificar que el pago no esté ya confirmado
    if (paymentCheck.rows[0].state === 'aceptado') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'El pago ya está confirmado como aceptado' 
      });
    }

    // Actualizar estado del pago a 'aceptado'
    const result = await client.query(
      `UPDATE Payment 
       SET state = 'aceptado', note = $1 
       WHERE id = $2 
       RETURNING *`,
      [note || null, id]
    );

    // Actualizar is_solvent de todos los estudiantes asociados a este pago
    await client.query(
      `UPDATE Kid 
       SET is_solvent = TRUE 
       WHERE id IN (
         SELECT DISTINCT b.kid_id
         FROM Payment_item pi
         JOIN Booking b ON pi.booking_id = b.id
         WHERE pi.payment_id = $1 AND b.kid_id IS NOT NULL
       )`,
      [id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Pago confirmado exitosamente',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: 'Error al confirmar el pago' });
  } finally {
    client.release();
  }
};

/**
 * Rechazar un pago (cambiar estado a 'rechazado')
 * PATCH /api/admins/payments/:id/reject
 */
export const rejectPayment = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { note } = req.body;

    // Verificar que el pago existe
    const paymentCheck = await client.query(
      'SELECT id, state FROM Payment WHERE id = $1',
      [id]
    );

    if (paymentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Actualizar estado del pago a 'rechazado'
    const result = await client.query(
      `UPDATE Payment 
       SET state = 'rechazado', note = $1 
       WHERE id = $2 
       RETURNING *`,
      [note, id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Pago rechazado',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al rechazar pago:', error);
    res.status(500).json({ error: 'Error al rechazar el pago' });
  } finally {
    client.release();
  }
};

export default {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  confirmPayment,
  rejectPayment
};
