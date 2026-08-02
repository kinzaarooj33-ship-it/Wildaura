// routes/acts.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/:id', (req, res) => {
  const actId = req.params.id;
  db.query('SELECT * FROM acts WHERE id = ?', [actId], (err, actResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (actResults.length === 0) return res.status(404).json({ act: null, laws: [] });

    const act = actResults[0];
    db.query('SELECT * FROM laws WHERE reference LIKE ?', 
      ['%' + act.name.split(' ').slice(0,2).join(' ') + '%'], 
      (err2, lawResults) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ act, laws: lawResults });
      }
    );
  });
});

module.exports = router; 