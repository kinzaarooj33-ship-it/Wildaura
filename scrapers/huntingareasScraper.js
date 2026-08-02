// ══════════════════════════════════════════════════════════════════════════
// huntingAreasScraper.js  (updated — AI inline enrichment added)
// Sirf scrapeAreaObject function badla hai — baaki sab same hai
// ══════════════════════════════════════════════════════════════════════════
const puppeteer = require("puppeteer-core");
const db        = require("../config/db");
const { aiEnrichMissing, hasMissingFields } = require("./aienrich"); // ← naya import

const BROWSER_PATH =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: BROWSER_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

// ── Areas list ─────────────────────────────────────────────────────────────
const AREAS = [
  {
    id: 1,  name: "Margalla Hills",
    wiki: "Margalla_Hills_National_Park", ptdc: "Margalla Hills Islamabad",
    province: "Punjab", region: "Islamabad",
    contact: "Islamabad Wildlife Management Board", contact_phone: "051-9255466",
    permit_required: 1,
    hospitals: "PIMS Hospital Islamabad — 8km — 051-9261170 | Polyclinic Hospital — 051-9205206",
    supplies: "Al-Rahman Trading Store Islamabad — 1.5km — Hunting gear, ammo, first aid. Sarai Kala Market — basic supplies",
  },
  {
    id: 2,  name: "Chitral Valley",
    wiki: "Chitral_District", ptdc: "Chitral Valley KPK tourism",
    province: "KPK", region: "Chitral",
    contact: "KPK Wildlife Dept Chitral Office", contact_phone: "0943-412550",
    permit_required: 1,
    hospitals: "DHQ Hospital Chitral — 15km — 0943-412333 | Hindukush Heights Medical Centre",
    supplies: "Chitral Bazaar — 14km — Hunting supplies, warm clothing, dry rations, rope, fuel canisters",
  },
  {
    id: 3,  name: "Thal Wildlife",
    wiki: "Thal,_Punjab", ptdc: "Thal desert Punjab wildlife",
    province: "Punjab", region: "Bhakkar",
    contact: "Punjab Wildlife Dept Bhakkar Division", contact_phone: "051-9255466",
    permit_required: 1,
    hospitals: "THQ Hospital Bhakkar — 20km — 0459-200017 | DHQ Hospital Mianwali — 50km",
    supplies: "Bhakkar Saddar Market — 18km — Hunting gear, dry food, water storage, fuel",
  },
  {
    id: 4,  name: "Cholistan Desert",
    wiki: "Cholistan_Desert", ptdc: "Cholistan Desert Bahawalpur",
    province: "Punjab", region: "Bahawalpur",
    contact: "Punjab Wildlife Dept Bahawalpur", contact_phone: "062-9255300",
    permit_required: 1,
    hospitals: "Victoria Hospital Bahawalpur — 40km — 062-9255441 | Bahawal Victoria Hospital 062-9255400",
    supplies: "Bahawalpur Sadar Bazaar — 35km — Full supplies, fuel. Fort Abbas Market — 30km — basic",
  },
  {
    id: 5,  name: "Kirthar National Park",
    wiki: "Kirthar_National_Park", ptdc: "Kirthar National Park Sindh",
    province: "Sindh", region: "Jamshoro",
    contact: "Sindh Wildlife Dept Kirthar Range", contact_phone: "021-99211384",
    permit_required: 1,
    hospitals: "Liaquat Medical Centre Jamshoro — 60km — 022-9213023 | Kirthar Rest House first aid",
    supplies: "Sann Town Market — hunting gear, water containers, first aid, fuel. Karachi 2hrs — full supplies",
  },
  {
    id: 6,  name: "Hingol National Park",
    wiki: "Hingol_National_Park", ptdc: "Hingol National Park Balochistan",
    province: "Balochistan", region: "Lasbela",
    contact: "Balochistan Wildlife Dept Hingol Range", contact_phone: "081-9201752",
    permit_required: 1,
    hospitals: "DHQ Hospital Lasbela — 70km — 0853-610040 | Hingol Tourist Camp first aid. Karachi 200km full hospital",
    supplies: "Aghor Village very basic. Hub Chowki 80km — hunting gear, fuel, food. Stock fully before entering",
  },
  {
    id: 7,  name: "Lal Suhanra National Park",
    wiki: "Lal_Suhanra_National_Park", ptdc: "Lal Suhanra National Park Bahawalpur",
    province: "Punjab", region: "Bahawalpur",
    contact: "Punjab Wildlife Dept Lal Suhanra HQ", contact_phone: "062-9255300",
    permit_required: 1,
    hospitals: "Victoria Hospital Bahawalpur — 39km — 062-9255441 | Park dispensary basic first aid",
    supplies: "Park canteen inside — basic food. Bahawalpur Saddar 40km — full supplies, hunting gear, fuel",
  },
  {
    id: 8,  name: "Deosai National Park",
    wiki: "Deosai_National_Park", ptdc: "Deosai National Park Gilgit Baltistan",
    province: "Gilgit-Baltistan", region: "Astore",
    contact: "GB Wildlife Dept Astore Division", contact_phone: "05813-920034",
    permit_required: 1,
    hospitals: "DHQ Hospital Astore — 80km — 05813-440033 | Skardu Hospital — 100km — 05811-920010",
    supplies: "Astore Bazaar 80km — warm clothing, dry food, fuel. Skardu 100km — complete camping gear and medicines",
  },
  {
    id: 9,  name: "Khunjerab National Park",
    wiki: "Khunjerab_National_Park", ptdc: "Khunjerab National Park Hunza",
    province: "Gilgit-Baltistan", region: "Hunza",
    contact: "GB Wildlife Dept Hunza", contact_phone: "05811-920010",
    permit_required: 1,
    hospitals: "DHQ Hospital Gilgit — 120km — 05811-920033 | Hunza Serena Inn medical — 05811-457000",
    supplies: "Karimabad Bazaar — trekking gear, warm clothing, dry rations, fuel. Gilgit 120km — complete hunting supplies",
  },
  {
    id: 10, name: "Machiara National Park",
    wiki: "Machiara_National_Park", ptdc: "Machiara National Park AJK",
    province: "AJK", region: "Muzaffarabad",
    contact: "AJK Wildlife Dept Muzaffarabad", contact_phone: "05822-920100",
    permit_required: 1,
    hospitals: "DHQ Hospital Muzaffarabad — 05822-920055 | Pearl Continental Muzaffarabad — 38km",
    supplies: "Muzaffarabad City Market 40km — hunting gear, first aid, food, fuel. Shounter Valley — basic only",
  },
  {
    id: 11, name: "Ayubia National Park",
    wiki: "Ayubia_National_Park", ptdc: "Ayubia National Park Abbottabad",
    province: "KPK", region: "Abbottabad",
    contact: "KPK Wildlife Dept Abbottabad Division", contact_phone: "0992-920777",
    permit_required: 1,
    hospitals: "Ayub Medical Complex Abbottabad — 19km — 0992-920777 | Abbottabad International Medical 0992-336623",
    supplies: "Abbottabad Sadar Market 19km — hunting gear, first aid, food, fuel. Nathiagali Bazaar 2km — quality supplies",
  },
  {
    id: 12, name: "Swat Game",
    wiki: "Swat_District", ptdc: "Swat valley game reserve KPK",
    province: "KPK", region: "Swat",
    contact: "KPK Wildlife Dept Swat", contact_phone: "0946-710500",
    permit_required: 1,
    hospitals: "Saidu Teaching Hospital Mingora — 30km — 0946-710201 | DHQ Hospital Mingora",
    supplies: "Mingora Bazaar — hunting gear, warm clothing, food, fuel canisters",
  },
  {
    id: 13, name: "Chashma Wildlife",
    wiki: "Chashma_Barrage", ptdc: "Chashma barrage wildlife Punjab",
    province: "Punjab", region: "Mianwali",
    contact: "Punjab Wildlife Dept Mianwali", contact_phone: "0459-200017",
    permit_required: 1,
    hospitals: "DHQ Hospital Mianwali — 45km — 0459-200100 | Civil Hospital Chashma",
    supplies: "Mianwali City 45km — full supplies. Chashma town — basic food and fuel only",
  },
  {
    id: 14, name: "Zhob Wildlife",
    wiki: "Zhob_District", ptdc: "Zhob wildlife Balochistan hunting",
    province: "Balochistan", region: "Zhob",
    contact: "Balochistan Wildlife Dept Zhob", contact_phone: "0832-411033",
    permit_required: 1,
    hospitals: "DHQ Hospital Zhob — 20km — 0832-411022 | District Headquarters Hospital Zhob",
    supplies: "Zhob City Bazaar 20km — basic hunting supplies, food, fuel. Stock up in Quetta for full gear",
  },
  {
    id: 15, name: "Taunsa Wildlife",
    wiki: "Taunsa_Barrage", ptdc: "Taunsa barrage wildlife DG Khan",
    province: "Punjab", region: "DG Khan",
    contact: "Punjab Wildlife Dept DG Khan", contact_phone: "064-9260055",
    permit_required: 1,
    hospitals: "DHQ Hospital DG Khan — 49km — 064-9260033 | Taunsa Civil Hospital",
    supplies: "DG Khan City Market — hunting supplies, fuel, food, first aid. Taunsa town — basic supplies only",
  },
  {
    id: 16, name: "Chotiari Wildlife",
    wiki: "Chotiari_Reservoir", ptdc: "Chotiari reservoir wildlife Sindh",
    province: "Sindh", region: "Sanghar",
    contact: "Sindh Wildlife Dept Sanghar", contact_phone: "0235-870100",
    permit_required: 1,
    hospitals: "THQ Hospital Sanghar — 35km — 0235-870033 | Civil Hospital Nawabshah — 60km",
    supplies: "Sanghar City Market — basic hunting supplies, food, fuel. Nawabshah 60km — full supplies",
  },
  {
    id: 17, name: "Haleji Lake",
    wiki: "Haleji_Lake", ptdc: "Haleji Lake Sindh bird sanctuary",
    province: "Sindh", region: "Thatta",
    contact: "Sindh Wildlife Dept Thatta", contact_phone: "0298-550100",
    permit_required: 1,
    hospitals: "THQ Hospital Thatta — 40km — 0298-550033 | Civil Hospital Jhimpir — 20km",
    supplies: "Thatta City Market 40km — basic supplies, fuel. Karachi 80km — full hunting gear",
  },
  {
    id: 18, name: "Keenjhar Lake",
    wiki: "Keenjhar_Lake", ptdc: "Keenjhar Lake Thatta Sindh",
    province: "Sindh", region: "Thatta",
    contact: "Sindh Wildlife Dept Thatta", contact_phone: "0298-550100",
    permit_required: 1,
    hospitals: "THQ Hospital Thatta — 30km — 0298-550033 | PTDC Rest House first aid. Karachi 100km full hospital",
    supplies: "Thatta Bazaar 30km — basic supplies, food, fuel. Karachi 100km — full hunting gear available",
  },
  {
    id: 19, name: "Dureji Game",
    wiki: "Dera_Ghazi_Khan_District", ptdc: "Dureji game reserve DG Khan Punjab",
    province: "Punjab", region: "DG Khan",
    contact: "Punjab Wildlife Dept DG Khan", contact_phone: "064-9260055",
    permit_required: 1,
    hospitals: "DHQ Hospital DG Khan — 40km — 064-9260033 | Tribal Area Civil Hospital",
    supplies: "DG Khan Saddar Market — hunting gear, first aid, food, fuel. Taunsa Sharif 25km — basic supplies",
  },
  {
    id: 20, name: "Ziarat Wildlife",
    wiki: "Ziarat_District", ptdc: "Ziarat wildlife sanctuary Balochistan",
    province: "Balochistan", region: "Ziarat",
    contact: "Balochistan Wildlife Dept Ziarat", contact_phone: "0382-411022",
    permit_required: 1,
    hospitals: "DHQ Hospital Ziarat — 10km — 0382-411022 | Civil Hospital Ziarat town",
    supplies: "Ziarat Town Bazaar — warm clothing, basic hunting gear, food, fuel. Quetta 130km — full supplies",
  },
];

