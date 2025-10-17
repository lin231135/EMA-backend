import { Router } from 'express';
import { addNote, getFeedback, getTodayClasses, getNextClasses, getKidProfileInfo, createKidAddress, updateKidAddressById, linkKidToExistingAddress, unlinkKidAddress} from '../controllers/parent/parent.controller.js';
import { getCalendar, getClassFeedback } from '../controllers/schedule.controller.js';
import { getPayments, getPayment } from '../controllers/payment.controller.js';
import { getBooks, getBook } from '../controllers/book.controller.js';

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
router.get('/payments', getPayments);
router.get('/payments/:id', getPayment);

/* Endpoints de Book Catalog */
router.get('/books', getBooks);
router.get('/books/:id', getBook);

/* router.get('/kids/:kidId', authenticate, authorizeRole('padre'), getKidProfileInfo);
router.post('/kids/:kidId/address', authenticate, authorizeRole('padre'), createKidAddress);
router.put('/kids/:kidId/address/:addressId', authenticate, authorizeRole('padre'), updateKidAddressById);
router.post('/kids/:kidId/link-address', authenticate, authorizeRole('padre'), linkKidToExistingAddress);
router.delete('/kids/:kidId/address/:addressId', authenticate, authorizeRole('padre'), unlinkKidAddress);
 */
export default router;

