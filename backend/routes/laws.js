const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── LAWS ──
router.get('/', (req, res) => {
  db.query('SELECT * FROM laws', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { title, category, description, footerLabel, footerValue, reference } = req.body;
  db.query('INSERT INTO laws (title, category, description, footerLabel, footerValue, reference) VALUES (?, ?, ?, ?, ?, ?)',
    [title, category, description, footerLabel, footerValue, reference],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Law added', id: result.insertId });
    }
  );
});

// ✅ YEH MISSING THA
router.put('/:id', (req, res) => {
  const { title, category, description, footerLabel, footerValue, reference } = req.body;
  db.query('UPDATE laws SET title=?, category=?, description=?, footerLabel=?, footerValue=?, reference=? WHERE id=?',
    [title, category, description, footerLabel, footerValue, reference, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated' });
    }
  );
});

router.delete('/:id', (req, res) => {
  db.query('DELETE FROM laws WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
});

// ── ACTS ── ✅ YEH SAB MISSING THA
router.get('/acts', (req, res) => {
  db.query('SELECT * FROM acts', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/acts', (req, res) => {
  const { name, province, year, description, key_points } = req.body;
  db.query('INSERT INTO acts (name, province, year, description, key_points) VALUES (?, ?, ?, ?, ?)',
    [name, province, year, description, key_points],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Act added', id: result.insertId });
    }
  );
});

router.put('/acts/:id', (req, res) => {
  const { name, province, year, description, key_points } = req.body;
  db.query('UPDATE acts SET name=?, province=?, year=?, description=?, key_points=? WHERE id=?',
    [name, province, year, description, key_points, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated' });
    }
  );
});

router.delete('/acts/:id', (req, res) => {
  db.query('DELETE FROM acts WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
});

// GET act by id with related laws
router.get('/acts/:id', (req, res) => {
  const actId = req.params.id;
  db.query('SELECT * FROM acts WHERE id = ?', [actId], (err, actResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (actResults.length === 0) return res.status(404).json({ act: null, laws: [] });

    const act = actResults[0];
    db.query('SELECT * FROM laws WHERE reference LIKE ?',
      ['%' + act.name.split(' ').slice(0, 2).join(' ') + '%'],
      (err2, lawResults) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ act, laws: lawResults });
      }
    );
  });
});

module.exports = router;