const WEATHER_DEFAULTS = {
  Punjab:             '{"Oct":"22°C","Nov":"16°C","Dec":"10°C","Jan":"8°C","Feb":"12°C","icon":"☀️","note":"Dry mild winters, clear skies"}',
  KPK:                '{"Sep":"20°C","Oct":"14°C","Nov":"6°C","Dec":"1°C","icon":"🌨️","note":"Cold winters, snowfall possible above 1500m"}',
  Sindh:              '{"Nov":"26°C","Dec":"19°C","Jan":"16°C","Feb":"19°C","icon":"☀️","note":"Dry warm winters, ideal for wildlife viewing"}',
  Balochistan:        '{"Nov":"20°C","Dec":"11°C","Jan":"7°C","Feb":"10°C","icon":"🌬️","note":"Cold dry winters, strong winds in desert areas"}',
  "Gilgit-Baltistan": '{"Jun":"20°C","Jul":"24°C","Aug":"22°C","Sep":"15°C","icon":"❄️","note":"Alpine climate, accessible Jul–Sep only"}',
  AJK:                '{"Oct":"17°C","Nov":"9°C","Dec":"3°C","Jan":"1°C","icon":"🌨️","note":"Cold winters with snowfall above 2000m"}',
};

// ── Scraper helper functions (same as before) ──────────────────────────────

