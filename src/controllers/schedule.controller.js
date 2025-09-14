import db from '../db/connection.js';

// Función helper para importar dinámicamente el servicio
async function getNotificationService() {
  try {
    const { default: notificationService } = await import('../services/notification.service.js');
    return notificationService;
  } catch (error) {
    console.warn('Servicio de notificaciones no disponible:', error.message);
    return null;
  }
}

// Get the calendar (all scheduled classes)
export const getCalendar = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.schedule_date, s.start_time, s.end_time,
              c.name as course_name, u.name as teacher_name
       FROM Schedule s
       JOIN Course c ON c.id = s.course_id
       JOIN "User" u ON u.id = s.teacher_id
       ORDER BY s.schedule_date, s.start_time`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en getCalendar:', err);
    res.status(500).json({ message: 'Error al obtener calendario' });
  }
};

// Add a new class to the schedule
export const addClass = async (req, res) => {
  // TODO: Implement logic to add a class
};

// Cancel a booking and send notifications
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason = 'Clase cancelada' } = req.body;

    // Verificar que la reserva existe y está programada
    const bookingResult = await db.query(
      'SELECT * FROM Booking WHERE id = $1 AND status = $2',
      [bookingId, 'programada']
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Reserva no encontrada o ya está cancelada' 
      });
    }

    // Cancelar la reserva
    await db.query(
      'UPDATE Booking SET status = $1 WHERE id = $2',
      ['cancelada', bookingId]
    );

    // Cancelar recordatorios y enviar notificación de cancelación
    const notificationService = await getNotificationService();
    if (notificationService) {
      await notificationService.cancelClassReminders(bookingId, reason);
    }

    res.json({ 
      message: 'Clase cancelada correctamente' + (notificationService ? ' y notificaciones enviadas' : ''),
      booking_id: bookingId 
    });

  } catch (err) {
    console.error('Error en cancelBooking:', err);
    res.status(500).json({ message: 'Error al cancelar la clase' });
  }
};

// GET /calendar/bookings/:bookingId/feedback
export const getClassFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await db.query(
      `SELECT f.id, f.content, f.created_at, u.name as teacher_name
       FROM Feedback f
       JOIN "User" u ON u.id = f.teacher_id
       WHERE f.booking_id = $1
       ORDER BY f.created_at DESC`,
      [bookingId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en getClassFeedback:', err);
    res.status(500).json({ message: 'Error al obtener feedback de la clase' });
  }
};

// Add feedback for a specific class
export const addClassFeedback = async (req, res) => {
  // TODO: Implement logic to add class feedback
};
