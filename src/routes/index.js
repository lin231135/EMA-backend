import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import courseRoutes from './courses.routes.js';

const router = Router();

// Rutas principales
router.use('/auth', authRoutes);   // /api/auth/*
router.use('/users', userRoutes);  // /api/users/*
router.use('/courses', courseRoutes); // /api/courses/*

export default router;