const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDB, getPool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT 1 as healthy');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: rows[0].healthy === 1 ? 'connected' : 'disconnected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection error',
      error: err.message
    });
  }
});

// GET /api/notes - Retrieve all notes (with optional search query)
app.get('/api/notes', async (req, res, next) => {
  try {
    const pool = getPool();
    const { q } = req.query;

    let query = 'SELECT * FROM notes';
    let params = [];

    if (q && q.trim()) {
      query += ' WHERE title LIKE ? OR content LIKE ?';
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY is_pinned DESC, updated_at DESC';

    const [notes] = await pool.query(query, params);
    res.json({ success: true, count: notes.length, data: notes });
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id - Get a single note
app.get('/api/notes/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [notes] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, data: notes[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/notes - Create a new note
app.post('/api/notes', async (req, res, next) => {
  try {
    const pool = getPool();
    const { title, content, color, is_pinned } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        message: 'A note must have at least a title or some content'
      });
    }

    const noteTitle = (title || 'Untitled Note').trim();
    const noteContent = content || '';
    const noteColor = color || '#ffffff';
    const notePinned = is_pinned ? 1 : 0;

    const [result] = await pool.query(
      'INSERT INTO notes (title, content, color, is_pinned) VALUES (?, ?, ?, ?)',
      [noteTitle, noteContent, noteColor, notePinned]
    );

    const [newNote] = await pool.query('SELECT * FROM notes WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: newNote[0]
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id - Update and save an existing note
app.put('/api/notes/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { title, content, color, is_pinned } = req.body;

    const [existing] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const currentNote = existing[0];
    const updatedTitle = title !== undefined ? title.trim() : currentNote.title;
    const updatedContent = content !== undefined ? content : currentNote.content;
    const updatedColor = color !== undefined ? color : currentNote.color;
    const updatedPinned = is_pinned !== undefined ? (is_pinned ? 1 : 0) : currentNote.is_pinned;

    await pool.query(
      'UPDATE notes SET title = ?, content = ?, color = ?, is_pinned = ? WHERE id = ?',
      [updatedTitle, updatedContent, updatedColor, updatedPinned, id]
    );

    const [updatedNote] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote[0]
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notes/:id/pin - Toggle pin status
app.patch('/api/notes/:id/pin', async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [notes] = await pool.query('SELECT is_pinned FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const newPinnedStatus = notes[0].is_pinned ? 0 : 1;
    await pool.query('UPDATE notes SET is_pinned = ? WHERE id = ?', [newPinnedStatus, id]);

    res.json({
      success: true,
      message: `Note ${newPinnedStatus ? 'pinned' : 'unpinned'} successfully`,
      is_pinned: !!newPinnedStatus
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id - Delete a note
app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM notes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully',
      id: parseInt(id, 10)
    });
  } catch (err) {
    next(err);
  }
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Start Server after Database initialization
initDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Notes backend API is running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database on startup:', err.message);
    process.exit(1);
  });
