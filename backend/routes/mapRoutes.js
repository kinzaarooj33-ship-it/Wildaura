const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Helper — sab hunters ko notify karo
async function notifyHunters(type, title, message) {
  try {
    const [hunters] = await db.promise().query(
      `SELECT email FROM authuser WHERE role = 'user'`
    );
    for (const hunter of hunters) {
      await db.promise().query(
        `INSERT INTO notifications (user_email, type, title, message, is_read, created_at, user_role) 
         VALUES (?, ?, ?, ?, 0, NOW(), 'user')`,
        [hunter.email, type, title, message]
      );
    }
  } catch (err) {
    console.error("Notify hunters error:", err);
  }
}

// 🗺️ Sab Hunting Areas with lat/lng
router.get("/hunting-areas", (req, res) => {
  const query = `
    SELECT 
      id, name, province, region, season, 
      permit_required, latitude, longitude, status
    FROM hunting_areas
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Map hunting areas error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, data: results });
  });
});

// ✅ PUT - hunting area update + notify
router.put("/hunting-areas/:id", async (req, res) => {
  const { id } = req.params;
  const { name, province, region, season, permit_required, latitude, longitude, status } = req.body;

  try {
    const [result] = await db.promise().query(
      `UPDATE hunting_areas 
       SET name=?, province=?, region=?, season=?, permit_required=?, latitude=?, longitude=?, status=?
       WHERE id=?`,
      [name, province, region, season, permit_required, latitude, longitude, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Area not found" });
    }

    // ✅ Notify hunters
    await notifyHunters(
      'area_update',
      `Hunting Area Update: ${name}`,
      `${name} hunting area ki information update hui hai. Status: ${status}. Details check karein!`
    );

    res.json({ success: true, message: "Updated successfully" });
  } catch (err) {
    console.error("Hunting area update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🏨 Sab Resorts with lat/lng
router.get("/resorts", (req, res) => {
  const query = `
    SELECT 
      id, name, province, location, type, 
      price_per_night, phone, latitude, longitude
    FROM resorts
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Map resorts error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, data: results });
  });
});

module.exports = router;