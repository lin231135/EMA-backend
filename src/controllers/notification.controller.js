import db from '../db/connection.js';

/**
 * Controlador para gestionar notificaciones
 */

// Función helper para importar dinámicamente el servicio
async function getNotificationService() {
  try {
    const { default: notificationService } = await import('../services/notification.service.js');
    return notificationService;
  } catch (error) {
    throw new Error('Servicio de notificaciones no disponible');
  }
}

// GET /api/notifications - Obtener notificaciones del usuario actual
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, status } = req.query;

    let query = `
      SELECT n.*, b.id as booking_id, k.name as student_name, c.name as course_name,
             s.schedule_date, s.start_time
      FROM notifications n
      LEFT JOIN Booking b ON n.booking_id = b.id
      LEFT JOIN Kid k ON b.kid_id = k.id
      LEFT JOIN Course c ON b.course_id = c.id
      LEFT JOIN Schedule s ON n.schedule_id = s.id
      WHERE n.user_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ' AND n.status = $2';
      params.push(status);
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      notifications: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ 
      error: 'Error al obtener notificaciones',
      message: error.message 
    });
  }
};

// GET /api/notifications/preferences - Obtener preferencias de notificación
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationService = await getNotificationService();
    const preferences = await notificationService.getUserPreferences(userId);

    res.json(preferences);

  } catch (error) {
    console.error('Error al obtener preferencias:', error);
    res.status(500).json({ 
      error: 'Error al obtener preferencias de notificación',
      message: error.message 
    });
  }
};

// PUT /api/notifications/preferences - Actualizar preferencias de notificación
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      class_reminder,
      reminder_time,
      email_enabled,
      sms_enabled,
      push_enabled
    } = req.body;

    // Validaciones
    if (reminder_time && (reminder_time < 5 || reminder_time > 1440)) {
      return res.status(400).json({
        error: 'El tiempo de recordatorio debe estar entre 5 minutos y 24 horas'
      });
    }

    const notificationService = await getNotificationService();
    const preferences = await notificationService.updateUserPreferences(userId, {
      class_reminder,
      reminder_time,
      email_enabled,
      sms_enabled,
      push_enabled
    });

    res.json({
      message: 'Preferencias actualizadas correctamente',
      preferences: preferences.rows ? preferences.rows[0] : preferences
    });

  } catch (error) {
    console.error('Error al actualizar preferencias:', error);
    res.status(500).json({ 
      error: 'Error al actualizar preferencias',
      message: error.message 
    });
  }
};

// POST /api/notifications/test - Enviar notificación de prueba (solo admin)
export const sendTestNotification = async (req, res) => {
  try {
    const { user_id, type, channel, title, message } = req.body;

    if (!user_id || !type || !channel || !title || !message) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: user_id, type, channel, title, message'
      });
    }

    const notificationService = await getNotificationService();
    const notificationId = await notificationService.createNotification({
      user_id,
      type,
      channel,
      recipient: req.body.recipient || 'test@example.com',
      scheduled_for: new Date(),
      custom_title: title,
      custom_message: message
    });

    res.json({
      message: 'Notificación de prueba creada correctamente',
      notification_id: notificationId
    });

  } catch (error) {
    console.error('Error al enviar notificación de prueba:', error);
    res.status(500).json({ 
      error: 'Error al enviar notificación de prueba',
      message: error.message 
    });
  }
};

// PUT /api/notifications/:id/read - Marcar notificación como leída
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'UPDATE notifications SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      ['read', id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({
      message: 'Notificación marcada como leída',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ 
      error: 'Error al marcar notificación como leída',
      message: error.message 
    });
  }
};

// DELETE /api/notifications/:id - Eliminar notificación
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ message: 'Notificación eliminada correctamente' });

  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ 
      error: 'Error al eliminar notificación',
      message: error.message 
    });
  }
};

// GET /api/notifications/stats - Estadísticas de notificaciones (admin)
export const getNotificationStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const result = await db.query(`
      SELECT 
        type,
        channel,
        status,
        COUNT(*) as count
      FROM notifications 
      WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
      GROUP BY type, channel, status
      ORDER BY type, channel, status
    `);

    const totalResult = await db.query(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM notifications 
      WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
    `);

    res.json({
      period_days: parseInt(period),
      summary: totalResult.rows[0],
      breakdown: result.rows
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de notificaciones',
      message: error.message 
    });
  }
};

// POST /api/notifications/class-reminder - Crear recordatorio manual para una clase
export const createManualClassReminder = async (req, res) => {
  try {
    const { booking_id, reminder_minutes = 60, message } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id es requerido' });
    }

    // Obtener información de la reserva
    const bookingResult = await db.query(`
      SELECT b.*, k.name as student_name, k.parent_id,
             u.name as parent_name, u.email as parent_email, u.phone as parent_phone,
             c.name as course_name, c.modality,
             s.schedule_date, s.start_time, s.end_time,
             u_teacher.name as teacher_name
      FROM Booking b
      JOIN Kid k ON b.kid_id = k.id
      JOIN "User" u ON k.parent_id = u.id
      JOIN Course c ON b.course_id = c.id
      JOIN Schedule s ON b.schedule_id = s.id
      JOIN "User" u_teacher ON s.teacher_id = u_teacher.id
      WHERE b.id = $1 AND b.status = 'programada'
    `, [booking_id]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o no está programada' });
    }

    const booking = bookingResult.rows[0];
    
    // Calcular cuándo enviar el recordatorio
    const classDateTime = new Date(`${booking.schedule_date}T${booking.start_time}`);
    const reminderDateTime = new Date(classDateTime.getTime() - (reminder_minutes * 60 * 1000));
    
    if (reminderDateTime <= new Date()) {
      return res.status(400).json({ 
        error: 'El recordatorio debe programarse para el futuro' 
      });
    }

    const notificationService = await getNotificationService();
    
    const templateVars = {
      parent_name: booking.parent_name,
      student_name: booking.student_name,
      course_name: booking.course_name,
      teacher_name: booking.teacher_name,
      class_date: notificationService.formatDate(booking.schedule_date),
      class_time: notificationService.formatTime(booking.start_time),
      modality: booking.modality === 'academia' ? 'En academia' : 'A domicilio'
    };

    const notificationId = await notificationService.createNotification({
      user_id: booking.parent_id,
      booking_id: booking_id,
      schedule_id: booking.schedule_id,
      type: 'class_reminder',
      channel: 'email',
      recipient: booking.parent_email,
      scheduled_for: reminderDateTime,
      template_vars: templateVars,
      custom_message: message
    });

    res.json({
      message: 'Recordatorio programado correctamente',
      notification_id: notificationId,
      scheduled_for: reminderDateTime
    });

  } catch (error) {
    console.error('Error al crear recordatorio manual:', error);
    res.status(500).json({ 
      error: 'Error al crear recordatorio manual',
      message: error.message 
    });
  }
};

// DELETE /api/notifications/booking/:bookingId - Cancelar recordatorios de una reserva
export const cancelBookingNotifications = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason = 'Clase cancelada por el usuario' } = req.body;

    const notificationService = await getNotificationService();
    await notificationService.cancelClassReminders(bookingId, reason);

    res.json({ 
      message: 'Recordatorios cancelados correctamente',
      booking_id: bookingId 
    });

  } catch (error) {
    console.error('Error al cancelar recordatorios:', error);
    res.status(500).json({ 
      error: 'Error al cancelar recordatorios',
      message: error.message 
    });
  }
};