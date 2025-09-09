import { Router } from 'express';
import { addNote, getFeedback, getTodayClasses, getNextClasses } from '../controllers/student/student.controller.js';
import { getCalendar, getClassFeedback } from '../controllers/schedule.controller.js';
import { getHistoryPayments, getHistoryPayment } from '../controllers/payment.controller.js';
import { getBooks, getBook } from '../controllers/book.controller.js';
import { getProfileInfo, updateProfileInfo, updateAddress } from '../controllers/users.controller.js';

const router = Router();

/* Endpoints de Dashboard */
router.post('/dashboard/add-note', addNote);
router.get('/dashboard/feedback', getFeedback);
router.get('/dashboard/today-classes', getTodayClasses); //también sirve para la pantalla de Calendar
router.get('/dashboard/next-classes', getNextClasses);

/* Endpoints de Calendar */
router.get('/calendar', getCalendar);
router.get('/calendar/bookings/:bookingId/feedback', getClassFeedback);

/* Endpoints de Payments */
router.get('/payments', getHistoryPayments);
router.get('/payments/:id', getHistoryPayment);

/* Endpoints de Book Catalog */
router.get('/books', getBooks);
router.get('/books/:id', getBook);

/* Endpoints de profile */
router.get('/profile', getProfileInfo);
router.put('/profile', updateProfileInfo);
router.put('/profile/address', updateAddress);

export default router;

