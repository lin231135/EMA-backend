import { Router } from 'express';
import { getDashboard } from '../../controllers/admin/index.controller.js';
import { getStudentsReport } from '../../controllers/student.report.controller.js';
import { addBook, getBooks, getBook, updateBook, deleteBook } from '../../controllers/book.controller.js';
import {
  getRevenueReport,
  getBookingsReport,
  getTeachersPerformanceReport,
  getStudentsActivityReport,
  getCoursesPopularityReport,
  getPendingPaymentsReport
} from '../../controllers/admin/reports.controller.js';
import studentsRoutes from './students.routes.js';
import paymentsRoutes from './payments.routes.js';
import bookingsRoutes from './bookings.routes.js';

const router = Router();

/* Endpoints de Dashboard */
router.get('/dashboard', getDashboard);

/* Endpoints de gestión de estudiantes (Students CRUD) */
router.use('/students', studentsRoutes);

/* Endpoints de gestión de pagos (Payments Management) */
router.use('/payments', paymentsRoutes);

/* Endpoints de gestión de bookings (Bookings Management) */
router.use('/bookings', bookingsRoutes);

/* Endpoints de students list report*/
router.get('/students-report', getStudentsReport);

/* Endpoints de Books CRUD */
router.post('/books', addBook);
router.get('/books', getBooks);
router.get('/books/:id', getBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);

/* Endpoints de reportes */
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/bookings', getBookingsReport);
router.get('/reports/teachers-performance', getTeachersPerformanceReport);
router.get('/reports/students-activity', getStudentsActivityReport);
router.get('/reports/courses-popularity', getCoursesPopularityReport);
//router.get('/reports/pending-payments', getPendingPaymentsReport);

export default router;
