import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import courseRoutes from './courses.routes.js';
import studentRoutes from './students.routes.js';
import parentRoutes from './parents.routes.js';
import teacherRoutes from './teachers.routes.js';
import adminRoutes from './admins.routes.js';
import supRoutes from './sup.routes.js';
import notificationRoutes from './notifications.routes.js';
import contact from './contact.routes.js';

const router = Router();

// Rutas principales
router.use('/auth', authRoutes);   // /api/auth/*
router.use('/users', userRoutes);  // /api/users/*
router.use('/courses', courseRoutes); // /api/courses/*
router.use('/students', studentRoutes)  // /api/students/*
router.use('/parents', parentRoutes)  // /api/parents/*
router.use('/teachers', teacherRoutes)  // /api/teachers/*
router.use('/admins', adminRoutes)  // /api/admins/*
router.use('/sup', supRoutes)  // /api/sup/*
router.use('/notifications', notificationRoutes)  // /api/notifications/*
router.use('/contact', contact)  // /api/contact/*


export default router;