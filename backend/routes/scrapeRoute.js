/**
 * WILDAURA — Scrape Routes
 * Handles: /api/admin/scrape/...
 *
 * Areas   : POST /api/admin/scrape/areas/all       — scrape all areas
 * POST /api/admin/scrape/areas/:id        — scrape one area
 *
 * Weapons : POST /api/admin/scrape/weapons/all       — scrape all weapons
 * POST /api/admin/scrape/weapons/:id        — scrape one weapon
 *
 * Species : POST /api/admin/scrape/species/all       — scrape all species
 * POST /api/admin/scrape/species/:id        — scrape one species
 *
 * Resorts : POST /api/admin/scrape/resorts/all       — scrape all resorts
 * POST /api/admin/scrape/resorts/:id        — scrape one resort
 *
 * Status  : GET  /api/admin/scrape/status            — live log polling
 * Stop    : POST /api/admin/scrape/stop              — request scraper to stop
 */

const express = require("express");
const router  = express.Router();

const { scrapeAll: scrapeAllAreas,   scrapeOne: scrapeOneArea    } = require("../scrapers/huntingareasScraper");
const { scrapeAll: scrapeAllWeapons, scrapeOne: scrapeOneWeapon  } = require("../scrapers/weaponScraper");
const { scrapeAll: scrapeAllSpecies, scrapeOne: scrapeOneSpecies } = require("../scrapers/speciesScraper");
const { scrapeAll: scrapeAllResorts, scrapeOne: scrapeOneResort  } = require("../scrapers/resortScraper");
const { runScraper: runLawsScraper } = require('../scrapers/huntingLawsScraper');

// ── Shared State ──────────────────────────────────────────
let scrapeState = {
  running: false,
  log:     [],
  error:   null,
  stopRequested: false, // ✅ NEW — set true when user clicks "Stop"
};

function resetState() {
  scrapeState = { running: true, log: [], error: null, stopRequested: false };
}

function addLog(msg) {
  scrapeState.log.push({ time: new Date().toISOString(), msg });
}

// ✅ NEW — helper scrapers call between items to check if they should stop
function isStopRequested() {
  return scrapeState.stopRequested;
}

// ── GET /api/admin/scrape/status ──────────────────────────
router.get("/status", (req, res) => {
  res.json(scrapeState);
});

// ── POST /api/admin/scrape/stop ───────────────────────────
// ✅ NEW — frontend calls this when user clicks "Stop"
router.post("/stop", (req, res) => {
  if (!scrapeState.running) {
    return res.json({ success: false, message: "No scraper running" });
  }
  scrapeState.stopRequested = true;
  addLog("🛑 Stop requested by user — finishing current item then halting...");
  res.json({ success: true, message: "Stop signal sent" });
});

// ═══════════════════════════════════════════════════════════
// AREAS (Fixed Route Clash by adding /areas prefix)
// ═══════════════════════════════════════════════════════════

router.post("/areas/all", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  resetState();
  res.json({ success: true, message: "Areas scrape started" });

  try {
    await scrapeAllAreas(addLog, isStopRequested); // ✅ pass stop checker
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

router.post("/areas/:id", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  const id = parseInt(req.params.id);
  if (isNaN(id))
    return res.status(400).json({ success: false, message: "Invalid ID" });

  resetState();
  res.json({ success: true, message: `Area ${id} scrape started` });

  try {
    await scrapeOneArea(id, addLog);
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════
// WEAPONS
// ═══════════════════════════════════════════════════════════

router.post("/weapons/all", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  resetState();
  res.json({ success: true, message: "Weapons scrape started" });

  try {
    await scrapeAllWeapons(addLog, isStopRequested); // ✅ pass stop checker
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

router.post("/weapons/:id", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  const id = parseInt(req.params.id);
  if (isNaN(id))
    return res.status(400).json({ success: false, message: "Invalid ID" });

  resetState();
  res.json({ success: true, message: `Weapon ${id} scrape started` });

  try {
    await scrapeOneWeapon(id, addLog);
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════
// LAWS
// ═══════════════════════════════════════════════════════════

router.post("/laws/all", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  resetState();
  res.json({ success: true, message: "Laws scrape started" });

  try {
    await runLawsScraper(addLog, isStopRequested); // ✅ pass stop checker
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════
// SPECIES
// ═══════════════════════════════════════════════════════════

router.post("/species/all", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  resetState();
  res.json({ success: true, message: "Species scrape started" });

  try {
    await scrapeAllSpecies(addLog, isStopRequested); // ✅ pass stop checker
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

router.post("/species/:id", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  const id = parseInt(req.params.id);
  if (isNaN(id))
    return res.status(400).json({ success: false, message: "Invalid ID" });

  resetState();
  res.json({ success: true, message: `Species ${id} scrape started` });

  try {
    await scrapeOneSpecies(id, addLog);
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════
// RESORTS
// ═══════════════════════════════════════════════════════════

router.post("/resorts/all", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  resetState();
  res.json({ success: true, message: "Resorts scrape started" });

  try {
    await scrapeAllResorts(addLog, isStopRequested); // ✅ pass stop checker
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

router.post("/resorts/:id", async (req, res) => {
  if (scrapeState.running)
    return res.json({ success: false, message: "Scraper already running" });

  const id = parseInt(req.params.id);
  if (isNaN(id))
    return res.status(400).json({ success: false, message: "Invalid ID" });

  resetState();
  res.json({ success: true, message: `Resort ${id} scrape started` });

  try {
    await scrapeOneResort(id, addLog);
    scrapeState.running = false;
  } catch (err) {
    scrapeState.running = false;
    scrapeState.error   = err.message;
    addLog(`❌ ERROR: ${err.message}`);
  }
});

module.exports = router;