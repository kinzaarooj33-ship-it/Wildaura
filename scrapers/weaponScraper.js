// weaponScraper.js — AI enrichment added

const puppeteer = require("puppeteer-core");
const db = require("../config/db");
const { aiEnrichMissing, hasMissingFields } = require("./weaponAiEnrich"); // ← naya

const BROWSER_PATH =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const WEAPONS_LIST = [
  { name: "Rifle", wiki: "Rifle" },
  { name: "Shotgun", wiki: "Shotgun" },
  { name: "Air Gun", wiki: "Air_gun" },
  { name: "Sniper Rifle", wiki: "Sniper_rifle" },
  { name: "Double Barrel", wiki: "Double-barrelled_shotgun" },
  { name: "Single Shot Rifle", wiki: "Single-shot_firearm", fallback_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Ruger_No1.jpg/640px-Ruger_No1.jpg" },
  { name: "Crossbow", wiki: "Crossbow" },
  { name: "Compound Bow", wiki: "Compound_bow" },
  { name: "Air Weapon", wiki: "Air_gun" },
];

const STATIC_DATA = {
  Rifle: {
    accuracy_level: "High", noise_level: "High (150–165 dB)",
    suitable_for: "Chinkara Goat, Blackbuck, Wild Boar, Mountain Goat",
    advantages: "High accuracy for long distance hunting. Suitable for open terrain.",
    common_use: "Big Game Hunting", safety_guidelines: "Always keep muzzle pointed in safe direction.",
    legal_regulations: "Valid firearm license required.",
    additional_info: "Rifles are often equipped with optical scopes.",
  },
  Shotgun: {
    accuracy_level: "Medium", noise_level: "Very High (155–165 dB)",
    suitable_for: "Quail, Pheasant, Duck, Partridge",
    advantages: "Very effective at close range.", common_use: "Bird & Small Game Hunting",
    safety_guidelines: "Follow all shotgun safety rules.",
    legal_regulations: "Valid firearm license required.",
    additional_info: "Shotguns are most effective under 50 meters.",
  },
};

async function openBrowser() {
  return await puppeteer.launch({
    headless: true, executablePath: BROWSER_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

async function scrapeWikipedia(wikiName) {
  const browser = await openBrowser();
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiName.replace(/ /g, "_"))}`;
  console.log(`Wikipedia URL: ${url}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    const data = await page.evaluate(() => {
      const r = { short_desc: "", description: "", image: "", weapon_type: "", caliber_types: "", firing_mechanism: "", effective_range: "", average_weight: "" };
      document.querySelectorAll(".infobox tr").forEach((row) => {
        const label = row.querySelector("th")?.innerText?.toLowerCase().trim() || "";
        const value = row.querySelector("td")?.innerText?.trim().replace(/\[.*?\]/g, "").replace(/\n/g, ", ").slice(0, 300) || "";
        if (!value) return;
        if (label.includes("cartridge") || label.includes("caliber")) r.caliber_types = value;
        if (label.includes("action") || label.includes("mechanism")) r.firing_mechanism = value;
        if (label.includes("effective") && label.includes("range")) r.effective_range = value;
        if ((label.includes("weight") || label.includes("mass")) && !label.includes("bullet")) r.average_weight = value;
        if (label.includes("type") && !r.weapon_type) r.weapon_type = value;
      });
      const img = document.querySelector(".infobox img");
      if (img) { let src = img.src || img.getAttribute("src"); if (src?.startsWith("//")) src = "https:" + src; r.image = src; }
      r.short_desc = document.querySelector(".shortdescription")?.innerText || "";
      const paras = document.querySelectorAll(".mw-parser-output > p");
      for (const p of paras) { const text = p.innerText.trim().replace(/\[.*?\]/g, ""); if (text.length > 100) { r.description = text.slice(0, 600); break; } }
      return r;
    });
    await browser.close();
    return data;
  } catch (err) {
    await browser.close();
    console.log(`Wikipedia ERROR: ${err.message}`);
    return {};
  }
}

function saveWeapon(w) {
  return new Promise((resolve) => {
    db.query(
      `INSERT INTO weapons (name,image,short_desc,description,weapon_type,common_use,effective_range,average_weight,caliber_types,firing_mechanism,accuracy_level,noise_level,suitable_for,advantages,safety_guidelines,legal_regulations,additional_info,scraped_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
       ON DUPLICATE KEY UPDATE scraped_at=NOW(),image=VALUES(image),short_desc=VALUES(short_desc),description=VALUES(description),weapon_type=VALUES(weapon_type),common_use=VALUES(common_use),effective_range=VALUES(effective_range),average_weight=VALUES(average_weight),caliber_types=VALUES(caliber_types),firing_mechanism=VALUES(firing_mechanism),accuracy_level=VALUES(accuracy_level),noise_level=VALUES(noise_level),suitable_for=VALUES(suitable_for),advantages=VALUES(advantages),safety_guidelines=VALUES(safety_guidelines),legal_regulations=VALUES(legal_regulations),additional_info=VALUES(additional_info)`,
      [w.name,w.image||"",w.short_desc||"",w.description||"",w.weapon_type||"",w.common_use||"",w.effective_range||"",w.average_weight||"",w.caliber_types||"",w.firing_mechanism||"",w.accuracy_level||"",w.noise_level||"",w.suitable_for||"",w.advantages||"",w.safety_guidelines||"",w.legal_regulations||"",w.additional_info||""],
      (err) => { if (err) console.error(`DB ERROR: ${err.message}`); else console.log(`DB SAVE ✅ ${w.name}`); resolve(); }
    );
  });
}

async function scrapeOne(id, addLog = console.log) {
  const wp = WEAPONS_LIST[id - 1];
  if (!wp) { addLog(`❌ Weapon ID ${id} not found`); return; }
  const static_ = STATIC_DATA[wp.name] || {};
  addLog(`▶ Scraping ${wp.name}`);

  const wiki = await scrapeWikipedia(wp.wiki);

  let merged = {
    name: wp.name,
    image: wiki.image || wp.fallback_image || "",
    short_desc: wiki.short_desc || "",
    description: wiki.description || "",
    weapon_type: wiki.weapon_type || "",
    common_use: static_.common_use || "",
    effective_range: wiki.effective_range || "",
    average_weight: wiki.average_weight || "",
    caliber_types: wiki.caliber_types || "",
    firing_mechanism: wiki.firing_mechanism || "",
    accuracy_level: static_.accuracy_level || "",
    noise_level: static_.noise_level || "",
    suitable_for: static_.suitable_for || "",
    advantages: static_.advantages || "",
    safety_guidelines: static_.safety_guidelines || "",
    legal_regulations: static_.legal_regulations || "",
    additional_info: static_.additional_info || "",
  };

  // ── AI enrichment ─────────────────────────────────────────────────────
  if (hasMissingFields(merged)) {
    addLog(`  [AI]   Missing fields detected — AI is filling missing fields...`);
    merged = await aiEnrichMissing(merged, addLog);
  } else {
    addLog(`  [AI]  Skip — All fields are already filled`);
  }

  await saveWeapon(merged);
  addLog(`✅ Saved ${wp.name}`);
}

// ✅ stopCheck — optional function jo true return kare jab user "Stop" click kare
async function scrapeAll(addLog = console.log, stopCheck = () => false) {
  addLog("=".repeat(50));
  addLog("WILDAURA — WEAPONS SCRAPER");
  addLog("=".repeat(50));
  for (let i = 0; i < WEAPONS_LIST.length; i++) {
    // ✅ NEW — har weapon se pehle check karo ke stop hua hai ya nahi
    if (stopCheck()) {
      addLog("🛑 Scraping stopped by user.");
      addLog(`  Processed ${i}/${WEAPONS_LIST.length} weapons before stopping.`);
      return;
    }

    const wp = WEAPONS_LIST[i];
    addLog(`\n[${i + 1}/${WEAPONS_LIST.length}] ▶ ${wp.name}`);
    await scrapeOne(i + 1, addLog);

    if (i < WEAPONS_LIST.length - 1) {
      // ✅ NEW — pause se pehle bhi check karo, taake pause ke douraan stop ho to fauran ruk jaye
      if (stopCheck()) {
        addLog("🛑 Scraping stopped by user.");
        return;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  addLog("✅ All weapons scraped");
}

module.exports = { scrapeAll, scrapeOne };

// Direct run
if (require.main === module) {
  scrapeAll(console.log)
    .then(() => { console.log("Done!"); process.exit(0); })
    .catch((err) => { console.error(err); process.exit(1); });
}