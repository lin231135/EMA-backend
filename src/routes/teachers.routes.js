import { Router } from 'express';
import { getCalendar, addClass, getClassFeedback, addClassFeedback } from '../controllers/schedule.controller.js';
import { getCourses, getTodayClasses } from '../controllers/teacher.controller.js';
import { getStudentsReport } from '../controllers/student.report.controller.js';
import { getProfileInfo, updateProfileInfo, updateAddress } from '../controllers/users.controller.js';

const router = Router();

/* Endpoints de Dashboard */
router.get('/dashboard', getCourses);

/* Endpoints de students list report*/
router.get('/students-list', getStudentsReport);

/* Endpoints de Calendar */
router.get('/calendar', getCalendar);
router.post('/calendar', addClass);
router.get('/calendar/bookings/:bookingId/feedback', getClassFeedback);
router.post('/calendar/bookings/:bookingId/feedback', addClassFeedback);
router.get('/calendar/today-classes', getTodayClasses);

/* Endpoints de profile */
router.get('/profile', getProfileInfo);
router.put('/profile', updateProfileInfo);
router.put('/profile/address', updateAddress);

export default router;

