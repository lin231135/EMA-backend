import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createBookingSchema } from '../../validators/booking.schema.js';
import { createBooking } from '../../controllers/app/bookings.controller.js';

const router = Router();

// POST /api/bookings - Crear un nuevo booking
router.post('/', verifyToken, validate(createBookingSchema), createBooking);

export default router;
