import { Router } from 'express';
import { login, register, updatePassword, refresh } from '../controllers/auth.controller.js';

const router = Router();

// Endpoints de autenticación
router.post('/login', login);
router.post('/register', register);
router.post('/update-password', updatePassword);
router.post("/refresh", refresh);

export default router;