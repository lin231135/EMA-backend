// src/routes/admin/reports.global.routes.js
import { Router } from 'express';
import { authenticate, isAdmin } from '../../middlewares/auth.js';
import {
  getGlobalKPIs,
  getStudentTrends,
  getCourseDistribution,
  getPerformanceEvolution,
  getTeacherPerformance,
  getCoursePerformance,
  getPaymentsSummary,
  getTopStudents,
  getStudentsAtRisk
} from '../../controllers/admin/reports.global.controller.js';

const router = Router();

// Requiere admin autenticado
const guard = [authenticate(['admin']), isAdmin];

router.get('/kpis',                    ...guard, getGlobalKPIs);
router.get('/trends/students',         ...guard, getStudentTrends);
router.get('/distribution/courses',    ...guard, getCourseDistribution);
router.get('/performance/evolution',   ...guard, getPerformanceEvolution);
router.get('/teachers/performance',    ...guard, getTeacherPerformance);
router.get('/courses/performance',     ...guard, getCoursePerformance);
router.get('/payments/summary',        ...guard, getPaymentsSummary);
router.get('/students/top',            ...guard, getTopStudents);
router.get('/students/at-risk',        ...guard, getStudentsAtRisk);

export default router;
