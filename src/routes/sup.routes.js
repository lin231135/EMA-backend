import { Router } from 'express';
import { getDashboard } from '../controllers/sup/sup.controller.js';
import { getTrialRequests, getTrialRequest, updateTrialRequest, deleteTrialRequest } from '../controllers/trial.request.controller.js';
import { addPayment, getPayments, getPayment, updatePayment, deletePayment } from '../controllers/payment.controller.js';
import { getStudentsReport } from '../controllers/student.report.controller.js';
import { addBook, getBooks, getBook, updateBook, deleteBook } from '../controllers/book.controller.js';
import { getProfileInfo, updateProfileInfo, updateAddress, addUser, getUsers, getUser, updateUser, deleteUser } from '../controllers/users.controller.js';

const router = Router();

/* Endpoints de Dashboard */
router.post('/dashboard', getDashboard);

/* Trial class requests*/
router.get('/trial-requests', getTrialRequests);
router.get('/trial-requests/:id', getTrialRequest);
router.put('/trial-requests/:id', updateTrialRequest);
router.delete('/trial-requests/:id', deleteTrialRequest);

/* Endpoints de Payments CRUD*/
router.post('/payments', addPayment);
router.get('/payments', getPayments);
router.get('/payments/:id', getPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

/* Endpoints de Books CRUD */
router.post('/books', addBook);
router.get('/books', getBooks);
router.get('/books/:id', getBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);

/* Endpoints de students list report*/
router.get('/students-report', getStudentsReport);

/* Endpoints de users CRUD */
router.post('/users', addUser);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

/* Endpoints de profile */
router.get('/profile', getProfileInfo);
router.put('/profile', updateProfileInfo);
router.put('/profile/address', updateAddress);

export default router;

