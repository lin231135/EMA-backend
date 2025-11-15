// src/services/teacher/paymentReporting.service.js

import db from '../../db/connection.js';

/**
 * Service for handling payment reporting logic on the backend.
 * - Lista pagos pendientes para un maestro
 * - Cambia el estado a "revision"
 * - Crea un reporte de pago incorrecto/no recibido
 */
class PaymentReportingService {
  /**
   * Get a list of pending payments for a teacher.
   * @param {number} teacherId
   * @returns {Promise<Array>} List of pending payments.
   */
  static async getPendingPayments(teacherId) {
    const query = `
      SELECT
        p.id,
        p.amount,
        p.status,
        p.payment_method,
        p.created_at,
        -- campos opcionales para que el front muestre nombres
        pa.name  AS parent_name,
        s.name   AS student_name
      FROM payments p
      LEFT JOIN parents pa ON pa.id = p.parent_id
      LEFT JOIN students s ON s.id = p.student_id
      WHERE p.teacher_id = $1
        AND p.status = 'pending'
        AND p.payment_method = 'cash';
    `;

    const { rows } = await db.query(query, [teacherId]);
    return rows;
  }

  /**
   * Update the status of a payment to 'revision'.
   * Solo actualiza si el pago pertenece al maestro.
   * @param {number} paymentId
   * @param {number} teacherId
   * @returns {Promise<Object | undefined>} Updated payment record.
   */
  static async updatePaymentStatus(paymentId, teacherId) {
    const query = `
      UPDATE payments
      SET status = 'revision'
      WHERE id = $1
        AND teacher_id = $2
      RETURNING *;
    `;

    const { rows } = await db.query(query, [paymentId, teacherId]);
    return rows[0];
  }

  /**
   * Report an incorrect or unreceived payment.
   * @param {number} paymentId
   * @param {string} reason
   * @param {number} teacherId
   * @returns {Promise<Object>} Payment report record.
   */
  static async reportIncorrectPayment(paymentId, reason, teacherId) {
    const query = `
      INSERT INTO payment_reports (payment_id, reason, teacher_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;

    const { rows } = await db.query(query, [paymentId, reason, teacherId]);
    return rows[0];
  }
}

export default PaymentReportingService;