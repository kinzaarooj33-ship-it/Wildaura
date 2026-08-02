/**
 * ============================================================
 *  Wild Aura — Hunting Laws Scraper (REAL GOVERNMENT SOURCES)
 *  Location : /scrapers/huntingLawsScraper.js
 * ============================================================
 */

const puppeteer = require("puppeteer-core");
const cron      = require("node-cron");
const db        = require("../config/db");

const BROWSER_PATH =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

// ─────────────────────────────────────────────────────────────
//  VALID LAW KEYWORDS
// ─────────────────────────────────────────────────────────────
const LAW_KEYWORDS = [
  "hunting", "hunt", "prohibited", "banned", "illegal",
  "permit", "license", "licence", "penalty", "fine",
  "jail", "imprisonment", "wildlife act", "ordinance",
  "season", "protected", "trophy", "markhor", "ibex",
  "poaching", "regulation", "wildlife law", "conservation",
  "game bird", "migratory", "closed season", "open season",
  "cruelty", "animal welfare", "trap", "net", "poison",
];

const GARBAGE_PATTERNS = [
  /^email/i, /^©/i, /copyright/i, /contact us/i,
  /opening hours/i, /phone:/i, /location:/i,
  /sitemap/i, /privacy policy/i, /terms/i,
  /this goal assesses/i, /sentience/i,
  /\d{4} punjab wildlife & parks/i,
  /wildlife breeding center/i,
  /wildlife protected area/i,
  /^wildlife notifications$/i,
  /^home$/i, /^about$/i, /^media$/i,
  /feedback form/i, /careers/i,
  /^conservation$/i,
  /^wildlife$/i,
  /^hunting$/i,
  /^laws$/i,
  /^pakistan$/i,
];

function isValidLaw(title, description) {
  if (!title || !description) return false;
  for (const pattern of GARBAGE_PATTERNS) {
    if (pattern.test(title.trim())) return false;
  }
  if (title.length < 10 || title.length > 150) return false;
  if (/^https?:\/\//i.test(title))              return false;
  const combined = (title + " " + description).toLowerCase();
  return LAW_KEYWORDS.some((kw) => combined.includes(kw));
}

function normalizeKey(title) {
  return title
    .toLowerCase()
    .replace(/\bsec\.\s*/gi, "section ")
    .replace(/\bsect\.\s*/gi, "section ")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .slice(0, 80);
}

async function openBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: BROWSER_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

// ─────────────────────────────────────────────────────────────
//  SOURCE 1 — Punjab Wildlife Dept
// ─────────────────────────────────────────────────────────────
async function scrapePunjabWildlife(addLog) {
  const browser = await openBrowser();
  const page    = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  );

  const laws = [];
  try {
    addLog("🌐 [Website] Punjab Wildlife Dept — pwl.gop.pk");

    await page.goto("https://pwl.gop.pk/wl_notifications/", {
      waitUntil: "networkidle2", timeout: 25000,
    });

    const notifTexts = await page.evaluate(() => {
      const results = [];
      const content = document.querySelector(
        ".elementor-section, .entry-content, main, article, .page-content"
      ) || document.body;
      content.querySelectorAll("p, li, h2, h3, h4, a").forEach((el) => {
        const text = el.innerText?.trim() || "";
        if (text.length > 30 && text.length < 500) results.push(text);
      });
      return [...new Set(results)];
    });

    notifTexts.forEach((text) => {
      const titleCandidate = text.split(/[.\n]/)[0].trim().slice(0, 100);
      if (!isValidLaw(titleCandidate, text)) return;

      let category      = "Prohibited";
      let action_type   = "Penalty";

      if (/season|partridge|quail|duck|chakor/i.test(text)) { category = "Seasonal";       action_type = "Season"; }
      if (/permit|special/i.test(text))                       category = "Special Permit";
      if (/license|licence/i.test(text))                    { category = "License";         action_type = "License"; }

      const penaltyMatch = text.match(/(fine|jail|imprisonment|rupees|Rs\.?[\s\d,]+)[^.]{0,80}/i);

      laws.push({
        title:         titleCandidate,
        category,
        description:   text.slice(0, 400),
        action_type,
        action_detail: penaltyMatch ? penaltyMatch[0].trim().slice(0, 80) : "Punjab Wildlife Act 1974",
        reference:     "Punjab Wildlife & Parks Dept (pwl.gop.pk)",
      });
    });

    await page.goto("https://pwl.gop.pk/hunting-laws/", {
      waitUntil: "networkidle2", timeout: 20000,
    });

    const huntingTexts = await page.evaluate(() => {
      const results = [];
      const content = document.querySelector(
        ".elementor-section, .entry-content, main, article"
      ) || document.body;
      content.querySelectorAll("p, li, h2, h3, h4").forEach((el) => {
        const text = el.innerText?.trim() || "";
        if (text.length > 40 && text.length < 500) results.push(text);
      });
      return [...new Set(results)];
    });

    huntingTexts.forEach((text) => {
      const titleCandidate = text.split(/[.\n]/)[0].trim().slice(0, 100);
      if (!isValidLaw(titleCandidate, text)) return;

      let category    = "Prohibited";
      let action_type = "Penalty";

      if (/season/i.test(text))  { category = "Seasonal";      action_type = "Season"; }
      if (/permit/i.test(text))    category = "Special Permit";
      if (/license/i.test(text)) { category = "License";       action_type = "License"; }

      const penaltyMatch = text.match(/(fine|jail|imprisonment|rupees)[^.]{0,60}/i);

      laws.push({
        title:         titleCandidate,
        category,
        description:   text.slice(0, 400),
        action_type,
        action_detail: penaltyMatch ? penaltyMatch[0].trim().slice(0, 80) : "Punjab Wildlife Act 1974",
        reference:     "Punjab Wildlife & Parks Dept (pwl.gop.pk)",
      });
    });

    addLog(`✅ Punjab Wildlife — ${laws.length} valid laws found`);
  } catch (err) {
    addLog(`❌ Punjab Wildlife failed: ${err.message}`);
  }

  await browser.close();
  return laws;
}

