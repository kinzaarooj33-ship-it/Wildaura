const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/stories/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// =====================================================
// OFFENSIVE WORDS
// =====================================================

const badWords = [
  "fuck", "shit", "bitch",
  "harami", "chutiya", "madarchod",
];

// =====================================================
// GET ALL STORIES
// =====================================================

router.get("/", (req, res) => {

  const sql = `SELECT * FROM success_stories ORDER BY id DESC`;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    res.json({ success: true, stories: result });

  });

});

// =====================================================
// SUBMIT STORY
// =====================================================

router.post("/submit", upload.single("image"), (req, res) => {

  try {

    const { name, area, trophy, story, user_email } = req.body;

    // ── Validation ──
    if (!name || !area || !story) {
      return res.json({
        success: false,
        message: "Fill all required fields.",
      });
    }

    // ── Offensive words check ──
    const text = `${name} ${story}`.toLowerCase();
    const hasBadWord = badWords.some((word) => text.includes(word));

    if (hasBadWord) {
      return res.json({
        success: false,
        message: "Offensive language detected.",
      });
    }

    // ── Image path ──
    const image = req.file
      ? `/uploads/stories/${req.file.filename}`
      : null;

    // ── Insert into DB ──
    const sql = `
      INSERT INTO success_stories
        (name, area, trophy, story, image, user_email)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [name, area, trophy || null, story, image, user_email || null],
      (err, result) => {

        if (err) {
          console.log(err);
          return res.json({ success: false, message: "Database error." });
        }

        res.json({
          success: true,
          message: "Story submitted successfully!",
          story: { id: result.insertId },
        });

      }
    );

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Server error." });
  }

});

// =====================================================
// EDIT STORY  (PUT /api/stories/:id)
// =====================================================

router.put("/:id", (req, res) => {

  const { id } = req.params;
  const { name, area, trophy, story, user_email } = req.body;

  // ── Validation ──
  if (!name || !area || !story) {
    return res.json({
      success: false,
      message: "Fill all required fields.",
    });
  }

  // ── Offensive words check ──
  const text = `${name} ${story}`.toLowerCase();
  const hasBadWord = badWords.some((word) => text.includes(word));

  if (hasBadWord) {
    return res.json({
      success: false,
      message: "Offensive language detected.",
    });
  }

  // ── Ownership check ──
  const checkSql = `SELECT user_email FROM success_stories WHERE id = ?`;

  db.query(checkSql, [id], (err, rows) => {

    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Database error." });
    }

    if (rows.length === 0) {
      return res.json({ success: false, message: "Story not found." });
    }

    if (rows[0].user_email !== user_email) {
      return res.json({
        success: false,
        message: "You are not authorized to edit this story.",
      });
    }

    // ── Update ──
    const updateSql = `
      UPDATE success_stories
      SET name = ?, area = ?, trophy = ?, story = ?
      WHERE id = ?
    `;

    db.query(
      updateSql,
      [name, area, trophy || null, story, id],
      (err) => {

        if (err) {
          console.log(err);
          return res.json({ success: false, message: "Database error." });
        }

        res.json({ success: true, message: "Story updated successfully!" });

      }
    );

  });

});

// =====================================================
// DELETE STORY  (DELETE /api/stories/:id)
// =====================================================

router.delete("/:id", (req, res) => {

  const { id } = req.params;
  const { user_email } = req.body;

  // ── Ownership check ──
  const checkSql = `SELECT user_email FROM success_stories WHERE id = ?`;

  db.query(checkSql, [id], (err, rows) => {

    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Database error." });
    }

    if (rows.length === 0) {
      return res.json({ success: false, message: "Story not found." });
    }

    if (rows[0].user_email !== user_email) {
      return res.json({
        success: false,
        message: "You are not authorized to delete this story.",
      });
    }

    // ── Delete ──
    const deleteSql = `DELETE FROM success_stories WHERE id = ?`;

    db.query(deleteSql, [id], (err) => {

      if (err) {
        console.log(err);
        return res.json({ success: false, message: "Database error." });
      }

      res.json({ success: true, message: "Story deleted successfully!" });

    });

  });

});

module.exports = router;