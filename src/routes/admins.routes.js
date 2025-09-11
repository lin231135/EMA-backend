import { Router } from 'express';
import { getDashboard } from '../controllers/admin/admin.controller.js';
import { addPayment, getPayments, getPayment, updatePayment, deletePayment } from '../controllers/payment.controller.js';
import { getStudentsReport } from '../controllers/student.report.controller.js';
import { addBook, getBooks, getBook, updateBook, deleteBook } from '../controllers/book.controller.js';
import { getProfileInfo, updateProfileInfo, updateAddress } from '../controllers/users.controller.js';
import {
  getRevenueReport,
  getBookingsReport,
  getTeachersPerformanceReport,
  getStudentsActivityReport,
  getCoursesPopularityReport,
  getPendingPaymentsReport
} from '../controllers/admin/reports.controller.js';

const router = Router();

/* Endpoints de Dashboard */
router.get('/dashboard', getDashboard);

/* Endpoints de Payments CRUD*/
router.post('/payments', addPayment);
router.get('/payments', getPayments);
router.get('/payments/:id', getPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

/* Endpoints de students list report*/
router.get('/students-report', getStudentsReport);

/* Endpoints de Books CRUD */
router.post('/books', addBook);
router.get('/books', getBooks);
router.get('/books/:id', getBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);

/* Endpoints de profile */
router.get('/profile', getProfileInfo);
router.put('/profile', updateProfileInfo);
router.put('/profile/address', updateAddress);

/* Endpoints de reportes */
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/bookings', getBookingsReport);
router.get('/reports/teachers-performance', getTeachersPerformanceReport);
router.get('/reports/students-activity', getStudentsActivityReport);
router.get('/reports/courses-popularity', getCoursesPopularityReport);
router.get('/reports/pending-payments', getPendingPaymentsReport);

export default router;

