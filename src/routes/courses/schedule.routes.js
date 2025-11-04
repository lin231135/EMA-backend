// src/routes/courses/schedule.routes.js
import { Router } from 'express';
import { verifyToken, isTeacher } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createScheduleSchema, courseIdParamSchema } from '../../validators/courses/schedule.schema.js';
import { 
  createSchedule, 
  getAllSchedules, 
  getSchedulesByCourse 
} from '../../controllers/schedule.controller.js';

const router = Router();

/**
 * GET /api/schedules
 * Obtiene todos los horarios programados
 * Requiere autenticación
 */
router.get(
  '/',
  verifyToken,
  getAllSchedules
);

/**
 * POST /api/schedules
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

/**
 * GET /api/schedules/:courseId
 * Obtiene todos los horarios de un curso específico
 * Requiere autenticación
 */
router.get(
  '/:courseId',
  verifyToken,
  validate(courseIdParamSchema),
  getSchedulesByCourse
);

export default router;
