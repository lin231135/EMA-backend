import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';

const router = Router();

// Rutas principales
router.use('/auth', authRoutes);   // /api/auth/*
router.use('/users', userRoutes);  // /api/users/*

export default router;