const express = require("express");
const router = express.Router();
const db = require("../config/db");

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
// ==============================
// GET ALL HUNTERS (Case-Insensitive Sort)
// ==============================
router.get("/users", (req, res) => {
  db.query("SELECT 1", (pingErr) => {
    if (pingErr) {
      console.error("❌ DB connection failed:", pingErr.message);
      return res.status(500).json({ error: "Database connection failed: " + pingErr.message });
    }

    db.query(
      `SELECT 
        id, email, name, 
        phone_number, cnic_number, license_number,
        hunting_experience, preferred_area,
        address 
       FROM hunter_profile
       ORDER BY LOWER(name) ASC`,
      (err, results) => {
        if (err) {
          console.error("❌ GET /users query error:", err.message);
          return res.status(500).json({ error: err.message });
        }
        console.log(`✅ GET /users → returned ${results.length} rows (sorted by name)`);
        res.json(results);
      }
    );
  });
});

// ==============================
// GET ALL GUIDES (Case-Insensitive Sort)
// ==============================
router.get("/guides", (req, res) => {
  db.query(
    `SELECT * FROM guider_profiles
     ORDER BY LOWER(name) ASC`,
    (err, results) => {
      if (err) {
        console.error("❌ GET /guides error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ GET /guides → returned ${results.length} rows (sorted by name)`);
      res.json(results);
    });
});

// ==============================
// GET SPECIES INFO (Case-Insensitive Sort)
// ==============================
router.get("/species", (req, res) => {
  db.query(
    `SELECT * FROM species
     ORDER BY LOWER(name) ASC`,
    (err, results) => {
      if (err) {
        console.error("❌ GET /species error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ GET /species → returned ${results.length} rows (sorted by name)`);
      res.json(results);
    });
});

// ==============================
// GROWTH STATS — Hunters/Guides cumulative + monthly bookings
// ==============================
router.get("/growth-stats", async (req, res) => {
  try {
    const monthNames = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: monthNames[d.getMonth()],
      });
    }
    const windowStart = `${months[0].ym}-01`;

    const [baseHunterRows] = await db.promise().query(
      `SELECT COUNT(*) as count FROM hunter_profile WHERE created_at < ?`, [windowStart]
    );
    const [baseGuideRows] = await db.promise().query(
      `SELECT COUNT(*) as count FROM guider_profiles WHERE created_at < ?`, [windowStart]
    );

    const [hunterRows] = await db.promise().query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as count
       FROM hunter_profile WHERE created_at >= ? GROUP BY ym`, [windowStart]
    );
    const [guideRows] = await db.promise().query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as count
       FROM guider_profiles WHERE created_at >= ? GROUP BY ym`, [windowStart]
    );
    const [bookingRows] = await db.promise().query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as count
       FROM bookings WHERE created_at >= ? GROUP BY ym`, [windowStart]
    );

    const hunterMap  = Object.fromEntries(hunterRows.map(r => [r.ym, r.count]));
    const guideMap   = Object.fromEntries(guideRows.map(r => [r.ym, r.count]));
    const bookingMap = Object.fromEntries(bookingRows.map(r => [r.ym, r.count]));

    let cumHunters = baseHunterRows[0].count;
    let cumGuides  = baseGuideRows[0].count;

    const growth = months.map(m => {
      cumHunters += hunterMap[m.ym] || 0;
      cumGuides  += guideMap[m.ym]  || 0;
      return {
        month: m.label,
        hunters: cumHunters,
        guides: cumGuides,
        bookings: bookingMap[m.ym] || 0,
      };
    });

    res.json({ success: true, growth });
  } catch (err) {
    console.error("❌ growth-stats error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================
// UPDATE HUNTER
// ==============================
router.put("/users/:id", (req, res) => {
  const {
    email, name,
    phone_number, cnic_number, license_number,
    hunting_experience, preferred_area,
    address
  } = req.body;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  db.query(
    `UPDATE hunter_profile SET 
      email=?, name=?,
      phone_number=?, cnic_number=?, license_number=?,
      hunting_experience=?, preferred_area=?,
      address=?
     WHERE id=?`,
    [
      email, name,
      phone_number, cnic_number, license_number,
      hunting_experience, preferred_area,
      address,
      id
    ],
    (err, result) => {
      if (err) {
        console.error("❌ PUT /users/:id error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`✅ PUT /users/${id} → updated successfully`);
      res.json({ message: "Hunter updated successfully!" });
    }
  );
});

// ==============================
// DELETE HUNTER
// ==============================
router.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  db.query(
    "DELETE FROM hunter_profile WHERE id=?",
    [id],
    (err, result) => {
      if (err) {
        console.error("❌ DELETE /users/:id error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`✅ DELETE /users/${id} → deleted successfully`);
      res.json({ message: "Hunter deleted successfully!" });
    }
  );
});

// ==============================
// UPDATE GUIDE
// ==============================
router.put("/guides/:id", (req, res) => {
  const {
    name, email, password,
    phone_number, cnic_number, license_number,
    hunting_experience, address
  } = req.body;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid guide ID" });
  }

  db.query(
    `UPDATE guider_profiles SET 
      name=?, email=?, password=?,
      phone_number=?, cnic_number=?, license_number=?,
      hunting_experience=?, address=?
     WHERE id=?`,
    [
      name, email, password,
      phone_number, cnic_number, license_number,
      hunting_experience, address,
      id
    ],
    (err, result) => {
      if (err) {
        console.error("❌ PUT /guides/:id error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Guide not found" });
      }
      res.json({ message: "Guide updated successfully!" });
    }
  );
});

// ==============================
// DELETE GUIDE
// ==============================
router.delete("/guides/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid guide ID" });
  }

  db.query(
    "DELETE FROM guider_profiles WHERE id=?",
    [id],
    (err, result) => {
      if (err) {
        console.error("❌ DELETE /guides/:id error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Guide not found" });
      }
      res.json({ message: "Guide deleted successfully!" });
    }
  );
});

// ==============================
// HUNTING AREAS CRUD
// ==============================
router.get("/hunting-areas", (req, res) => {
  db.query("SELECT * FROM hunting_areas ORDER BY id ASC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post("/hunting-areas", (req, res) => {
  const {
    name, image, province, region, season,
    status, description, animals, fees,
    permit_required, best_time, contact,
    contact_phone, weather
  } = req.body;

  db.query(
    `INSERT INTO hunting_areas 
      (name, image, province, region, season, status, description, animals, fees, permit_required, best_time, contact, contact_phone, weather)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, image, province, region, season, status, description, animals, fees, permit_required, best_time, contact, contact_phone, weather],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Hunting area added", id: result.insertId });
    }
  );
});

