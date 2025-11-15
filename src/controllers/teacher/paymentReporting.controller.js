// src/controllers/teacher/paymentReporting.controller.js

import PaymentReportingService from '../../services/teacher/paymentReporting.service.js';

/**
 * Controller for handling payment reporting by teachers.
 */
class PaymentReportingController {
  /**
   * Get a list of pending payments for the teacher.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  static async getPendingPayments(req, res) {
    try {
      // Asumiendo que el middleware de auth carga el usuario en req.user
      const teacherId = req.user.id;
      const pendingPayments = await PaymentReportingService.getPendingPayments(teacherId);

      return res.status(200).json(pendingPayments);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      return res.status(500).json({ message: 'Error fetching pending payments' });
    }
  }

  /**
   * Update the status of a payment to 'revision'.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  static async updatePaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const teacherId = req.user.id;

      const updatedPayment = await PaymentReportingService.updatePaymentStatus(
        paymentId,
        teacherId
      );

      if (!updatedPayment) {
        return res.status(404).json({ message: 'Payment not found or not owned by teacher' });
      }

      return res.status(200).json(updatedPayment);
    } catch (error) {
      console.error('Error updating payment status:', error);
      return res.status(500).json({ message: 'Error updating payment status' });
    }
  }

  /**
   * Report an incorrect or unreceived payment.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  static async reportIncorrectPayment(req, res) {
    try {
      const { paymentId, reason } = req.body;
      const teacherId = req.user.id;

      if (!paymentId || !reason) {
        return res.status(400).json({ message: 'paymentId and reason are required' });
      }

      const report = await PaymentReportingService.reportIncorrectPayment(
        paymentId,
        reason,
        teacherId
      );

      return res.status(201).json(report);
    } catch (error) {
      console.error('Error reporting incorrect payment:', error);
      return res.status(500).json({ message: 'Error reporting incorrect payment' });
    }
  }
}

export default PaymentReportingController;