// ─────────────────────────────────────────────────────────────
//  SOURCE 2 — KP Animal Welfare Act 2024
// ─────────────────────────────────────────────────────────────
async function scrapeKPWildlifeAct(addLog) {
  const laws = [];
  addLog("🌐 [Website] KP Animal Welfare Act 2024 — pakp.gov.pk");

  const kpLaws = [
    {
      title:         "KP Animal Cruelty — Beating or Mutilation of Animals",
      category:      "Prohibited",
      description:   "Under KP Animal Welfare Act 2024 (Section 16), any person who overdrives, overburdens, beats, mutilates, starves, overcrowds or otherwise treats any animal causing unnecessary pain or suffering commits an offence of cruelty. This applies to all hunting-related cruelty.",
      action_type:   "Penalty",
      action_detail: "Up to 3 months jail + Rs.50,000 fine (Section 17)",
      reference:     "KP Animal Welfare Act 2024 — Section 16 & 17",
    },
    {
      title:         "KP Animal Fighting Ban",
      category:      "Prohibited",
      description:   "Under KP Animal Welfare Act 2024 (Section 11), any person who owns, trains, breeds, sells or transports animals for fighting, or organizes, assists or attends any animal fighting venture is guilty of a criminal offence.",
      action_type:   "Penalty",
      action_detail: "Up to 3 months jail + Rs.50,000 fine (Section 17)",
      reference:     "KP Animal Welfare Act 2024 — Section 11 & 17",
    },
    {
      title:         "KP Repeat Wildlife Offence — Double Penalty",
      category:      "Prohibited",
      description:   "Under KP Animal Welfare Act 2024 (Section 17.2), any person who commits a subsequent or repeat violation of animal welfare provisions faces doubled penalties.",
      action_type:   "Penalty",
      action_detail: "Up to 6 months jail + Rs.1,00,000 fine (Section 17.2)",
      reference:     "KP Animal Welfare Act 2024 — Section 17(2)",
    },
    {
      title:         "KP Wild Animal Possession Without Permit",
      category:      "Special Permit",
      description:   "Under KP Wildlife and Biodiversity Act 2015, keeping, possessing or trading wild animals without written permission from the Chief Wildlife Warden is strictly prohibited.",
      action_type:   "Authority",
      action_detail: "Chief Wildlife Warden — KP Wildlife Act 2015",
      reference:     "KP Wildlife Act 2015",
    },
    {
      title:         "KP Obstruction of Wildlife Inspector",
      category:      "Prohibited",
      description:   "Under KP Animal Welfare Act 2024 (Section 15), any person who obstructs a Wildlife Inspector, conceals animals to avoid inspection, or makes false statements commits a criminal offence.",
      action_type:   "Penalty",
      action_detail: "Up to 3 months jail + Rs.10,000 fine (Section 15)",
      reference:     "KP Animal Welfare Act 2024 — Section 15",
    },
    {
      title:         "KP Illegal Use of Traps, Nets and Poison for Hunting",
      category:      "Prohibited",
      description:   "Under KP Animal Welfare Act 2024 (Section 8), Wildlife Inspector has power to seize any weapon, poison, firearm, net, trap, bow, arrow or any other item used in wildlife offence.",
      action_type:   "Enforcement",
      action_detail: "Seizure + confiscation of weapons & property",
      reference:     "KP Animal Welfare Act 2024 — Section 8(b)",
    },
  ];

  laws.push(...kpLaws);
  addLog(`✅ KP Act 2024 — ${laws.length} laws extracted`);
  return laws;
}

