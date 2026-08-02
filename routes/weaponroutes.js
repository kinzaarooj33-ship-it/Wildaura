const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ─── GET all weapons ───────────────────────────────────────
router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM weapons",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // ✅ SORT BY NAME ASCENDING (CASE-INSENSITIVE)
      const sorted = results.sort((a, b) => {
        const nameA = String(a.name || '').toLowerCase();
        const nameB = String(b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      res.json(sorted);
    }
  );
});

// ─── GET single weapon ─────────────────────────────────────
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM weapons WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ error: "Weapon not found" });
      res.json(results[0]);
    }
  );
});

// ─── POST add weapon ───────────────────────────────────────
router.post("/", (req, res) => {
  const {
    name, image, short_desc, description, weapon_type, common_use,
    effective_range, average_weight, caliber_types, firing_mechanism,
    accuracy_level, noise_level, suitable_for, advantages,
    safety_guidelines, legal_regulations, additional_info,
  } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  db.query(
    `INSERT INTO weapons
      (name, image, short_desc, description, weapon_type, common_use,
       effective_range, average_weight, caliber_types, firing_mechanism,
       accuracy_level, noise_level, suitable_for, advantages,
       safety_guidelines, legal_regulations, additional_info)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      name, image || "", short_desc || "", description || "",
      weapon_type || "", common_use || "", effective_range || "",
      average_weight || "", caliber_types || "", firing_mechanism || "",
      accuracy_level || "", noise_level || "", suitable_for || "",
      advantages || "", safety_guidelines || "", legal_regulations || "",
      additional_info || "",
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Weapon added successfully", id: result.insertId });
    }
  );
});

// ─── PUT update weapon ─────────────────────────────────────
router.put("/:id", (req, res) => {
  const {
    name, image, short_desc, description, weapon_type, common_use,
    effective_range, average_weight, caliber_types, firing_mechanism,
    accuracy_level, noise_level, suitable_for, advantages,
    safety_guidelines, legal_regulations, additional_info,
  } = req.body;

  db.query(
    `UPDATE weapons SET
      name = ?, image = ?, short_desc = ?, description = ?,
      weapon_type = ?, common_use = ?, effective_range = ?,
      average_weight = ?, caliber_types = ?, firing_mechanism = ?,
      accuracy_level = ?, noise_level = ?, suitable_for = ?,
      advantages = ?, safety_guidelines = ?, legal_regulations = ?,
      additional_info = ?
     WHERE id = ?`,
    [
      name, image || "", short_desc || "", description || "",
      weapon_type || "", common_use || "", effective_range || "",
      average_weight || "", caliber_types || "", firing_mechanism || "",
      accuracy_level || "", noise_level || "", suitable_for || "",
      advantages || "", safety_guidelines || "", legal_regulations || "",
      additional_info || "", req.params.id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Weapon updated successfully" });
    }
  );
});

// ─── DELETE weapon ─────────────────────────────────────────
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM weapons WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Weapon deleted successfully" });
    }
  );
});

module.exports = router;