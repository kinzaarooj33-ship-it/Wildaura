// routes/tripschedules.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ Save new trip schedule
router.post("/", (req, res) => {
  const {
    hunter_id, hunter_name, hunter_email,
    guider_id, guider_name, guider_email,
    target_species, destination, start_date, end_date,
    duration_days, group_detail, additional_requirements, schedule_data
  } = req.body;

  if (!hunter_email || !guider_id || !schedule_data) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO trip_schedules
    (hunter_id, hunter_name, hunter_email, guider_id, guider_name, guider_email,
     target_species, destination, start_date, end_date, duration_days,
     group_detail, additional_requirements, schedule_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      target_species=VALUES(target_species),
      destination=VALUES(destination),
      start_date=VALUES(start_date),
      end_date=VALUES(end_date),
      duration_days=VALUES(duration_days),
      group_detail=VALUES(group_detail),
      additional_requirements=VALUES(additional_requirements),
      schedule_data=VALUES(schedule_data)
  `;

  db.query(sql, [
    hunter_id, hunter_name, hunter_email,
    guider_id, guider_name, guider_email,
    target_species, destination, start_date, end_date,
    duration_days, group_detail, additional_requirements, schedule_data
  ], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: "Schedule saved!" });
  });
});

// ✅ Admin — Get ALL schedules
router.get("/admin/all", (req, res) => {
  db.query(
    "SELECT * FROM trip_schedules ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, schedules: results });
    }
  );
});

// ✅ Get ALL schedules
router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM trip_schedules ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, schedules: results });
    }
  );
});

// ✅ Get ALL schedules by hunter_email
router.get("/hunter/:hunter_email", (req, res) => {
  db.query(
    "SELECT * FROM trip_schedules WHERE hunter_email = ? ORDER BY created_at DESC",
    [req.params.hunter_email],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, schedules: results });
    }
  );
});

// ✅ Get schedule by hunter_email + guider_id
router.get("/:hunter_email/:guider_id", (req, res) => {
  const { hunter_email, guider_id } = req.params;
  db.query(
    "SELECT * FROM trip_schedules WHERE hunter_email = ? AND guider_id = ? ORDER BY created_at DESC LIMIT 1",
    [hunter_email, guider_id],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ schedule: results[0] || null });
    }
  );
});

module.exports = router;