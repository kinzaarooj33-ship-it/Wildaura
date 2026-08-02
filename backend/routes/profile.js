const express = require("express");
const router = express.Router();
const db = require("../config/db");
const upload = require("../middleware/upload");

// ========== CREATE HUNTER PROFILE ==========
router.post("/hunter-profile", upload.single("license_image"), (req, res) => {
  console.log("Received data:", req.body);

  const {
    email, name, hunting_experience, cnic_number,
    license_number, phone_number, province, address,
  } = req.body;

  const license_image = req.file ? req.file.filename : null;

  if (!email || !name || !cnic_number || !license_number) {
    console.log("Missing fields:", { email, name, cnic_number, license_number });
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO hunter_profile 
    (email, name, hunting_experience, cnic_number, license_number, license_image, phone_number, province, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    email, name, hunting_experience || null, cnic_number,
    license_number, license_image, phone_number || null,
    province || null, address || null,
  ], (err) => {
    if (err) {
      console.log("DB Error:", err);
      if (err.code === "ER_DUP_ENTRY")
        return res.status(409).json({ message: "CNIC already exists" });
      return res.status(500).json({ message: "Error saving profile", error: err.message });
    }
    res.json({ message: "Profile saved successfully" });
  });
});

// ========== GET USER PROFILE ==========
router.get("/user-profile/:email", (req, res) => {
  const email = req.params.email;

  db.query("SELECT * FROM authuser WHERE email = ?", [email], (err, authResult) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (authResult.length === 0)
      return res.status(404).json({ message: "User not found" });

    const authUser = authResult[0];

    db.query("SELECT * FROM hunter_profile WHERE email = ?", [email], (err2, hunterResult) => {
      if (err2) return res.status(500).json({ message: "Database error" });

      const hunterData = hunterResult.length > 0 ? hunterResult[0] : null;

      res.json({
        profile: {
          id: authUser.id,
          email: authUser.email,
          name: hunterData?.name || "",
          phone_number: hunterData?.phone_number || null,
          cnic_number: hunterData?.cnic_number || null,
          license_number: hunterData?.license_number || null,
          hunting_experience: hunterData?.hunting_experience || null,
          province: hunterData?.province || null,
          address: hunterData?.address || null,
          profile_image: hunterData?.profile_image || null,
        },
        hunterProfileExists: hunterData !== null,
      });
    });
  });
});

// ========== GET HUNTER PROFILE (check only) ==========
router.get("/hunter-profile/:email", (req, res) => {
  const email = req.params.email;
  db.query("SELECT * FROM hunter_profile WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length === 0)
      return res.status(404).json({ message: "Hunter profile not found" });
    res.json({ profile: result[0] });
  });
});

// ========== UPDATE HUNTER PROFILE ==========
router.put("/update-profile/:email", upload.single("profile_image"), (req, res) => {
  const email = req.params.email;
  const {
    hunting_experience, cnic_number, license_number,
    phone_number, province, address,
  } = req.body;

  const profile_image = req.file ? req.file.filename : null;

  let sql, params;

  if (profile_image) {
    sql = `
      UPDATE hunter_profile 
      SET hunting_experience=?, cnic_number=?, license_number=?, phone_number=?, province=?, address=?, profile_image=?
      WHERE email=?
    `;
    params = [hunting_experience, cnic_number, license_number, phone_number, province, address, profile_image, email];
  } else {
    sql = `
      UPDATE hunter_profile 
      SET hunting_experience=?, cnic_number=?, license_number=?, phone_number=?, province=?, address=?
      WHERE email=?
    `;
    params = [hunting_experience, cnic_number, license_number, phone_number, province, address, email];
  }

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ message: "Update failed", error: err.message });
    res.json({ message: "Profile updated successfully", profile_image });
  });
});

// ========== CREATE / UPDATE GUIDER PROFILE ==========
router.post("/guider-profile", upload.single("profile_image"), async (req, res) => {
  const {
    email, name, cnic_number, license_number, guiding_experience,
    phone_number, province, address, price_per_hour, specialization,
    latitude, longitude,
  } = req.body;

  const profile_image = req.file ? req.file.filename : null;

  if (!email) return res.status(400).json({ message: "Email required" });

  const sql = `
    INSERT INTO guider_profiles 
    (email, name, cnic_number, license_number, guiding_experience, 
     phone_number, province, address, price_per_hour, specialization, profile_image, latitude, longitude) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    name=VALUES(name), 
    cnic_number=VALUES(cnic_number), 
    license_number=VALUES(license_number),
    guiding_experience=VALUES(guiding_experience), 
    phone_number=VALUES(phone_number),
    province=VALUES(province), 
    address=VALUES(address),
    price_per_hour=VALUES(price_per_hour),
    specialization=VALUES(specialization),
    latitude=VALUES(latitude),
    longitude=VALUES(longitude),
    profile_image=IF(VALUES(profile_image) IS NOT NULL, VALUES(profile_image), profile_image)
  `;

  db.query(sql, [
    email, name, cnic_number, license_number, guiding_experience,
    phone_number, province, address, price_per_hour, specialization,
    profile_image, latitude || null, longitude || null,
  ], (err) => {
    if (err) {
      console.log("❌ Guider Profile Error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Guider profile saved!" });
  });
});

// ========== GET GUIDER PROFILE ==========
router.get("/guider-profile/:email", (req, res) => {
  const email = req.params.email;
  db.query("SELECT * FROM guider_profiles WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length === 0)
      return res.status(404).json({ message: "Guider profile not found" });
    res.json({ profile: result[0] });
  });
});

module.exports = router;