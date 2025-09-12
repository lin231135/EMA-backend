import db from '../../db/connection.js';

// POST /dashboard/add-note
export const addNote = async (req, res) => {
  try {
    const { bookingId, teacherId, content } = req.body;

    if (!bookingId || !teacherId || !content) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const result = await db.query(
      `INSERT INTO Feedback (booking_id, teacher_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [bookingId, teacherId, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error en addNote:', err);
    res.status(500).json({ message: 'Error al guardar nota' });
  }
};

// GET /dashboard/feedback
export const getFeedback = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.id, f.content, f.created_at, u.name as teacher_name, b.id as booking_id
       FROM Feedback f
       JOIN "User" u ON u.id = f.teacher_id
       JOIN Booking b ON b.id = f.booking_id
       ORDER BY f.created_at DESC
       LIMIT 50`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en getFeedback:', err);
    res.status(500).json({ message: 'Error al obtener feedback' });
  }
};

// GET /dashboard/today-classes
export const getTodayClasses = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const result = await db.query(
      `SELECT s.id, s.schedule_date, s.start_time, s.end_time, 
              c.name as course_name, u.name as teacher_name
       FROM Schedule s
       JOIN Course c ON c.id = s.course_id
       JOIN "User" u ON u.id = s.teacher_id
       WHERE s.schedule_date = $1
       ORDER BY s.start_time`,
      [today]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en getTodayClasses:', err);
    res.status(500).json({ message: 'Error al obtener clases de hoy' });
  }
};

// GET /dashboard/next-classes
export const getNextClasses = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT s.id, s.schedule_date, s.start_time, s.end_time, 
              c.name as course_name, u.name as teacher_name
       FROM Schedule s
       JOIN Course c ON c.id = s.course_id
       JOIN "User" u ON u.id = s.teacher_id
       WHERE s.schedule_date > $1
       ORDER BY s.schedule_date, s.start_time
       LIMIT 20`,
      [today]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en getNextClasses:', err);
    res.status(500).json({ message: 'Error al obtener próximas clases' });
  }
};
