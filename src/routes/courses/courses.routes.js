// src/routes/courses.routes.js
import { Router } from 'express';
import { verifyToken, isAdmin } from '../../middlewares/auth.js';
import { createCourse } from '../../controllers/course.controller.js';
import { createCourseSchema } from '../../validators/courses/course.schema.js';
import { validate } from '../../middlewares/validate.js';

const router = Router();

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
