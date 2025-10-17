import { Router } from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  confirmPayment,
  rejectPayment
} from '../../controllers/admin/payments.controller.js';
import {
  validate,
  createPaymentSchema,
  updatePaymentSchema,
  confirmPaymentSchema,
  rejectPaymentSchema
} from '../../validators/admin/payments.schema.js';

const router = Router();

/**
 * @route   GET /api/admins/payments
 * @desc    Obtener TODOS los pagos (sin filtros - se manejan en frontend)
 * @access  Admin
 * @note    Los estudiantes se obtienen desde Payment_item -> Booking -> Kid
 */
router.get(
  '/',
  getPayments
);

/**
 * @route   POST /api/admins/payments
 * @desc    Crear un pago manualmente (principalmente efectivo)
 * @access  Admin
 * @body    user_id, payment_method, total, payment_date, booking_ids, state, reference_pic, note
 * @note    Por defecto crea el pago como 'en revision' (pendiente de confirmar)
 */
router.post(
  '/',
  validate(createPaymentSchema),
  createPayment
);

/**
 * @route   GET /api/admins/payments/:id
 * @desc    Obtener un pago específico por ID con sus items y estudiantes
 * @access  Admin
 * @params  id
 */
router.get(
  '/:id',
  getPayment
);

/**
 * @route   PUT /api/admins/payments/:id
 * @desc    Actualizar datos de un pago
 * @access  Admin
 * @params  id
 * @body    payment_method, total, payment_date, state, reference_pic, note
 * @note    Currency no editable (todos los pagos son en USD)
 */
router.put(
  '/:id',
  validate(updatePaymentSchema),
  updatePayment
);

/**
 * @route   PATCH /api/admins/payments/:id/confirm
 * @desc    Confirmar un pago (cambiar estado a 'solvente')
 * @access  Admin
 * @params  id
 * @body    note (opcional)
 * @note    Actualiza is_solvent de estudiantes asociados via Payment_item
 */
router.patch(
  '/:id/confirm',
  validate(confirmPaymentSchema),
  confirmPayment
);

/**
 * @route   PATCH /api/admins/payments/:id/reject
 * @desc    Rechazar un pago (cambiar estado a 'rechazado')
 * @access  Admin
 * @params  id
 * @body    note (obligatorio)
 */
router.patch(
  '/:id/reject',
  validate(rejectPaymentSchema),
  rejectPayment
);

export default router;
