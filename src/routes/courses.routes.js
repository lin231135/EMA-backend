// src/routes/courses.routes.js
import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} from '../controllers/course.controller.js';

const router = Router();

// Listar y crear
router.get('/', verifyToken, getCourses);
router.post('/', verifyToken, createCourse);

// Obtener, actualizar, eliminar por id
router.get('/:id', verifyToken, getCourseById);
router.patch('/:id', verifyToken, updateCourse);
router.delete('/:id', verifyToken, deleteCourse);

export default router;
