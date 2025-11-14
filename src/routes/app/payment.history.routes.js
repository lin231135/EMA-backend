// src/routes/app/payment.history.routes.js
import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.js'; // el que ya uses
import {
  getParentPaymentHistory,
  getStudentPaymentHistory,
} from '../../controllers/payments/payment.history.controller.js';

const router = Router();

// PADRE
// GET /api/parent/payments/history[?kid_id=123]
router.get('/parent/payments/history', verifyToken, getParentPaymentHistory);

// ESTUDIANTE
// GET /api/students/payments/history (sin kid_id para estudiantes adultos)
router.get('/students/payments/history', verifyToken, getStudentPaymentHistory);

export default router;
