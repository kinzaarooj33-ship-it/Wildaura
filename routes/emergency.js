// routes/emergency.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ── GET /api/emergency/all ───────────────────────────────────────
router.get("/all", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM emergency_requests ORDER BY created_at DESC`
    );
    res.json({ success: true, emergencies: rows });
  } catch (err) {
    console.error("Fetch all emergencies error:", err);
    res.status(500).json({ success: false });
  }
});

// ── Haversine distance (km) ──────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── POST /api/emergency/send ─────────────────────────────────────
router.post("/send", async (req, res) => {
  const { hunter_id, hunter_name, hunter_email, hunter_phone,
          latitude, longitude, location_text } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: "Location required" });
  }

  try {
    // 1. Save emergency request
    const [result] = await db.promise().query(
      `INSERT INTO emergency_requests
       (hunter_id, hunter_name, hunter_email, hunter_phone, latitude, longitude, location_text)
       VALUES (?,?,?,?,?,?,?)`,
      [hunter_id, hunter_name, hunter_email, hunter_phone || null,
       latitude, longitude, location_text || null]
    );
    const emergencyId = result.insertId;

    // Get guiders with location
    const [guiders] = await db.promise().query(
      `SELECT id, name, email, latitude, longitude FROM guider_profiles
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_available = 1`
    );

    const nearby = guiders.filter(g =>
      getDistance(latitude, longitude, g.latitude, g.longitude) <= 100
    ).slice(0, 10);

    const targets = nearby.length > 0 ? nearby : guiders.slice(0, 20);

    for (const g of targets) {
      await db.promise().query(
        `INSERT INTO emergency_assignments (emergency_id, guider_id, guider_email, guider_name)
         VALUES (?,?,?,?)`,
        [emergencyId, g.id, g.email, g.name]
      );

      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

      // Guider notification
      await db.promise().query(
        `INSERT INTO notifications (user_email, type, message, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
        [g.email, "emergency",
         `🚨 EMERGENCY! ${hunter_name || "A hunter"} needs help! Distance: ${getDistance(latitude, longitude, g.latitude, g.longitude).toFixed(1)}km\n📍 ${mapsLink}`]
      );
    }

    // Hunter notification
    await db.promise().query(
      `INSERT INTO notifications (user_email, type, message, is_read, created_at)
       VALUES (?, ?, ?, 0, NOW())`,
      [hunter_email, "emergency",
       `✅ Emergency request sent! ${targets.length} guider(s) notified nearby.`]
    );

    // Broadcast after 5 minutes if not accepted
    setTimeout(async () => {
      try {
        const [check] = await db.promise().query(
          `SELECT status FROM emergency_requests WHERE id=?`, [emergencyId]
        );
        if (check[0]?.status === "pending") {
          const [allGuiders] = await db.promise().query(
            `SELECT id, name, email FROM guider_profiles WHERE is_available = 1 LIMIT 50`
          );
          for (const g of allGuiders) {
            const [exists] = await db.promise().query(
              `SELECT id FROM emergency_assignments WHERE emergency_id=? AND guider_email=?`,
              [emergencyId, g.email]
            );
            if (exists.length === 0) {
              await db.promise().query(
                `INSERT INTO emergency_assignments (emergency_id, guider_id, guider_email, guider_name)
                 VALUES (?,?,?,?)`,
                [emergencyId, g.id, g.email, g.name]
              );
              await db.promise().query(
                `INSERT INTO notifications (user_email, type, message, is_read, created_at)
                 VALUES (?, ?, ?, 0, NOW())`,
                [g.email, "emergency",
                 `🚨 URGENT BROADCAST! ${hunter_name || "A hunter"} still needs help! No one has responded yet.`]
              );
            }
          }
          await db.promise().query(
            `UPDATE emergency_requests SET status='broadcast', broadcast_at=NOW() WHERE id=?`,
            [emergencyId]
          );
          await db.promise().query(
            `INSERT INTO notifications (user_email, type, message, is_read, created_at)
             VALUES (?, ?, ?, 0, NOW())`,
            [hunter_email, "emergency",
             `📢 No response yet — request broadcast to ALL available guiders!`]
          );
        }
      } catch(e) { console.error("Broadcast error:", e); }
    }, 5 * 60 * 1000);

    res.json({ success: true, emergency_id: emergencyId, notified: targets.length });
  } catch (err) {
    console.error("Emergency send error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

// ── POST /api/emergency/respond ──────────────────────────────────
router.post("/respond", async (req, res) => {
  const { emergency_id, guider_email, guider_name, action } = req.body;

  try {
    await db.promise().query(
      `UPDATE emergency_assignments SET status=?, responded_at=NOW()
       WHERE emergency_id=? AND guider_email=?`,
      [action === "accept" ? "accepted" : "rejected", emergency_id, guider_email]
    );

    const [rows] = await db.promise().query(
      `SELECT * FROM emergency_requests WHERE id=?`, [emergency_id]
    );
    const emergency = rows[0];
    if (!emergency) return res.status(404).json({ success: false });

    if (action === "accept") {
      await db.promise().query(
        `UPDATE emergency_requests SET status='accepted', accepted_by=?, accepted_at=NOW()
         WHERE id=? AND status IN ('pending','broadcast')`,
        [guider_email, emergency_id]
      );

      const mapsLink = `https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}`;

      await db.promise().query(
        `INSERT INTO notifications (user_email, type, message, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
        [emergency.hunter_email, "emergency",
         `✅ ${guider_name} has accepted your emergency request and is on the way!\n📍 ${mapsLink}`]
      );
    } else {
      await db.promise().query(
        `INSERT INTO notifications (user_email, type, message, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
        [emergency.hunter_email, "emergency",
         `❌ ${guider_name} could not respond. Other guiders are still notified.`]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Emergency respond error:", err);
    res.status(500).json({ success: false });
  }
});

// ── GET /api/emergency/guider/:email ────────────────────────────
// Active (pending/broadcast) emergencies jo is guider ko assign hui hain
router.get("/guider/:email", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT er.*, ea.status as assignment_status, ea.id as assignment_id
       FROM emergency_assignments ea
       JOIN emergency_requests er ON ea.emergency_id = er.id
       WHERE ea.guider_email = ?
       AND er.status IN ('pending','broadcast')
       ORDER BY er.created_at DESC`,
      [req.params.email]
    );
    res.json({ success: true, emergencies: rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ── GET /api/emergency/guider/:email/accepted ────────────────────
router.get("/guider/:email/accepted", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT er.*, ea.status as assignment_status, ea.id as assignment_id
       FROM emergency_assignments ea
       JOIN emergency_requests er ON ea.emergency_id = er.id
       WHERE ea.guider_email = ?
       AND er.status = 'accepted'
       AND er.accepted_by = ?
       ORDER BY er.accepted_at DESC`,
      [req.params.email, req.params.email]
    );
    res.json({ success: true, emergencies: rows });
  } catch (err) {
    console.error("Fetch accepted emergencies error:", err);
    res.status(500).json({ success: false });
  }
});

// ── GET /api/emergency/hunter/:email ────────────────────────────
router.get("/hunter/:email", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM emergency_requests WHERE hunter_email=? ORDER BY created_at DESC LIMIT 10`,
      [req.params.email]
    );
    res.json({ success: true, emergencies: rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ── PUT /api/emergency/seen/:assignment_id ───────────────────────
router.put("/seen/:assignment_id", async (req, res) => {
  try {
    await db.promise().query(
      `UPDATE emergency_assignments SET status='seen', seen_at=NOW() WHERE id=?`,
      [req.params.assignment_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ── PUT /api/emergency/guider/location ───────────────────────────
router.put("/guider/location", async (req, res) => {
  const { guider_email, latitude, longitude } = req.body;

  if (!guider_email || !latitude || !longitude) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    await db.promise().query(
      `UPDATE guider_profiles SET latitude = ?, longitude = ?, last_location_update = NOW(), is_available = 1
       WHERE email = ?`,
      [latitude, longitude, guider_email]
    );
    res.json({ success: true, message: "Location updated successfully!" });
  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ success: false, message: "Failed to update location" });
  }
});

// ── GET /api/emergency/guider/location/:email ────────────────────
router.get("/guider/location/:email", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT latitude, longitude, last_location_update, is_available FROM guider_profiles WHERE email = ?`,
      [req.params.email]
    );
    if (rows.length === 0 || !rows[0].latitude) {
      return res.json({ success: true, hasLocation: false, message: "Location not set" });
    }
    res.json({ success: true, hasLocation: true, location: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ── GET /api/emergency/pending-calls ──────────────────────────────
// Admin ke liye: wo emergencies jinhe abhi tak kisi guider ne accept
// nahi kiya (status = pending ya broadcast), saath mein assigned
// guiders ki list (call karne ke liye phone number samet)
router.get("/pending-calls", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT
         er.id, er.hunter_name, er.hunter_email, er.hunter_phone,
         er.location_text, er.latitude, er.longitude,
         er.created_at, er.status,
         ea.guider_name, ea.guider_email,
         gp.phone_number AS guider_phone
       FROM emergency_requests er
       LEFT JOIN emergency_assignments ea ON ea.emergency_id = er.id
       LEFT JOIN guider_profiles gp ON gp.email = ea.guider_email
       WHERE er.status IN ('pending', 'broadcast')
       ORDER BY er.created_at DESC`
    );
    res.json({ success: true, emergencies: rows });
  } catch (err) {
    console.error("Fetch pending calls error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/emergency/resolve/:id ────────────────────────────────
// Admin manually emergency ko resolved mark kare
router.put("/resolve/:id", async (req, res) => {
  try {
    await db.promise().query(
      `UPDATE emergency_requests SET status = 'resolved', resolved_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Resolve emergency error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;