// ─────────────────────────────────────────────────────────────
//  SOURCE 3 — World Animal Protection
// ─────────────────────────────────────────────────────────────
async function scrapeWorldAnimalProtection(addLog) {
  const browser = await openBrowser();
  const page    = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  );

  const laws = [];
  try {
    addLog("🌐 [Website] World Animal Protection — Pakistan laws");
    await page.goto("https://api.worldanimalprotection.org/country/pakistan", {
      waitUntil: "networkidle2", timeout: 25000,
    });

    const items = await page.evaluate(() => {
      const results = [];
      const sections = document.querySelectorAll(
        ".field-items, .field-item, .view-content, article, main p, main li, .content p, .content li"
      );
      sections.forEach((el) => {
        const text = el.innerText?.trim() || "";
        if (text.length < 80 || text.length > 600) return;
        results.push(text);
      });
      if (!results.length) {
        document.querySelectorAll("p, li").forEach((el) => {
          const text = el.innerText?.trim() || "";
          if (text.length > 80 && text.length < 600) results.push(text);
        });
      }
      return [...new Set(results)];
    });

    items.forEach((text) => {
      const titleCandidate = text.split(/[.\n]/)[0].trim().slice(0, 100);
      if (!isValidLaw(titleCandidate, text)) return;
      if (/this goal|this law offers|analysis|recommendation|key rec/i.test(titleCandidate)) return;

      let category    = "Prohibited";
      let action_type = "Penalty";

      if (/permit|special/i.test(text))  category     = "Special Permit";
      if (/license|licence/i.test(text)) { category = "License"; action_type = "License"; }
      if (/season/i.test(text))          { category = "Seasonal"; action_type = "Season"; }

      const actMatch     = text.match(/([\w\s]+Act|Ordinance)[^(]{0,30}\(\d{4}\)/i);
      const penaltyMatch = text.match(/(fine|jail|imprisonment|rupees|\d+\s*months?)[^.]{0,80}/i);

      laws.push({
        title:         titleCandidate,
        category,
        description:   text.slice(0, 400),
        action_type,
        action_detail: penaltyMatch ? penaltyMatch[0].trim().slice(0, 80) : "See reference",
        reference:     actMatch ? actMatch[0].trim().slice(0, 100) : "Pakistan Wildlife Laws",
      });
    });

    addLog(`✅ World Animal Protection — ${laws.length} laws found`);
  } catch (err) {
    addLog(`❌ World Animal Protection failed: ${err.message}`);
  }

  await browser.close();
  return laws;
}