async function scrapeWikipedia(wikiSlug) {
  const browser = await openBrowser();
  const page    = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSlug)}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    const data = await page.evaluate(() => {
      const r = { description: "", image: "", animals: "", season: "", weather: "", status: "" };
      for (const p of document.querySelectorAll(".mw-parser-output > p")) {
        const t = p.innerText.replace(/\[.*?\]/g, "").trim();
        if (t.length > 80) { r.description = t.slice(0, 600); break; }
      }
      document.querySelectorAll(".infobox tr").forEach((row) => {
        const label = (row.querySelector("th")?.innerText || "").toLowerCase().trim();
        const val   = (row.querySelector("td")?.innerText || "").replace(/\[.*?\]/g, "").replace(/\n/g, ", ").trim().slice(0, 300);
        if (!val) return;
        if (/fauna|wildlife|notable.?animal|species/.test(label)) r.animals  = val;
        if (/season|best.?time|visit/.test(label))                 r.season   = val.slice(0, 100);
        if (/climate|weather/.test(label))                         r.weather  = val.slice(0, 200);
        if (/conservation|iucn|status/.test(label))                r.status   = val.slice(0, 100);
      });
      const img = document.querySelector(".infobox img, .infobox-image img");
      if (img) r.image = img.src.startsWith("//") ? "https:" + img.src : img.src;
      if (!r.animals) {
        const keywords = ["snow leopard","markhor","ibex","urial","blue sheep","chinkara","wolf","black bear","brown bear","deer","chital","houbara","partridge","pheasant","falcon","wild boar","crocodile","flamingo","peafowl","marco polo sheep","musk deer","yak","lynx","nilgai","sandgrouse","monal","teal","duck","dolphin","turtle","jackal","fox","mongoose"];
        const body  = document.body.innerText.toLowerCase();
        const found = keywords.filter((k) => body.includes(k));
        if (found.length) r.animals = found.map((k) => k.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")).join(", ").slice(0, 300);
      }
      if (!r.season) {
        const m = document.body.innerText.match(/best\s+(?:time|season|months?)[^.]{0,80}((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[^.]{0,60})/i);
        if (m) r.season = m[1].trim().slice(0, 100);
      }
      if (!r.status) {
        const m = document.body.innerText.match(/(least concern|vulnerable|endangered|critically endangered|near threatened)/i);
        if (m) r.status = m[0].trim();
      }
      return r;
    });
    await browser.close();
    return data;
  } catch (err) {
    await browser.close();
    return {};
  }
}

