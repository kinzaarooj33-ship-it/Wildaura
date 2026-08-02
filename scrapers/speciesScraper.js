const puppeteer = require("puppeteer-core");
const db = require("../config/db");
const { aiEnrichMissing, hasMissingFields } = require("./speciesAiEnrich"); // ← naya import

const BROWSER_PATH =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const SPECIES_LIST = [
  { name: "Blue Sheep",       wiki: "Bharal",                sci: "Pseudois_nayaur"         },
  { name: "Markhor",          wiki: "Markhor",               sci: "Capra_falconeri"         },
  { name: "Urial",            wiki: "Urial",                 sci: "Ovis_vignei"             },
  { name: "Ibex",             wiki: "Siberian_ibex",         sci: "Capra_sibirica"          },
  { name: "Nilgai",           wiki: "Nilgai",                sci: "Boselaphus_tragocamelus" },
  { name: "Quail",            wiki: "Common_quail",          sci: "Coturnix_coturnix"       },
  { name: "Wild Boar",        wiki: "Wild_boar",             sci: "Sus_scrofa"              },
  { name: "Deer",             wiki: "Chital",                sci: "Axis_axis"               },
  { name: "Snow Leopard",     wiki: "Snow_leopard",          sci: "Panthera_uncia"          },
  { name: "Himalayan Ibex",   wiki: "Siberian_ibex",         sci: "Capra_sibirica"          },
  { name: "Common Quail",     wiki: "Common_quail",          sci: "Coturnix_coturnix"       },
  { name: "Marco Polo Sheep", wiki: "Marco_Polo_sheep",      sci: "Ovis_ammon_polii"        },
  { name: "Musk Deer",        wiki: "Musk_deer",             sci: "Moschus"                 },
  { name: "Houbara Bustard",  wiki: "Houbara_bustard",       sci: "Chlamydotis_undulata"    },
  { name: "Chital Deer",      wiki: "Chital",                sci: "Axis_axis"               },
  { name: "Indian Peafowl",   wiki: "Indian_peafowl",        sci: "Pavo_cristatus"          },
  { name: "Black Bear",       wiki: "Asian_black_bear",      sci: "Ursus_thibetanus"        },
  { name: "Grey Wolf",        wiki: "Wolf",                  sci: "Canis_lupus"             },
];

async function openBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: BROWSER_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

async function scrapeWikipedia(wikiName) {
  const browser = await openBrowser();
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiName.replace(/ /g, "_"))}`;
  console.log(`  Wikipedia URL: ${url}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const data = await page.evaluate(() => {
      const r = { scientific_name: "", subtitle: "", lifespan: "", found_in: "", status: "", average_weight: "", description: "", image: "" };
      document.querySelectorAll(".infobox tr").forEach((row) => {
        const label = row.querySelector("th")?.innerText?.toLowerCase().trim() || "";
        const value = row.querySelector("td")?.innerText?.trim().replace(/\[.*?\]/g, "").replace(/\n/g, ", ").slice(0, 200) || "";
        if (!value) return;
        if (label.includes("lifespan") || label.includes("longevity")) r.lifespan = value;
        if (label.includes("range") || label.includes("distribution")) r.found_in = value;
        if (label.includes("conservation") || label.includes("status") || label.includes("iucn")) r.status = value;
        if (label.includes("weight") || label.includes("mass")) r.average_weight = value.slice(0, 80);
      });
      const binomial = document.querySelector(".binomial") || document.querySelector(".infobox i");
      if (binomial) r.scientific_name = binomial.innerText.trim();
      r.subtitle = document.querySelector(".shortdescription")?.innerText?.trim() || "";
      const img = document.querySelector(".infobox img") || document.querySelector(".infobox-image img");
      if (img) { let src = img.src || img.getAttribute("src") || ""; if (src.startsWith("//")) src = "https:" + src; r.image = src; }
      const paras = document.querySelectorAll(".mw-parser-output > p");
      for (const p of paras) { const text = p.innerText.trim().replace(/\[.*?\]/g, ""); if (text.length > 100) { r.description = text.slice(0, 500); break; } }
      return r;
    });
    await browser.close();
    console.log(`  Wikipedia ✅`);
    return data;
  } catch (err) {
    await browser.close();
    console.log(`  Wikipedia ERROR: ${err.message}`);
    return {};
  }
}

