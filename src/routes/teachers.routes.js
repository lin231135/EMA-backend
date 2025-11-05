import { Router } from 'express';
import {
  getCalendar,
  addClass,
  getClassFeedback,
  addClassFeedback
} from '../controllers/schedule.controller.js';

import {
  getCourses,
  getTodayClasses,
  getCourseStudents
} from '../controllers/teacher/teacher.controller.js';

import { getStudentsReport } from '../controllers/student.report.controller.js';
import materialRoutes from './teacher/material.routes.js';

const router = Router();

/* Endpoints de Dashboard */
router.get('/dashboard', getCourses);            // lo conservamos
router.get('/courses', getCourses);              // alias para el frontend (TeacherDashboard.jsx)

/* Endpoint: lista de estudiantes del curso (EMA-256) */
router.get('/courses/:courseId/students', getCourseStudents);

/* Endpoints de students list report*/
router.get('/students-list', getStudentsReport);

/* Endpoints de Calendar */
router.get('/calendar', getCalendar);
router.post('/calendar', addClass);
router.get('/calendar/bookings/:bookingId/feedback', getClassFeedback);
router.post('/calendar/bookings/:bookingId/feedback', addClassFeedback);
router.get('/calendar/today-classes', getTodayClasses);

/** Endpoints de Materiales */
router.use('/materials', materialRoutes);

export default router;