async function scrapeWWF(areaName) {
  const browser = await openBrowser();
  const page    = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  try {
    await page.goto(`https://www.wwfpak.org/?s=${encodeURIComponent(areaName)}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    const articleUrl = await page.evaluate(() => { const a = document.querySelector("article a, .entry-title a, h2.post-title a"); return a ? a.href : null; });
    if (articleUrl && articleUrl.includes("wwfpak.org")) await page.goto(articleUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    const data = await page.evaluate(() => {
      const r = { status: "", rules_allowed: "", rules_forbidden: "", rules_warnings: "" };
      const body = document.body.innerText;
      const sm = body.match(/(least concern|vulnerable|endangered|critically endangered|near threatened)/i);
      if (sm) r.status = sm[1].trim();
      const allowed = [], forbidden = [], warnings = [];
      document.querySelectorAll("p, li").forEach((el) => {
        const t = el.innerText.replace(/\[.*?\]/g, "").trim();
        if (t.length < 30 || t.length > 400) return;
        const tl = t.toLowerCase();
        if (/\b(allow|permit|trophy|legal hunt|licensed|quota)\b/.test(tl)) allowed.push(t);
        if (/\b(prohibit|forbid|illegal|banned|not allow|no hunt)\b/.test(tl)) forbidden.push(t);
        if (/\b(fine|penalty|arrest|confiscat|warning|caution|danger)\b/.test(tl)) warnings.push(t);
      });
      if (allowed.length)   r.rules_allowed   = allowed.slice(0, 2).join(" | ").slice(0, 400);
      if (forbidden.length) r.rules_forbidden  = forbidden.slice(0, 2).join(" | ").slice(0, 400);
      if (warnings.length)  r.rules_warnings   = warnings.slice(0, 2).join(" | ").slice(0, 400);
      return r;
    });
    await browser.close();
    return data;
  } catch (err) {
    await browser.close();
    return {};
  }
}

async function scrapePTDC(areaName, ptdcKeyword) {
  const browser = await openBrowser();
  const page    = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  const r = { hotels: "", best_time: "", fees: "" };
  try {
    await page.goto(`https://www.tourism.gov.pk/?s=${encodeURIComponent(areaName)}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    const t1 = await page.evaluate(() => {
      const r = { hotels: "", best_time: "", fees: "" };
      const body = document.body.innerText;
      const hotelMatches = [];
      document.querySelectorAll("p, li, td, h3, h4").forEach((el) => {
        const t = el.innerText.trim();
        if (/\b(hotel|inn|lodge|resort|rest house|motel|guest house)\b/i.test(t) && t.length > 8 && t.length < 200) hotelMatches.push(t.slice(0, 100));
      });
      if (hotelMatches.length) r.hotels = hotelMatches.slice(0, 3).join(" | ");
      const bm = body.match(/best\s+(?:time|season)[^.]{0,80}((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[^.]{0,60})/i);
      if (bm) r.best_time = bm[1].trim().slice(0, 100);
      const fm = body.match(/(?:entry\s+fee|admission|fee)[^.]{0,30}(PKR|Rs\.?)\s*[\d,]+/i);
      if (fm) r.fees = fm[0].trim().slice(0, 100);
      return r;
    });
    if (t1.hotels)    r.hotels    = t1.hotels;
    if (t1.best_time) r.best_time = t1.best_time;
    if (t1.fees)      r.fees      = t1.fees;
    if (!r.hotels) {
      await sleep(1500);
      await page.goto(`https://www.ptdc.org.pk/search?q=${encodeURIComponent(ptdcKeyword)}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      const t2 = await page.evaluate(() => {
        const matches = [];
        document.querySelectorAll("p, li, h3, h4").forEach((el) => {
          const t = el.innerText.trim();
          if (/\b(hotel|inn|lodge|resort|rest house|motel)\b/i.test(t) && t.length > 8 && t.length < 200) matches.push(t.slice(0, 100));
        });
        return matches.slice(0, 3).join(" | ");
      });
      if (t2) r.hotels = t2;
    }
    await browser.close();
    return r;
  } catch (err) {
    await browser.close();
    return r;
  }
}

function saveArea(m) {
  return new Promise((resolve) => {
    db.query(
      `UPDATE hunting_areas SET
        image=?, province=?, region=?, season=?, status=?, description=?,
        animals=?, fees=?, permit_required=?, best_time=?, contact=?,
        contact_phone=?, weather=?, rules_allowed=?, rules_forbidden=?,
        rules_warnings=?, hospitals=?, hotels=?, supplies=?, scraped_at=NOW()
       WHERE id=?`,
      [
        m.image||null, m.province, m.region, m.season||null, m.status||null,
        m.description||null, m.animals||null, m.fees||null, m.permit_required,
        m.best_time||null, m.contact||null, m.contact_phone||null, m.weather,
        m.rules_allowed||null, m.rules_forbidden||null, m.rules_warnings||null,
        m.hospitals||null, m.hotels||null, m.supplies||null, m.id,
      ],
      (err) => { if (err) console.error(`DB ERROR: ${err.message}`); resolve(); }
    );
  });
}

// ══════════════════════════════════════════════════════════════════════════
// CORE FUNCTION — scrapeAreaObject (AI enrichment added)
// ══════════════════════════════════════════════════════════════════════════
async function scrapeAreaObject(area, log) {
  // ── Step 1: Wikipedia ─────────────────────────────────────────────────
  log(`  [Wiki] Scraping ${area.name}...`);
  const wiki = await scrapeWikipedia(area.wiki);
  await sleep(2000);

  // ── Step 2: WWF ───────────────────────────────────────────────────────
  log(`  [WWF]  Scraping ${area.name}...`);
  const wwf  = await scrapeWWF(area.name);
  await sleep(2000);

  // ── Step 3: PTDC ──────────────────────────────────────────────────────
  log(`  [PTDC] Scraping ${area.name}...`);
  const ptdc = await scrapePTDC(area.name, area.ptdc);
  await sleep(2000);

  // ── Step 4: Weather default laga do ───────────────────────────────────
  let weather = "";
  if (wiki.weather && wiki.weather.length > 30) {
    weather = wiki.weather.slice(0, 300);
  } else {
    weather = WEATHER_DEFAULTS[area.province] || '{"note":"Check local forecast before visit"}';
  }

  // ── Step 5: Sab merge karo ────────────────────────────────────────────
  let merged = {
    id:              area.id,
    name:            area.name,
    image:           wiki.image                    || null,
    province:        area.province,
    region:          area.region,
    season:          wiki.season  || ptdc.best_time || null,
    status:          wiki.status  || wwf.status     || null,
    description:     wiki.description              || null,
    animals:         wiki.animals                  || null,
    fees:            ptdc.fees                     || null,
    permit_required: area.permit_required,
    best_time:       ptdc.best_time || wiki.season  || null,
    contact:         area.contact,
    contact_phone:   area.contact_phone,
    weather,
    rules_allowed:   wwf.rules_allowed             || null,
    rules_forbidden: wwf.rules_forbidden            || null,
    rules_warnings:  wwf.rules_warnings             || null,
    hospitals:       area.hospitals,
    hotels:          ptdc.hotels                   || null,
    supplies:        area.supplies,
  };

  // ── Step 6: ⭐ AI enrichment — jo fields khali hain woh fill karo ────
  if (hasMissingFields(merged)) {
    log(`  [AI]   Missing fields detected — AI is filling missing fields...`);
    merged = await aiEnrichMissing(merged, log);
  } else {
    log(`  [AI]   Skip — all key fields already filled.`);
  }

  // ── Step 7: DB mein save karo ─────────────────────────────────────────
  await saveArea(merged);
  log(`  ✅ Saved: ${area.name}`);
}

// ══════════════════════════════════════════════════════════════════════════
// EXPORT 1 — scrapeAll(log, stopCheck)
// ✅ stopCheck — optional function jo true return kare jab user "Stop" click kare
// ══════════════════════════════════════════════════════════════════════════
async function scrapeAll(log = console.log, stopCheck = () => false) {
  log(`🚀 Scraping started — ${AREAS.length} areas`);
  for (let i = 0; i < AREAS.length; i++) {
    // ✅ NEW — har area se pehle check karo ke stop hua hai ya nahi
    if (stopCheck()) {
      log(`\n🛑 Scraping stopped by user.`);
      log(`  Processed ${i}/${AREAS.length} areas before stopping.`);
      return;
    }

    log(`\n[${i + 1}/${AREAS.length}] ▶ ${AREAS[i].name}`);
    await scrapeAreaObject(AREAS[i], log);

    if (i < AREAS.length - 1) {
      // ✅ NEW — pause se pehle bhi check karo, taake pause ke douraan stop ho to fauran ruk jaye
      if (stopCheck()) {
        log(`\n🛑 Scraping stopped by user.`);
        return;
      }
      log("  ⏳ 3 sec...");
      await sleep(3000);
    }
  }
  log(`\n✅ All ${AREAS.length} areas completed!`);
}

// ══════════════════════════════════════════════════════════════════════════
// EXPORT 2 — scrapeOne(id, log)
// ══════════════════════════════════════════════════════════════════════════
async function scrapeOne(id, log = console.log) {
  const area = AREAS.find((a) => a.id === id);
  if (!area) throw new Error(`Area ID ${id} AREAS list mein nahi mila.`);
  log(`🚀 Single scrape: ${area.name} (id:${id})`);
  await scrapeAreaObject(area, log);
  return area.name;
}

module.exports = { scrapeAll, scrapeOne };

// ── Direct run: node scrapers/huntingAreasScraper.js ─────────────────────
if (require.main === module) {
  scrapeAll(console.log)
    .then(() => { console.log("Done!"); process.exit(0); })
    .catch((err) => { console.error(err); process.exit(1); });
}