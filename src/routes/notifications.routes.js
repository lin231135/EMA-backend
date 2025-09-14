import express from 'express';
import {
  getUserNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  markNotificationAsRead,
  deleteNotification,
  getNotificationStats,
  createManualClassReminder,
  cancelBookingNotifications
} from '../controllers/notification.controller.js';

// Importar middlewares de autenticación
import { verifyToken, isAdmin, isParent, isTeacher } from '../middlewares/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// =================== RUTAS PARA USUARIOS ===================

// Obtener notificaciones del usuario
router.get('/', getUserNotifications);

// Obtener preferencias de notificación
router.get('/preferences', getNotificationPreferences);

// Actualizar preferencias de notificación
router.put('/preferences', updateNotificationPreferences);

// Marcar notificación como leída
router.put('/:id/read', markNotificationAsRead);

// Eliminar notificación
router.delete('/:id', deleteNotification);

// =================== RUTAS PARA MAESTROS/PADRES ===================

// Crear recordatorio manual para una clase (maestros y padres)
router.post('/class-reminder', createManualClassReminder);

// Cancelar recordatorios de una reserva (maestros y padres)
router.delete('/booking/:bookingId', cancelBookingNotifications);

// =================== RUTAS PARA ADMINISTRADORES ===================

// Enviar notificación de prueba (solo admin)
router.post('/test', isAdmin, sendTestNotification);

// Obtener estadísticas de notificaciones (solo admin)
router.get('/admin/stats', isAdmin, getNotificationStats);

export default router;