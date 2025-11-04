// src/routes/courses.routes.js
import { Router } from 'express';
import { verifyToken, isAdmin } from '../../middlewares/auth.js';
import { createCourse, getActiveCourses } from '../../controllers/course.controller.js';
import { createCourseSchema } from '../../validators/courses/course.schema.js';
import { validate } from '../../middlewares/validate.js';

const router = Router();

/**
 * GET /api/courses
 * Obtener todos los cursos activos
 * @access Público
 */
router.get(
  '/',
  verifyToken,
  getActiveCourses
);

/**
 * POST /api/courses
 * Crear un nuevo curso
 * @access Privado - Solo Admin
 */
router.post(
  '/',
  verifyToken,
  isAdmin,
  validate(createCourseSchema),
  createCourse
);

export default router;
