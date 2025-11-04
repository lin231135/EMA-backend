// src/routes/courses/schedule.routes.js
import { Router } from 'express';
import { verifyToken, isTeacher } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createScheduleSchema } from '../../validators/courses/schedule.schema.js';
import { createSchedule } from '../../controllers/schedule.controller.js';

const router = Router();

/**
 * POST /api/courses/schedules
 * Crea un nuevo horario para un curso
 * Requiere autenticación y rol de maestro
 * El teacher_id se obtiene del JWT
 */
router.post(
  '/',
  verifyToken,
  isTeacher,
  validate(createScheduleSchema),
  createSchedule
);

export default router;
