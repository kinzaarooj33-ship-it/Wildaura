const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET all resorts
router.get('/', (req, res) => {
  db.query('SELECT * FROM resorts ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET single resort by ID
router.get('/:id', (req, res) => {
  db.query('SELECT * FROM resorts WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Resort not found' });
    res.json({ data: results[0] });
  });
});

// POST add new resort
router.post('/', (req, res) => {
  const data = req.body;
  db.query('INSERT INTO resorts SET ?', data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: result.insertId });
  });
});

// PUT update resort
router.put('/:id', (req, res) => {
  db.query('UPDATE resorts SET ? WHERE id = ?', [req.body, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// DELETE resort
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM resorts WHERE id = ?', req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;