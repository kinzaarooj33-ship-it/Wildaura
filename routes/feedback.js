const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ Admin — GET ALL feedback (with summary stats)
router.get("/feedback/admin/all", (req, res) => {
  db.query(
    `SELECT * FROM feedback ORDER BY created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      const total  = results.length;
      const seen   = results.filter(f => f.is_seen === 1).length;
      const unseen = total - seen;
      const avg_rating = total
        ? (results.reduce((sum, f) => sum + Number(f.rating || 0), 0) / total).toFixed(1)
        : 0;

      res.json({
        success: true,
        feedbacks: results,
        summary: { total, seen, unseen, avg_rating }
      });
    }
  );
});

// ✅ Submit feedback
router.post("/feedback", (req, res) => {
  const { from_email, from_name, to_email, to_role, rating, comment } = req.body;
  if (!from_email || !to_email || !rating || !comment)
    return res.status(400).json({ message: "All fields are required!" });

  db.query(
    `INSERT INTO feedback (from_email, from_name, to_email, to_role, rating, comment) VALUES (?, ?, ?, ?, ?, ?)`,
    [from_email, from_name, to_email, to_role, rating, comment],
    (err) => {
      if (err) return res.status(500).json({ message: "Server error!", error: err.message });

      // ✅ Guider ko notification — recipient_type = 'guider'
      if (to_role === "guider") {
        db.query(
          `INSERT INTO notifications (user_email, type, message, recipient_type) 
           VALUES (?, 'feedback', ?, 'guider')`,
          [to_email, `New feedback received from ${from_name || from_email}`],
          () => {}
        );
      }
      res.json({ message: "Feedback submitted successfully! ✅" });
    }
  );
});

// ✅ Get feedback received by guider — with replies
router.get("/feedback/:email", (req, res) => {
  db.query(
    `SELECT * FROM feedback WHERE to_email = ? ORDER BY created_at DESC`,
    [req.params.email],
    (err, feedbacks) => {
      if (err) return res.status(500).json({ message: "Server error!" });
      if (feedbacks.length === 0) return res.json({ feedbacks: [] });

      const ids = feedbacks.map(f => f.id);
      db.query(
        `SELECT * FROM feedback_replies WHERE feedback_id IN (?) ORDER BY created_at ASC`,
        [ids],
        (err2, replies) => {
          if (err2) return res.status(500).json({ message: "Server error!" });
          const result = feedbacks.map(fb => ({
            ...fb,
            replies: replies.filter(r => r.feedback_id === fb.id)
          }));
          res.json({ feedbacks: result });
        }
      );
    }
  );
});

// ✅ Get feedback SENT by hunter — with replies (Feedback.jsx use karta hai)
router.get("/feedback/sent/:email", (req, res) => {
  db.query(
    `SELECT * FROM feedback WHERE from_email = ? ORDER BY created_at DESC`,
    [req.params.email],
    (err, feedbacks) => {
      if (err) return res.status(500).json({ message: "Server error!" });
      if (feedbacks.length === 0) return res.json({ feedbacks: [] });

      const ids = feedbacks.map(f => f.id);
      db.query(
        `SELECT * FROM feedback_replies WHERE feedback_id IN (?) ORDER BY created_at ASC`,
        [ids],
        (err2, replies) => {
          if (err2) return res.status(500).json({ message: "Server error!" });
          const result = feedbacks.map(fb => ({
            ...fb,
            replies: replies.filter(r => r.feedback_id === fb.id)
          }));
          res.json({ feedbacks: result });
        }
      );
    }
  );
});

// ✅ Get feedback sent by hunter — flat format (Feedback.jsx ke liye)
router.get("/feedback/hunter/:email", (req, res) => {
  db.query(
    `SELECT 
       f.id,
       f.from_email,
       f.from_name,
       f.to_email,
       f.to_role,
       f.rating,
       f.comment,
       f.created_at,
       fr.reply,
       fr.created_at AS reply_at
     FROM feedback f
     LEFT JOIN feedback_replies fr ON fr.feedback_id = f.id
     WHERE f.from_email = ?
     ORDER BY f.created_at DESC`,
    [req.params.email],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Server error!", error: err.message });
      res.json({ feedbacks: rows });
    }
  );
});

// ✅ Add a new reply
router.post("/feedback/reply/:feedback_id", (req, res) => {
  const { reply, guider_email } = req.body;
  const { feedback_id } = req.params;
  if (!reply?.trim()) return res.status(400).json({ message: "Reply cannot be empty." });

  db.query(
    `INSERT INTO feedback_replies (feedback_id, guider_email, reply) VALUES (?, ?, ?)`,
    [feedback_id, guider_email, reply],
    (err) => {
      if (err) return res.status(500).json({ message: "Server error!" });

      // ✅ Hunter ko notification — recipient_type = 'hunter'
      db.query("SELECT from_email FROM feedback WHERE id = ?", [feedback_id], (err2, rows) => {
        if (!err2 && rows.length > 0) {
          db.query(
            `INSERT INTO notifications (user_email, type, message, recipient_type) 
             VALUES (?, 'feedback', ?, 'hunter')`,
            [rows[0].from_email, "Your feedback has received a new reply from the guider! 💬"],
            () => {}
          );
        }
      });
      res.json({ message: "Reply added!" });
    }
  );
});

// ✅ EDIT an existing reply
router.put("/feedback/reply/edit/:reply_id", (req, res) => {
  const { reply } = req.body;
  const { reply_id } = req.params;
  if (!reply?.trim()) return res.status(400).json({ message: "Reply cannot be empty." });

  db.query(
    `UPDATE feedback_replies SET reply = ?, updated_at = NOW() WHERE id = ?`,
    [reply, reply_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Server error!", error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Reply not found." });
      res.json({ message: "Reply updated!" });
    }
  );
});

// ✅ Delete a reply
router.delete("/feedback/reply/:reply_id", (req, res) => {
  db.query("DELETE FROM feedback_replies WHERE id = ?", [req.params.reply_id], (err) => {
    if (err) return res.status(500).json({ message: "Server error!" });
    res.json({ message: "Reply deleted." });
  });
});

// ✅ Mark feedback as seen by guider
router.put("/feedback/seen/:guider_email", (req, res) => {
  db.query(
    "SELECT * FROM feedback WHERE to_email = ? AND is_seen = 0",
    [req.params.guider_email],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (rows.length === 0) return res.json({ message: "No unseen feedbacks" });

      db.query(
        "UPDATE feedback SET is_seen = 1 WHERE to_email = ? AND is_seen = 0",
        [req.params.guider_email],
        (err2) => {
          if (err2) return res.status(500).json({ message: "Update error" });

          // ✅ Hunter ko "seen" notification — recipient_type = 'hunter'
          const uniqueHunters = [...new Set(rows.map(fb => fb.from_email))];
          uniqueHunters.forEach(hunterEmail => {
            db.query(
              `INSERT INTO notifications (user_email, type, message, recipient_type) 
               VALUES (?, 'feedback', ?, 'hunter')`,
              [hunterEmail, "Your feedback has been seen by the guider! 👁️"],
              () => {}
            );
          });
          res.json({ message: "Marked as seen", count: rows.length });
        }
      );
    }
  );
});

module.exports = router;