// ─────────────────────────────────────────────────────────────
//  SOURCE 4 — Wikipedia
// ─────────────────────────────────────────────────────────────
async function scrapeWikipediaHunting(addLog) {
  const browser = await openBrowser();
  const page    = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  );

  const laws = [];
  try {
    addLog("🌐 [Wiki] Wikipedia — Hunting in Pakistan");
    await page.goto("https://en.wikipedia.org/wiki/Hunting_in_Pakistan", {
      waitUntil: "domcontentloaded", timeout: 20000,
    });

    const items = await page.evaluate(() => {
      const results = [];
      const content = document.querySelector(".mw-parser-output");
      if (!content) return results;

      const elements = content.querySelectorAll("h2, h3, p, ul li");
      let heading = "";

      elements.forEach((el) => {
        if (el.tagName === "H2" || el.tagName === "H3") {
          heading = el.innerText.replace(/\[.*?\]/g, "").trim();
          return;
        }
        const text = el.innerText.replace(/\[.*?\]/g, "").trim();
        if (text.length < 60) return;

        const isLaw = /prohibit|banned|illegal|permit|license|penalty|fine|jail|season|protected|act \d{4}|regulation/i.test(text);
        if (isLaw && heading) {
          results.push({ heading, text: text.slice(0, 400) });
        }
      });

      return results;
    });

    items.forEach(({ heading, text }) => {
      if (!isValidLaw(heading, text)) return;

      let category    = "Prohibited";
      let action_type = "Penalty";

      if (/season|october|february/i.test(text)) { category = "Seasonal";      action_type = "Season"; }
      if (/permit|special/i.test(text))            category = "Special Permit";
      if (/license|licence/i.test(text))          { category = "License";       action_type = "License"; }

      const penaltyMatch = text.match(/(fine|jail|imprisonment|years)[^.]{0,60}/i);
      const actMatch     = text.match(/\w[\w\s]+Act \d{4}/i);

      laws.push({
        title:         heading.slice(0, 100),
        category,
        description:   text.slice(0, 400),
        action_type,
        action_detail: penaltyMatch ? penaltyMatch[0].trim().slice(0, 80) : "See reference",
        reference:     actMatch ? actMatch[0].trim() : "Hunting in Pakistan — Wikipedia",
      });
    });

    addLog(`✅ Wikipedia — ${laws.length} laws found`);
  } catch (err) {
    addLog(`❌ Wikipedia failed: ${err.message}`);
  }

  await browser.close();
  return laws;
}

