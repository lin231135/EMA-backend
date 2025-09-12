import db from '../db/connection.js';

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
