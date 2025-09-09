import { Router } from 'express';
import { getDashboard } from '../controllers/admin.controller.js';
import { addPayment, getPayments, getPayment, updatePayment, deletePayment } from '../controllers/payment.controller.js';
import { getStudentsReport } from '../controllers/student.report.controller.js';
import { addBook, getBooks, getBook, updateBook, deleteBook } from '../controllers/book.controller.js';
import { getProfileInfo, updateProfileInfo, updateAddress } from '../controllers/users.controller.js';

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

export default router;

