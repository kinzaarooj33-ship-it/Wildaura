const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ========== GET ALL SPECIES ==========
router.get("/species", (req, res) => {
  db.query("SELECT * FROM species", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: results });
  });
});

// ========== GET SPECIES BY NAME ==========
router.get("/species/:name", (req, res) => {
  const name = req.params.name;
  db.query(
    "SELECT * FROM species WHERE LOWER(REPLACE(name, ' ', '')) = ?",
    [name.toLowerCase()],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: "Not found" });
      res.json({ data: results[0] });
    }
  );
});

// ========== GET ALL WEAPONS ==========
router.get("/weapons", (req, res) => {
  db.query("SELECT * FROM weapons", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: results });
  });
});

// ========== GET WEAPON BY NAME ==========
router.get("/weapons/:name", (req, res) => {
  const name = req.params.name;
  db.query(
    "SELECT * FROM weapons WHERE LOWER(REPLACE(name, ' ', '')) = ?",
    [name.toLowerCase()],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: "Not found" });
      res.json({ data: results[0] });
    }
  );
});

// ========== GET ALL HUNTING AREAS ==========
router.get("/hunting-areas", (req, res) => {
  db.query("SELECT * FROM hunting_areas", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: results });
  });
});

// ========== GET SINGLE HUNTING AREA BY ID ==========
router.get("/hunting-areas/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM hunting_areas WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ error: "Hunting area not found" });
    res.json({ data: results[0] });
  });
});

// ========== GET ALL LAWS ==========
router.get("/laws", (req, res) => {
  db.query("SELECT * FROM laws", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ========== ADD LAW ==========
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

// ========== DELETE LAW ==========
router.delete("/laws/:id", (req, res) => {
  db.query("DELETE FROM laws WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted" });
  });
});

// ========== GET ACT BY ID WITH RELATED LAWS ==========
router.get("/acts/:id", (req, res) => {
  const actId = req.params.id;
  db.query("SELECT * FROM acts WHERE id = ?", [actId], (err, actResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (actResults.length === 0) return res.status(404).json({ act: null, laws: [] });

    const act = actResults[0];
    db.query(
      "SELECT * FROM laws WHERE reference LIKE ?",
      ["%" + act.name.split(" ").slice(0, 2).join(" ") + "%"],
      (err2, lawResults) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ act, laws: lawResults });
      }
    );
  });
});

// ========== GET ALL RESORTS ==========
router.get("/resorts", (req, res) => {
  db.query("SELECT * FROM resorts", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: results });
  });
});

// ========== GET SINGLE RESORT BY ID ==========
router.get("/resorts/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM resorts WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ error: "Resort not found" });
    res.json({ data: results[0] });
  });
});

module.exports = router;