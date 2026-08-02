const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads/guiders";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ 1. Saare guiders fetch karo (with new columns)
router.get("/guiders", (req, res) => {
  const sql = `
    SELECT id, email, name, phone_number, province, address,
           specialization, guiding_experience, price_per_hour,
           license_number, cnic_number, profile_image, created_at,
           latitude, longitude, is_available, last_location_update
    FROM guider_profiles
    ORDER BY created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Server error!", error: err.message });
    res.json({ guiders: results });
  });
});

// ✅ 2. Single guider detail (with new columns)
router.get("/guiders/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM guider_profiles WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error!" });
    if (results.length === 0) return res.status(404).json({ message: "Guider nahi mila!" });
    res.json({ guider: results[0] });
  });
});

// ✅ 3. Guider by email (GET)
router.get("/guider-profile/:email", (req, res) => {
  const { email } = req.params;
  db.query(
    `SELECT id, email, name, phone_number, province, address,
            specialization, guiding_experience, price_per_hour,
            license_number, cnic_number, profile_image, created_at,
            latitude, longitude, is_available, last_location_update
     FROM guider_profiles WHERE email = ?`,
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Server error!" });
      if (results.length === 0) return res.json({ profile: null });
      res.json({ profile: results[0] });
    }
  );
});

// ✅ 4. Guider profile banao / update karo (WITH new columns)
router.post("/guider-profile", upload.single("profile_image"), (req, res) => {
  const {
    email, name, phone_number, province, address,
    specialization, guiding_experience, price_per_hour,
    license_number, cnic_number, latitude, longitude
  } = req.body;

  if (!email || !name || !phone_number) {
    return res.status(400).json({ message: "Saari required fields bharo!" });
  }

  const profileImage = req.file ? `/uploads/guiders/${req.file.filename}` : null;

  db.query("SELECT id FROM guider_profiles WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error!" });

    if (rows.length > 0) {
      // UPDATE existing profile
      let updateSql = `
        UPDATE guider_profiles 
        SET name=?, phone_number=?, province=?, address=?,
            specialization=?, guiding_experience=?, 
            price_per_hour=?, license_number=?, cnic_number=?,
            latitude=?, longitude=?
      `;
      let values = [
        name, phone_number, province, address,
        specialization, guiding_experience,
        price_per_hour, license_number, cnic_number,
        latitude || null, longitude || null
      ];

      if (profileImage) {
        updateSql = `
          UPDATE guider_profiles 
          SET name=?, phone_number=?, province=?, address=?,
              specialization=?, guiding_experience=?, 
              price_per_hour=?, license_number=?, cnic_number=?,
              latitude=?, longitude=?, profile_image=?
          WHERE email=?
        `;
        values = [
          name, phone_number, province, address,
          specialization, guiding_experience,
          price_per_hour, license_number, cnic_number,
          latitude || null, longitude || null, profileImage, email
        ];
      } else {
        updateSql += ` WHERE email=?`;
        values.push(email);
      }

      db.query(updateSql, values, (err2) => {
        if (err2) return res.status(500).json({ message: "Update error!", error: err2.message });
        res.json({ message: "Profile update ho gai! ✅" });
      });
    } else {
      // INSERT new profile
      const insertSql = `
        INSERT INTO guider_profiles 
        (email, name, phone_number, province, address, specialization, 
         guiding_experience, price_per_hour, license_number, cnic_number, 
         profile_image, latitude, longitude, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;
      db.query(insertSql, [
        email, name, phone_number, province, address,
        specialization, guiding_experience,
        price_per_hour, license_number, cnic_number,
        profileImage, latitude || null, longitude || null
      ], (err2) => {
        if (err2) return res.status(500).json({ message: "Insert error!", error: err2.message });
        res.json({ message: "Profile ban gai! ✅" });
      });
    }
  });
});

// ✅ 5. Guider location update (for emergency system)
router.put("/guider/location", (req, res) => {
  const { guider_email, latitude, longitude } = req.body;

  if (!guider_email || !latitude || !longitude) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  db.query(
    `UPDATE guider_profiles 
     SET latitude = ?, longitude = ?, last_location_update = NOW(), is_available = 1
     WHERE email = ?`,
    [latitude, longitude, guider_email],
    (err) => {
      if (err) {
        console.error("Location update error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      res.json({ success: true, message: "Location updated successfully!" });
    }
  );
});

// ✅ 6. Get guider location
router.get("/guider/location/:email", (req, res) => {
  db.query(
    `SELECT latitude, longitude, last_location_update, is_available 
     FROM guider_profiles WHERE email = ?`,
    [req.params.email],
    (err, results) => {
      if (err) return res.status(500).json({ success: false });
      if (results.length === 0 || !results[0].latitude) {
        return res.json({ success: true, hasLocation: false, message: "Location not set" });
      }
      res.json({ success: true, hasLocation: true, location: results[0] });
    }
  );
});

// ✅ 7. Update guider availability
router.patch("/guider/availability", (req, res) => {
  const { email, is_available } = req.body;

  db.query(
    "UPDATE guider_profiles SET is_available = ? WHERE email = ?",
    [is_available ? 1 : 0, email],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      res.json({ success: true, message: `Availability updated to ${is_available ? "Available" : "Unavailable"}` });
    }
  );
});

module.exports = router;