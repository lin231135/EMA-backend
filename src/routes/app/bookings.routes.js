import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createBookingSchema, getBookingByIdSchema } from '../../validators/booking.schema.js';
import { createBooking, getUserBookings, getBookingById } from '../../controllers/app/bookings.controller.js';

const router = Router();

// GET /api/bookings - Obtener todos los bookings del usuario autenticado
router.get('/', verifyToken, getUserBookings);

// POST /api/bookings - Crear un nuevo booking
router.post('/', verifyToken, validate(createBookingSchema), createBooking);

// GET /api/bookings/:id - Obtener un booking por ID
router.get('/:id', verifyToken, validate(getBookingByIdSchema), getBookingById);

export default router;