router.put("/hunting-areas/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const {
    name, image, province, region, season,
    status, description, animals, fees,
    permit_required, best_time, contact,
    contact_phone, weather
  } = req.body;

  db.query(
    `UPDATE hunting_areas SET 
      name=?, image=?, province=?, region=?, season=?, status=?, description=?, 
      animals=?, fees=?, permit_required=?, best_time=?, contact=?, contact_phone=?, weather=?
     WHERE id=?`,
    [name, image, province, region, season, status, description, animals, fees, permit_required, best_time, contact, contact_phone, weather, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Area not found" });
      res.json({ message: "Hunting area updated" });
    }
  );
});

router.delete("/hunting-areas/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  db.query("DELETE FROM hunting_areas WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Area not found" });
    res.json({ message: "Hunting area deleted" });
  });
});

// ==============================
// ADMIN LOGIN WITH CODE
// ==============================
router.post("/login", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  db.query(
    "SELECT * FROM admins WHERE code=?",
    [code],
    (err, results) => {
      if (err) {
        console.error("❌ POST /login error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid code!" });
      }
      const admin = results[0];
      console.log(`✅ Admin logged in: ${admin.name}`);
      res.json({ id: admin.id, name: admin.name });
    }
  );
});

// ==============================
// LAWS CRUD
// ==============================
router.get("/laws", (req, res) => {
  db.query("SELECT * FROM laws ORDER BY id ASC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post("/laws", (req, res) => {
  const { title, category, description, footerLabel, footerValue, reference } = req.body;
  db.query(
    "INSERT INTO laws (title, category, description, footerLabel, footerValue, reference) VALUES (?, ?, ?, ?, ?, ?)",
    [title, category, description, footerLabel, footerValue, reference],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Law added", id: result.insertId });
    }
  );
});

router.put("/laws/:id", (req, res) => {
  const { title, category, description, footerLabel, footerValue, reference } = req.body;
  const id = parseInt(req.params.id, 10);
  db.query(
    "UPDATE laws SET title=?, category=?, description=?, footerLabel=?, footerValue=?, reference=? WHERE id=?",
    [title, category, description, footerLabel, footerValue, reference, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Law not found" });
      res.json({ message: "Law updated" });
    }
  );
});

router.delete("/laws/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.query("DELETE FROM laws WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Law not found" });
    res.json({ message: "Law deleted" });
  });
});

// ==============================
// ACTS CRUD
// ==============================
router.get("/acts", (req, res) => {
  db.query("SELECT * FROM acts ORDER BY id ASC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post("/acts", (req, res) => {
  const { name, province, year, description, key_points } = req.body;
  db.query(
    "INSERT INTO acts (name, province, year, description, key_points) VALUES (?, ?, ?, ?, ?)",
    [name, province, year, description, key_points],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Act added", id: result.insertId });
    }
  );
});

router.put("/acts/:id", (req, res) => {
  const { name, province, year, description, key_points } = req.body;
  const id = parseInt(req.params.id, 10);
  db.query(
    "UPDATE acts SET name=?, province=?, year=?, description=?, key_points=? WHERE id=?",
    [name, province, year, description, key_points, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Act not found" });
      res.json({ message: "Act updated" });
    }
  );
});

router.delete("/acts/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.query("DELETE FROM acts WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Act not found" });
    res.json({ message: "Act deleted" });
  });
});

module.exports = router;