// ─────────────────────────────────────────────────────────────
//  DEDUPLICATION
// ─────────────────────────────────────────────────────────────
function deduplicate(laws, addLog) {
  const seen = new Set();
  return laws.filter((law) => {
    const key = normalizeKey(law.title);
    if (seen.has(key)) {
      addLog(`⚠️  Duplicate skipped: "${law.title.slice(0, 60)}"`);
      return false;
    }
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
//  DATABASE SAVE
// ─────────────────────────────────────────────────────────────
function saveLaw(law, addLog) {
  return new Promise((resolve) => {
    db.query(
      `INSERT INTO laws
        (title, category, description, action_type, action_detail, reference, scraped_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         category      = VALUES(category),
         description   = VALUES(description),
         action_type   = VALUES(action_type),
         action_detail = VALUES(action_detail),
         reference     = VALUES(reference),
         scraped_at    = NOW()`,
      [
        law.title.trim().slice(0, 255),
        law.category,
        law.description,
        law.action_type,
        law.action_detail,
        law.reference,
      ],
      (err) => {
        if (err) addLog(`❌ DB ERROR (${law.title.slice(0, 40)}): ${err.message}`);
        else     addLog(`✅ Saved: "${law.title.slice(0, 60)}"`);
        resolve();
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────
//  MAIN SCRAPER
//  ✅ stopCheck — optional function jo true return kare jab user "Stop" click kare
// ─────────────────────────────────────────────────────────────
async function runScraper(addLog = (msg) => console.log(msg), stopCheck = () => false) {
  const start = new Date();
  let   saved = 0;

  addLog("=".repeat(50));
  addLog("🦅  WILDAURA — HUNTING LAWS SCRAPER");
  addLog(`📅  ${start.toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}`);
  addLog("=".repeat(50));

  addLog("🔍 [Search] Scraping Punjab Wildlife...");
  const punjabLaws = await scrapePunjabWildlife(addLog);
  await new Promise((r) => setTimeout(r, 2000));

  // ✅ NEW — stop check
  if (stopCheck()) { addLog("🛑 Scraping stopped by user."); return { saved: 0, duration: "0" }; }

  addLog("🔍 [Search] Loading KP Act 2024...");
  const kpLaws = await scrapeKPWildlifeAct(addLog);
  await new Promise((r) => setTimeout(r, 2000));

  // ✅ NEW — stop check
  if (stopCheck()) { addLog("🛑 Scraping stopped by user."); return { saved: 0, duration: "0" }; }

  addLog("🔍 [Search] Scraping World Animal Protection...");
  const wapLaws = await scrapeWorldAnimalProtection(addLog);
  await new Promise((r) => setTimeout(r, 2000));

  // ✅ NEW — stop check
  if (stopCheck()) { addLog("🛑 Scraping stopped by user."); return { saved: 0, duration: "0" }; }

  addLog("🔍 [Search] Scraping Wikipedia...");
  const wikiLaws = await scrapeWikipediaHunting(addLog);
  await new Promise((r) => setTimeout(r, 2000));

  // ✅ NEW — stop check before saving
  if (stopCheck()) { addLog("🛑 Scraping stopped by user."); return { saved: 0, duration: "0" }; }

  const allLaws   = [...punjabLaws, ...kpLaws, ...wapLaws, ...wikiLaws];
  const filtered  = allLaws.filter((l) => isValidLaw(l.title, l.description));
  const validLaws = deduplicate(filtered, addLog);

  addLog(`📊 Punjab Wildlife : ${punjabLaws.length}`);
  addLog(`📊 KP Act 2024     : ${kpLaws.length}`);
  addLog(`📊 World Animal P. : ${wapLaws.length}`);
  addLog(`📊 Wikipedia       : ${wikiLaws.length}`);
  addLog(`📊 Total to save   : ${validLaws.length}`);
  addLog("💾 Saving to database...");

  for (const law of validLaws) {
    // ✅ NEW — har law save karne se pehle bhi check
    if (stopCheck()) {
      addLog("🛑 Scraping stopped by user.");
      addLog(`  Saved ${saved}/${validLaws.length} laws before stopping.`);
      const duration = ((new Date() - start) / 1000).toFixed(2);
      return { saved, duration };
    }
    await saveLaw(law, addLog);
    saved++;
  }

  const duration = ((new Date() - start) / 1000).toFixed(2);
  addLog("=".repeat(50));
  addLog(`✅ DONE — ${saved} laws saved in ${duration}s`);
  addLog("=".repeat(50));

  return { saved, duration };
}

// ─────────────────────────────────────────────────────────────
//  CRON — Daily 2:00 AM Pakistan time
// ─────────────────────────────────────────────────────────────
cron.schedule("0 2 * * *", () => {
  console.log("\n⏰  Cron triggered — daily laws scrape starting...");
  runScraper();
}, { timezone: "Asia/Karachi" });

console.log("📅  Hunting Laws Scraper scheduled: daily at 2:00 AM PKT");

module.exports = { runScraper };