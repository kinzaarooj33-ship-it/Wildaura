// ============================================================
// guider-extra-routes.js
// Is file ko apne main server.js / index.js mein require karo:
//   const guiderExtraRoutes = require('./guider-extra-routes');
//   app.use(guiderExtraRoutes);
// ============================================================

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const db       = require('./config/db'); // apna MySQL connection file

// ─── MULTER SETUP (same uploads folder) ─────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });


// ============================================================
// ─── SUCCESS STORIES ────────────────────────────────────────
// ============================================================

// GET — guider ki saari stories
router.get('/success-stories/:email', (req, res) => {
  const { email } = req.params;
  const sql = `SELECT * FROM success_stories WHERE guider_email = ? ORDER BY created_at DESC`;
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ stories: results });
  });
});

// POST — nai story upload
router.post('/success-stories', upload.single('image'), (req, res) => {
  const { email, title, description, location } = req.body;
  if (!email || !title || !description || !location) {
    return res.status(400).json({ message: 'All fields required.' });
  }
  const image = req.file ? req.file.filename : null;
  const sql = `INSERT INTO success_stories (guider_email, title, description, location, image) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [email, title, description, location, image], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ message: 'Story uploaded!', id: result.insertId });
  });
});

// DELETE — story delete karo
router.delete('/success-stories/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM success_stories WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ message: 'Story deleted.' });
  });
});


// ============================================================
// ─── FEEDBACK ───────────────────────────────────────────────
// ============================================================

// GET — guider ke liye aaya feedback
router.get('/guider-feedback/:email', (req, res) => {
  const { email } = req.params;
  const sql = `
    SELECT f.*, u.name AS hunter_name
    FROM feedback f
    LEFT JOIN users u ON f.hunter_email = u.email
    WHERE f.guider_email = ?
    ORDER BY f.created_at DESC
  `;
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ feedbacks: results });
  });
});

// POST — guider reply deta hai
router.post('/guider-feedback/reply/:id', (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  if (!reply?.trim()) return res.status(400).json({ message: 'Reply cannot be empty.' });

  db.query('UPDATE feedback SET guider_reply = ? WHERE id = ?', [reply, id], (err) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });

    // Notification create karo hunter ke liye (optional)
    db.query('SELECT hunter_email FROM feedback WHERE id = ?', [id], (err2, rows) => {
      if (!err2 && rows.length > 0) {
        const hunterEmail = rows[0].hunter_email;
        const msg = 'Your feedback has received a reply from the guider.';
        db.query(
          'INSERT INTO notifications (user_email, type, message) VALUES (?, ?, ?)',
          [hunterEmail, 'feedback', msg],
          () => {}
        );
      }
    });

    res.json({ message: 'Reply sent.' });
  });
});


// ============================================================
// ─── NOTIFICATIONS ──────────────────────────────────────────
// ============================================================

// GET — guider ki saari notifications
router.get('/guider-notifications/:email', (req, res) => {
  const { email } = req.params;
  const sql = `SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC`;
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ notifications: results });
  });
});

// PUT — single notification mark as read
router.put('/guider-notifications/read/:id', (req, res) => {
  db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ message: 'Marked as read.' });
  });
});

// PUT — sab notifications mark as read
router.put('/guider-notifications/read-all/:email', (req, res) => {
  db.query('UPDATE notifications SET is_read = 1 WHERE user_email = ?', [req.params.email], (err) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ message: 'All marked as read.' });
  });
});

// DELETE — single notification delete
router.delete('/guider-notifications/:id', (req, res) => {
  db.query('DELETE FROM notifications WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ message: 'Notification deleted.' });
  });
});

// ============================================================
// ─── HELPER: Notification banana (booking/emergency ke liye)
// ============================================================
// Yeh function apne booking aur emergency routes mein call karo:
//
//   createNotification(guiderEmail, 'booking', 'New booking request from Hunter Ali');
//   createNotification(guiderEmail, 'emergency', 'Emergency alert from Hunter Usman!');
//   createNotification(guiderEmail, 'feedback', 'You received a new 5-star review!');
//
function createNotification(userEmail, type, message) {
  const sql = `INSERT INTO notifications (user_email, type, message) VALUES (?, ?, ?)`;
  db.query(sql, [userEmail, type, message], (err) => {
    if (err) console.error('Notification insert error:', err);
  });
}

module.exports = router;
module.exports.createNotification = createNotification;