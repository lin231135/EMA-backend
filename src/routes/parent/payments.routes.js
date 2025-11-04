import { Router } from 'express';
import { createPayment } from '../../controllers/admin/payments.controller.js';
import {
  validate,
  createPaymentSchema
} from '../../validators/admin/payments.schema.js';

const router = Router();

/**
 * @route   POST /api/parents/payments
 * @desc    Crear un pago como padre (siempre en revisión)
 * @access  Parent
 * @body    user_id, payment_method, total, payment_date, booking_ids, state, reference_pic, note
 * @note    Los pagos de padres siempre se crean con estado 'en revision'
 *          El padre debe subir comprobante obligatorio
 */
router.post(
  '/',
  validate(createPaymentSchema),
  createPayment
);

export default router;
