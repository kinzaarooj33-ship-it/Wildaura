const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ DB mein recipient_type column ensure karo — server start pe run hoga
const ensureRecipientTypeColumn = async () => {
  try {
    await db.promise().query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS recipient_type ENUM('hunter', 'guider') NOT NULL DEFAULT 'hunter'
    `);
    console.log("✅ notifications.recipient_type column ready");
  } catch (err) {
    // Column already exists — ignore
  }
};
ensureRecipientTypeColumn();

// ✅ Hunter ki notifications — sirf hunter wali (recipient_type = 'hunter')
router.get("/hunter/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const [notifications] = await db.promise().query(
      `SELECT * FROM notifications 
       WHERE user_email = ? AND recipient_type = 'hunter'
       ORDER BY created_at DESC LIMIT 100`,
      [email]
    );
    const [unreadResult] = await db.promise().query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_email = ? AND recipient_type = 'hunter' AND is_read = 0`,
      [email]
    );
    res.json({ success: true, notifications, unreadCount: unreadResult[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Guider ki notifications — sirf guider wali (recipient_type = 'guider')
router.get("/guider/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const [notifications] = await db.promise().query(
      `SELECT * FROM notifications 
       WHERE user_email = ? AND recipient_type = 'guider'
       ORDER BY created_at DESC LIMIT 100`,
      [email]
    );
    const [unreadResult] = await db.promise().query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_email = ? AND recipient_type = 'guider' AND is_read = 0`,
      [email]
    );
    res.json({ success: true, notifications, unreadCount: unreadResult[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Unread count — role ke saath
router.get("/unread-count/:email/:role", async (req, res) => {
  const { email, role } = req.params;
  try {
    const [result] = await db.promise().query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_email = ? AND recipient_type = ? AND is_read = 0`,
      [email, role]
    );
    res.json({ success: true, count: result[0].count });
  } catch (err) {
    res.status(500).json({ success: false, count: 0 });
  }
});

// ✅ Hunter ki sab notifications read mark karo
router.put("/hunter/:email/read-all", async (req, res) => {
  const { email } = req.params;
  try {
    await db.promise().query(
      `UPDATE notifications SET is_read = 1 
       WHERE user_email = ? AND recipient_type = 'hunter'`,
      [email]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ Guider ki sab notifications read mark karo
router.put("/guider/:email/read-all", async (req, res) => {
  const { email } = req.params;
  try {
    await db.promise().query(
      `UPDATE notifications SET is_read = 1 
       WHERE user_email = ? AND recipient_type = 'guider'`,
      [email]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ Mark single notification as read
router.put("/:id/read", async (req, res) => {
  try {
    await db.promise().query(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ Delete single notification
router.delete("/:id", async (req, res) => {
  try {
    await db.promise().query(
      `DELETE FROM notifications WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ GET all notifications — admin ke liye
router.get("/all", async (req, res) => {
  try {
    const [notifications] = await db.promise().query(
      `SELECT * FROM notifications ORDER BY created_at DESC`
    );
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ DELETE all notifications
router.delete("/all", async (req, res) => {
  try {
    await db.promise().query(`DELETE FROM notifications`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;