async function scrapeADW(sciName) {
  const browser = await openBrowser();
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  const url = `https://animaldiversity.org/accounts/${sciName}/`;
  console.log(`  ADW URL: ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });
    const data = await page.evaluate(() => {
      const r = { habitat_type: "", climate: "", common_areas: "", animal_type: "", lifespan: "", average_weight: "", status: "" };
      return r;
    });
    await browser.close();
    console.log(`  ADW ✅`);
    return data;
  } catch (err) {
    await browser.close();
    console.log(`  ADW ERROR: ${err.message}`);
    return {};
  }
}

function saveSpecies(m) {
  return new Promise((resolve) => {
    db.query(
      `INSERT INTO species (name, subtitle, description, image, scientific_name, common_name, animal_type, lifespan, found_in, common_areas, habitat_type, climate, status, legal_status, average_weight, scraped_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
       ON DUPLICATE KEY UPDATE
        scraped_at=NOW(), subtitle=VALUES(subtitle), description=VALUES(description), image=VALUES(image),
        scientific_name=VALUES(scientific_name), animal_type=VALUES(animal_type), lifespan=VALUES(lifespan),
        found_in=VALUES(found_in), common_areas=VALUES(common_areas), habitat_type=VALUES(habitat_type),
        climate=VALUES(climate), status=VALUES(status), legal_status=VALUES(legal_status), average_weight=VALUES(average_weight)`,
      [m.name, m.subtitle||"", m.description||"", m.image||"", m.scientific_name||"", m.name,
       m.animal_type||"", m.lifespan||"", m.found_in||"", m.common_areas||"", m.habitat_type||"",
       m.climate||"", m.status||"", m.status||"", m.average_weight||""],
      (err) => { if (err) console.error(`DB ERROR: ${err.message}`); else console.log(`DB SAVE ✅ — ${m.name}`); resolve(); }
    );
  });
}

async function scrapeOne(id, addLog = console.log) {
  const index = id - 1;
  if (index < 0 || index >= SPECIES_LIST.length) { addLog(`❌ Invalid species ID: ${id}`); return; }
  const sp = SPECIES_LIST[index];
  addLog(`▶ Scraping Species: ${sp.name}`);

  const wiki = await scrapeWikipedia(sp.wiki);
  await new Promise((r) => setTimeout(r, 2000));
  const adw = await scrapeADW(sp.sci);

  let merged = {
    name: sp.name,
    subtitle: wiki.subtitle || "",
    description: wiki.description || "",
    image: wiki.image || "",
    scientific_name: wiki.scientific_name || "",
    animal_type: adw.animal_type || "",
    lifespan: adw.lifespan || wiki.lifespan || "",
    found_in: wiki.found_in || adw.common_areas || "",
    common_areas: adw.common_areas || "",
    habitat_type: adw.habitat_type || "",
    climate: adw.climate || "",
    status: wiki.status || adw.status || "",
    average_weight: wiki.average_weight || adw.average_weight || "",
  };

  // ── AI enrichment — jo fields khali hain woh fill karo ────────────────
  if (hasMissingFields(merged)) {
    addLog(`  [AI]   Missing fields detected — AI fill kar raha hai...`);
    merged = await aiEnrichMissing(merged, addLog);
  } else {
    addLog(`  [AI]   Skip — sab fields already filled`);
  }

  await saveSpecies(merged);
  addLog(`✅ ${sp.name} saved`);
}

// ✅ stopCheck — optional function jo true return kare jab user "Stop" click kare
async function scrapeAll(addLog = console.log, stopCheck = () => false) {
  console.log("=".repeat(50));
  console.log("  WILDAURA — ALL SPECIES SCRAPER");
  console.log("=".repeat(50));
  for (let i = 0; i < SPECIES_LIST.length; i++) {
    // ✅ NEW — har species se pehle check karo ke stop hua hai ya nahi
    if (stopCheck()) {
      addLog("🛑 Scraping stopped by user.");
      addLog(`  Processed ${i}/${SPECIES_LIST.length} species before stopping.`);
      return;
    }

    const sp = SPECIES_LIST[i];
    addLog(`[${i + 1}/${SPECIES_LIST.length}] ▶ ${sp.name}`);
    await scrapeOne(i + 1, addLog);

    if (i < SPECIES_LIST.length - 1) {
      // ✅ NEW — pause se pehle bhi check karo, taake pause ke douraan stop ho to fauran ruk jaye
      if (stopCheck()) {
        addLog("🛑 Scraping stopped by user.");
        return;
      }
      addLog("⏳ Waiting 3 sec...");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.log("\nDONE ✅");
}
// Direct run support
if (require.main === module) {
  scrapeAll(console.log)
    .then(() => { console.log("Done!"); process.exit(0); })
    .catch((err) => { console.error(err); process.exit(1); });
}
module.exports = { scrapeAll, scrapeOne };