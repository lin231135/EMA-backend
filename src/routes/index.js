import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import courseRoutes from './courses/courses.routes.js';
import studentRoutes from './student/students.routes.js';
import parentRoutes from './parents.routes.js';
import teacherRoutes from './teachers.routes.js';
import adminRoutes from './admin/index.js';  
import supRoutes from './sup.routes.js';
import contact from './contact.routes.js';
import parentsRoutes from "./parent/parents.routes.js";
import joinTeam from './join.team.routes.js';
import studentPaymentRoutes from './student/studentsPayments.routes.js';
import uploadRoutes from './app/upload.routes.js';
import scheduleRoutes from './courses/schedule.routes.js';
import bookingsRoutes from './app/bookings.routes.js';


const router = Router();

// Rutas principales
router.use('/auth', authRoutes);   // /api/auth/*
router.use('/users', userRoutes);  // /api/users/*
router.use('/courses', courseRoutes); // /api/courses/*
router.use('/students', studentRoutes)  // /api/students/*
router.use('/parents', parentRoutes)  // /api/parents/* (dashboard, calendar, payments, etc.)
router.use('/parents', parentsRoutes)  // /api/parents/* (children, profiles)
router.use('/teachers', teacherRoutes)  // /api/teachers/*
router.use('/teacher', teacherRoutes);
router.use('/admins', adminRoutes)  // /api/admins/*
router.use('/sup', supRoutes)  // /api/sup/*
router.use('/contact', contact)  // /api/contact/*
router.use('/join-team', joinTeam)  // /api/join-team/* 
router.use('/upload', uploadRoutes)  // /api/upload/* (ImageKit uploads)
router.use('/students', studentRoutes);
router.use('/students', studentPaymentRoutes); 
router.use('/schedules', scheduleRoutes); // /api/schedules/*
router.use('/bookings', bookingsRoutes); // /api/bookings/*


export default router;
