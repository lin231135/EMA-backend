// src/controllers/student/studentPaymentProof.controller.js
import pool from '../../db/connection.js';

/**
 * Actualiza múltiples pagos pendientes con comprobante
 * POST /api/students/payments/upload-proof
 * 
 * Recibe los IDs de los pagos y el comprobante
 * Cambia el estado de 'pendiente' a 'en revision'
 */
export const uploadPaymentProof = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { payment_ids, reference_pic, notes } = req.body;

    if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
      return res.status(400).json({ error: 'payment_ids es requerido y debe ser un array' });
    }

    if (!reference_pic) {
      return res.status(400).json({ error: 'reference_pic es requerido' });
    }

    await client.query('BEGIN');

    // Verificar que todos los pagos pertenecen al usuario y están en estado 'pendiente'
    const placeholders = payment_ids.map((_, i) => `$${i + 2}`).join(', ');
    const checkQuery = `
      SELECT id, state, user_id
      FROM Payment
      WHERE id IN (${placeholders})
        AND user_id = $1
    `;
    
    const checkResult = await client.query(checkQuery, [userId, ...payment_ids]);

    if (checkResult.rows.length !== payment_ids.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        error: 'Algunos pagos no fueron encontrados o no pertenecen al usuario' 
      });
    }

    // Verificar que todos están en estado 'pendiente'
    const nonPendingPayments = checkResult.rows.filter(p => p.state !== 'pendiente');
    if (nonPendingPayments.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Solo se pueden actualizar pagos en estado pendiente',
        non_pending: nonPendingPayments.map(p => ({ id: p.id, state: p.state }))
      });
    }

    // Actualizar todos los pagos
    // Construir placeholders dinámicamente
    const updatePlaceholders = payment_ids.map((_, i) => `$${i + 2}`).join(', ');
    
    // Construir query con o sin nota
    let updateQuery;
    let queryParams;
    
    if (notes) {
      updateQuery = `
        UPDATE Payment
        SET reference_pic = $1,
            state = 'en revision'::paymentstate,
            note = $${payment_ids.length + 2}
        WHERE id IN (${updatePlaceholders})
          AND user_id = $${payment_ids.length + 3}
        RETURNING id, user_id, payment_method, total, payment_date, state, reference_pic, note
      `;
      queryParams = [reference_pic, ...payment_ids, notes, userId];
    } else {
      updateQuery = `
        UPDATE Payment
        SET reference_pic = $1,
            state = 'en revision'::paymentstate
        WHERE id IN (${updatePlaceholders})
          AND user_id = $${payment_ids.length + 2}
        RETURNING id, user_id, payment_method, total, payment_date, state, reference_pic, note
      `;
      queryParams = [reference_pic, ...payment_ids, userId];
    }

    const updateResult = await client.query(updateQuery, queryParams);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Comprobante(s) subido(s) exitosamente',
      payments: updateResult.rows
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en uploadPaymentProof:', error);
    res.status(500).json({ error: 'Error al subir el comprobante' });
  } finally {
    client.release();
  }
};

export default { uploadPaymentProof };
