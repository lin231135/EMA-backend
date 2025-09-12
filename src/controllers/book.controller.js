import db from '../db/connection.js';

// Add a new book
export const addBook = async (req, res) => {
  const { name, description, cost, stock, img_url } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO Book (name, description, cost, stock, img_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, cost, stock, img_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all books
export const getBooks = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Book');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single book by ID
export const getBook = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM Book WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a book by ID
export const updateBook = async (req, res) => {
  const { id } = req.params;
  const { name, description, cost, stock, img_url } = req.body;
  try {
    const result = await db.query(
      'UPDATE Book SET name = $1, description = $2, cost = $3, stock = $4, img_url = $5 WHERE id = $6 RETURNING *',
      [name, description, cost, stock, img_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a book by ID
export const deleteBook = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM Book WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};