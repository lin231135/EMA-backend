// src/routes/admin/bookings.routes.js
import { Router } from 'express';
import { getUnpaidBookingsByParent } from '../../controllers/admin/bookings.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

/**
 * @route   GET /api/admins/bookings/unpaid
 * @desc    Obtiene bookings sin pagar de los hijos de un padre
 * @access  Admin, Padre
 */
router.get(
  '/unpaid',
  authenticate(['admin', 'padre']),
  getUnpaidBookingsByParent
);

export default router;
