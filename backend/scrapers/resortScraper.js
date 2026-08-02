/**
 * WILDAURA — resortScraper.js  (Groq + Tavily Web Search)
 *
 * Strategy:
 *  1. Wikipedia  → description, image, coordinates
 *  2. Tavily Web Search → real-time hotel data
 *  3. Groq AI   → khali fields fill karo
 *  4. DB save   → update/insert
 */

require("dotenv").config();
const axios      = require("axios");
const cheerio    = require("cheerio");
const db         = require("../config/db");
const { tavily } = require("@tavily/core");

const SCRAPER_API_KEY = "f8b6285b523bc938b498db086e7a7d67";
const GROQ_KEY        = process.env.GROQ_API_KEY;
const TAVILY_KEY      = process.env.TAVILY_API_KEY;

if (!GROQ_KEY) {
  console.error("❌ GROQ_API_KEY environment variable not set!");
  // process.exit hata diya — backend band nahi hoga
}
if (!TAVILY_KEY) {
  console.error("❌ TAVILY_API_KEY environment variable not set!");
  // process.exit hata diya — backend band nahi hoga
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── ScraperAPI se HTML fetch ─────────────────────────────
async function fetchHTML(url) {
  try {
    const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl, { timeout: 60000 });
    return res.data;
  } catch (err) {
    console.log(`    FETCH ERROR: ${err.message}`);
    return null;
  }
}

// ── Wikipedia se data ────────────────────────────────────
async function scrapeWiki(wikiSlug) {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSlug)}`;
  console.log(`    [Wiki] ${url}`);
  const html = await fetchHTML(url);
  if (!html) return {};

  const $ = cheerio.load(html);
  const r = { description: "", lat: null, lng: null, image: "" };

  $(".mw-parser-output > p").each((i, el) => {
    const t = $(el).text().replace(/\[.*?\]/g, "").trim();
    if (t.length > 80 && !r.description) r.description = t.slice(0, 800);
  });

  const latEl = $(".latitude").first().text().trim();
  const lngEl = $(".longitude").first().text().trim();
  if (latEl) r.lat = parseFloat(latEl.replace(/[°'"N ]/g, "")) || null;
  if (lngEl) r.lng = parseFloat(lngEl.replace(/[°'"E ]/g, "")) || null;

  const imgEl  = $(".infobox img, .infobox-image img").first();
  const imgSrc = imgEl.attr("src") || "";
  if (imgSrc) r.image = imgSrc.startsWith("//") ? "https:" + imgSrc : imgSrc;

  console.log(`    [Wiki] desc:${r.description ? "✅" : "❌"} img:${r.image ? "✅" : "❌"}`);
  return r;
}

// ── Official website se data scrape karo ─────────────────
async function scrapeOfficialWebsite(url) {
  if (!url || url.includes("tourism.gov.pk")) return {};
  console.log(`    [Website] ${url}`);

  const html = await fetchHTML(url);
  if (!html) return {};

  const $    = cheerio.load(html);
  const text = $("body").text().replace(/\s+/g, " ").slice(0, 3000);

  const phoneRegex = /(\+92|0092|0)[0-9\-\s]{9,14}/g;
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const phones     = text.match(phoneRegex);
  const emails     = text.match(emailRegex);

  return {
    phone:   phones ? phones[0].trim() : null,
    email:   emails ? emails[0].trim() : null,
    rawText: text,
  };
}

// ── Tavily se web search ──────────────────────────────────
async function searchWeb(query) {
  try {
    const client = tavily({ apiKey: TAVILY_KEY });
    const result = await client.search(query, {
      maxResults:  3,
      searchDepth: "basic",
    });
    return result.results
      .map((r) => `${r.title}: ${r.content}`)
      .join("\n")
      .slice(0, 1500);
  } catch (err) {
    console.log(`    [Search] ⚠ ${err.message}`);
    return "";
  }
}

// ── Groq AI + Tavily se khali fields fill karo ───────────
async function fillWithAI(resort, wikiDesc, websiteData, emptyFields) {
  console.log(`    [AI] Researching: ${resort.name}`);
  console.log(`    [AI] Fields to fill: ${emptyFields.join(", ")}`);

  const searchResults = await searchWeb(
    `${resort.name} Pakistan hotel room rates amenities phone`
  );
  console.log(`    [Search] ${searchResults ? "✅ Data mila" : "❌ Kuch nahi mila"}`);

  const prompt = `You are a Pakistan tourism expert. Use the provided data to fill missing hotel fields accurately.

Hotel: "${resort.name}"
Location: ${resort.location}, ${resort.province}, Pakistan
Official Website: ${resort.official_url}
Wikipedia Info: ${wikiDesc || "N/A"}
Website Data: ${websiteData.rawText ? websiteData.rawText.slice(0, 400) : "N/A"}
Web Search Results: ${searchResults || "N/A"}

Fill ONLY these missing fields: ${emptyFields.join(", ")}

Field format rules:
- stars: number only (e.g. 4)
- price_per_night: "PKR 18,000 - 35,000"
- phone: "+92-51-2878000"
- email: "reservations@hotel.com"
- type: "5-Star Luxury Hotel"
- description: 2-3 sentences specific to this hotel
- features: "Marble Lobby | Garden Views | Business Center"
- amenities: "WiFi | Pool | Fitness Center | Restaurant"
- packages: " Corporate Package |family package"
- total_rooms: number only (e.g. 156)
- payment_methods: "Cash | Visa | Mastercard | JazzCash"
- cancellation_policy: "Free cancellation 48 hours prior"

Return ONLY raw JSON with ONLY the requested fields. No markdown, no backticks, no explanation.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:       "llama-3.1-8b-instant",
        messages:    [{ role: "user", content: prompt }],
        max_tokens:  1500,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq API error");

    const raw       = data.choices[0].message.content;
    const jsonMatch = raw.replace(/```json|```/gi, "").trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const aiData = JSON.parse(jsonMatch[0]);
    console.log(`    [AI] ✅ Fields filled: ${Object.keys(aiData).join(", ")}`);
    return aiData;

  } catch (err) {
    console.log(`    [AI] ❌ ${resort.name}: ${err.message}`);
    return {};
  }
}

// ── DB mein existing resort ka data check karo ───────────
function getExistingResort(id) {
  return new Promise((resolve) => {
    if (!id) { resolve(null); return; }
    db.query("SELECT * FROM resorts WHERE id = ?", [id], (err, rows) => {
      resolve(err || !rows.length ? null : rows[0]);
    });
  });
}

// ── Khali fields detect karo ─────────────────────────────
function detectEmptyFields(existing) {
  const allFields = [
    "type", "stars", "price_per_night", "phone", "email",
    "address", "description", "features", "amenities", "packages",
    "total_rooms",
    "payment_methods", "cancellation_policy",
  ];

  if (!existing) return allFields;

  return allFields.filter((f) => {
    const val = existing[f];
    return !val || val.toString().trim() === "" || val.toString().trim() === "null";
  });
}

// ── Sirf khali fields fill karo ──────────────────────────
function mergeData(existing, wikiData, aiData, websiteData, resortConfig) {
  const e = existing || {};

  const pick = (existingVal, ...newVals) => {
    if (existingVal && existingVal.toString().trim() !== "" && existingVal.toString().trim() !== "null") {
      return existingVal;
    }
    for (const val of newVals) {
      if (val && val.toString().trim() !== "") return val;
    }
    return null;
  };

  return {
    image:               pick(e.image,               wikiData.image),
    province:            resortConfig.province,
    location:            resortConfig.location,
    type:                pick(e.type,                aiData.type),
    stars:               pick(e.stars,               aiData.stars),
    price_per_night:     pick(e.price_per_night,     aiData.price_per_night),
    phone:               pick(e.phone,               websiteData.phone,  aiData.phone),
    email:               pick(e.email,               websiteData.email,  aiData.email),
    website:             pick(e.website,             resortConfig.official_url),
    address:             pick(e.address,             aiData.address),
    description:         pick(e.description,         aiData.description, wikiData.description),
    features:            pick(e.features,            aiData.features),
    amenities:           pick(e.amenities,           aiData.amenities),
    packages:            pick(e.packages,            aiData.packages),
    nearby_areas:        pick(e.nearby_areas,        resortConfig.nearby_areas),
    total_rooms:         pick(e.total_rooms,         aiData.total_rooms),
    distance_from_city:  pick(e.distance_from_city,  resortConfig.distance_from_city),
    nearest_airport:     pick(e.nearest_airport,     resortConfig.nearest_airport),
    payment_methods:     pick(e.payment_methods,     aiData.payment_methods),
    cancellation_policy: pick(e.cancellation_policy, aiData.cancellation_policy),
    lat:                 pick(e.lat,                 wikiData.lat),
    lng:                 pick(e.lng,                 wikiData.lng),
  };
}

// ── DB save ──────────────────────────────────────────────
function saveResort(id, name, data) {
  return new Promise((resolve) => {
    if (id) {
      // ── UPDATE ──
      db.query(
        `UPDATE resorts SET
          image=?, province=?, location=?, type=?, stars=?,
          price_per_night=?, phone=?, email=?, website=?, address=?,
          description=?, features=?, amenities=?, packages=?,
          nearby_areas=?, total_rooms=?,
          distance_from_city=?, nearest_airport=?, payment_methods=?,
          cancellation_policy=?, latitude=?, longitude=?, scraped_at=NOW()
         WHERE id=?`,
        [
          data.image,        data.province,      data.location,    data.type,         data.stars,
          data.price_per_night, data.phone,       data.email,       data.website,      data.address,
          data.description,  data.features,      data.amenities,   data.packages,
          data.nearby_areas, data.total_rooms, 
          data.distance_from_city, data.nearest_airport, data.payment_methods,
          data.cancellation_policy, data.lat,    data.lng,
          id,
        ],
        (err) => {
          if (err) console.error(`  ❌ DB UPDATE ERROR: ${err.message}`);
          else     console.log(`  ✅ UPDATED — ${name} (id:${id})`);
          resolve();
        }
      );
    } else {
      // ── INSERT ──
      db.query(
        `INSERT INTO resorts
          (name, image, province, location, type, stars, price_per_night,
           phone, email, website, address, description, features, amenities,
           packages, nearby_areas, total_rooms,
           distance_from_city, nearest_airport, payment_methods,
           cancellation_policy, latitude, longitude, scraped_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
        [
          name,              data.image,         data.province,    data.location,     data.type,
          data.stars,        data.price_per_night, data.phone,     data.email,        data.website,
          data.address,      data.description,   data.features,    data.amenities,    data.packages,
          data.nearby_areas, data.total_rooms,
          data.distance_from_city, data.nearest_airport, data.payment_methods,
          data.cancellation_policy, data.lat,    data.lng,
        ],
        (err) => {
          if (err) console.error(`  ❌ DB INSERT ERROR: ${err.message}`);
          else     console.log(`  ✅ INSERTED — ${name}`);
          resolve();
        }
      );
    }
  });
}

// ── RESORTS LIST ─────────────────────────────────────────
const RESORTS = [
  { id: 1,    name: "Serena Hotel Islamabad",       official_url: "https://www.serenahotels.com/islamabad",                           wiki: "Serena_Hotel_Islamabad",          province: "Punjab",           location: "Islamabad",  nearby_areas: "Margalla Hills Reserve — 8km | Rawal Lake — 5km",                nearest_airport: "Islamabad International Airport — 20km",  distance_from_city: "5km from Blue Area" },
  { id: 2,    name: "Pearl Continental Lahore",     official_url: "https://www.pchotels.com/pearlcontinental/lahore",                 wiki: "Pearl_Continental_Hotel,_Lahore", province: "Punjab",           location: "Lahore",     nearby_areas: "Thal Wildlife Reserve — 3hrs | Lal Suhanra National Park — 5hrs", nearest_airport: "Allama Iqbal International Airport — 25km", distance_from_city: "City center" },
  { id: 3,    name: "Hindukush Heights Hotel",      official_url: "https://www.hindukushheights.com",                                 wiki: "Chitral",                         province: "KPK",              location: "Chitral",    nearby_areas: "Chitral Valley Reserve — 15km | Kalash Valleys — 30km",          nearest_airport: "Chitral Airport — 5km",                   distance_from_city: "2km from Chitral town" },
  { id: 4,    name: "Shangrila Resort Skardu",      official_url: "https://www.shangrilaskardu.com",                                  wiki: "Shangrila_Resort",                province: "Gilgit-Baltistan", location: "Skardu",     nearby_areas: "Khunjerab National Park — 4hrs | Deosai National Park — 2hrs",    nearest_airport: "Skardu Airport — 10km",                   distance_from_city: "8km from Skardu city" },
  { id: 5,    name: "Serena Hotel Quetta",          official_url: "https://www.serenahotels.com/quetta",                              wiki: "Quetta",                          province: "Balochistan",      location: "Quetta",     nearby_areas: "Ziarat Wildlife Reserve — 2hrs | Hingol National Park — 4hrs",    nearest_airport: "Quetta International Airport — 15km",     distance_from_city: "City center" },
  { id: 6,    name: "PTDC Motel Gilgit",            official_url: "https://www.tourism.gov.pk/ptdc_motels.html",                      wiki: "Gilgit",                          province: "Gilgit-Baltistan", location: "Gilgit",     nearby_areas: "Khunjerab National Park — 3hrs | Naltar Valley — 1hr",            nearest_airport: "Gilgit Airport — 5km",                    distance_from_city: "City center" },
  { id: 7,    name: "Swat Serena Hotel",            official_url: "https://www.serenahotels.com/swat",                                wiki: "Swat_District",                   province: "KPK",              location: "Swat",       nearby_areas: "Swat Game Reserve — 20km | Kalam — 80km",                         nearest_airport: "Saidu Sharif Airport — 8km",              distance_from_city: "5km from Mingora" },
  { id: 8,    name: "Marriott Hotel Karachi",       official_url: "https://www.marriott.com/en-us/hotels/kchmc-karachi-marriott-hotel", wiki: "Karachi_Marriott_Hotel",        province: "Sindh",            location: "Karachi",    nearby_areas: "Kirthar National Park — 2hrs | Haleji Lake — 1.5hrs",             nearest_airport: "Jinnah International Airport — 20km",     distance_from_city: "City center" },
  { id: 9,    name: "Hunza Serena Inn",             official_url: "https://www.serenahotels.com/hunza",                               wiki: "Hunza_Valley",                    province: "Gilgit-Baltistan", location: "Hunza",      nearby_areas: "Khunjerab National Park — 2hrs | Attabad Lake — 30min",           nearest_airport: "Gilgit Airport — 2hrs",                   distance_from_city: "Karimabad village center" },
  { id: 10,   name: "Desert Safari Camp Cholistan", official_url: "https://www.tourism.gov.pk",                                       wiki: "Cholistan_Desert",                province: "Punjab",           location: "Bahawalpur", nearby_areas: "Cholistan Desert Reserve — 5km | Derawar Fort — 2km",             nearest_airport: "Bahawalpur Airport — 50km",               distance_from_city: "45km from Bahawalpur city" },
  { id: null, name: "PC Hotel Peshawar",            official_url: "https://www.pchotels.com/pearlcontinental/peshawar",               wiki: "Peshawar",                        province: "KPK",              location: "Peshawar",   nearby_areas: "Khyber Pass — 1hr | Swat Game Reserve — 2hrs",                    nearest_airport: "Bacha Khan International Airport — 15km", distance_from_city: "City center" },
  { id: null, name: "Malam Jabba Hotel",            official_url: "https://www.malamjabba.com",                                       wiki: "Malam_Jabba",                     province: "KPK",              location: "Swat",       nearby_areas: "Swat Game Reserve — 30km | Chitral Valley — 4hrs",                nearest_airport: "Saidu Sharif Airport — 60km",             distance_from_city: "35km from Mingora" },
  { id: null, name: "PC Hotel Rawalpindi",          official_url: "https://www.pchotels.com/pearlcontinental/rawalpindi",             wiki: "Rawalpindi",                      province: "Punjab",           location: "Rawalpindi", nearby_areas: "Margalla Hills — 15km | Thal Wildlife — 3hrs",                     nearest_airport: "Islamabad International Airport — 25km",  distance_from_city: "Saddar area" },
  { id: null, name: "Avari Hotel Lahore",           official_url: "https://www.avari.com/lahore",                                     wiki: "Avari_Hotel",                     province: "Punjab",           location: "Lahore",     nearby_areas: "Lal Suhanra National Park — 5hrs | Cholistan Desert — 6hrs",      nearest_airport: "Allama Iqbal International Airport — 22km", distance_from_city: "Mall Road, City center" },
  { id: null, name: "Eagles Nest Hotel Hunza",      official_url: "https://www.eaglesnesthotel.com",                                  wiki: "Hunza_Valley",                    province: "Gilgit-Baltistan", location: "Hunza",      nearby_areas: "Khunjerab National Park — 2hrs | Passu Cones — 1hr",              nearest_airport: "Gilgit Airport — 2.5hrs",                 distance_from_city: "Duikar, 8km from Karimabad" },
  { id: null, name: "Luxus Hunza Hotel",            official_url: "https://www.luxushunza.com",                                       wiki: "Hunza_Valley",                    province: "Gilgit-Baltistan", location: "Hunza",      nearby_areas: "Khunjerab National Park — 2hrs | Attabad Lake — 45min",           nearest_airport: "Gilgit Airport — 2hrs",                   distance_from_city: "Karimabad, Hunza" },
  { id: null, name: "Skardu Continental Hotel",     official_url: "https://www.skarducontinental.com",                                wiki: "Skardu",                          province: "Gilgit-Baltistan", location: "Skardu",     nearby_areas: "Deosai National Park — 2hrs | Khunjerab National Park — 5hrs",    nearest_airport: "Skardu Airport — 8km",                    distance_from_city: "Skardu city center" },
  { id: null, name: "Nathiagali Mountain Resort",   official_url: "https://www.tourism.gov.pk",                                       wiki: "Nathiagali",                      province: "KPK",              location: "Abbottabad", nearby_areas: "Ayubia National Park — 5km | Thandiani — 20km",                   nearest_airport: "Islamabad International Airport — 80km",  distance_from_city: "60km from Abbottabad" },
  { id: null, name: "Ziarat Residency Hotel",       official_url: "https://www.tourism.gov.pk",                                       wiki: "Ziarat",                          province: "Balochistan",      location: "Ziarat",     nearby_areas: "Ziarat Wildlife Reserve — 5km | Juniper Forest — 2km",            nearest_airport: "Quetta International Airport — 130km",    distance_from_city: "Ziarat town center" },
  { id: null, name: "Mohenjo Daro Resort Larkana",  official_url: "https://www.tourism.gov.pk",                                       wiki: "Mohenjo-daro",                    province: "Sindh",            location: "Larkana",    nearby_areas: "Chotiari Wildlife Sanctuary — 2hrs | Keenjhar Lake — 3hrs",       nearest_airport: "Moenjodaro Airport — 5km",                distance_from_city: "28km from Larkana city" },
];

// ── MAIN scrapeAll ────────────────────────────────────────
// ✅ stopCheck — optional function jo true return kare jab user "Stop" click kare
async function scrapeAll(log = console.log, stopCheck = () => false) {
  log("=".repeat(60));
  log("  WILDAURA — RESORTS SCRAPER (Groq + Tavily)");
  log("  Strategy: Wikipedia → Website → Tavily → Groq AI → DB");
  log("=".repeat(60));

  for (let i = 0; i < RESORTS.length; i++) {
    // ✅ NEW — har resort se pehle check karo ke stop hua hai ya nahi
    if (stopCheck()) {
      log("\n🛑 Scraping stopped by user.");
      log(`  Processed ${i}/${RESORTS.length} resorts before stopping.`);
      return;
    }

    const resort = RESORTS[i];
    log(`\n[${i + 1}/${RESORTS.length}] ▶ ${resort.name}`);
    log("-".repeat(50));

    const wikiData    = await scrapeWiki(resort.wiki);
    await sleep(2000);

    // ✅ NEW — long awaits ke beech bhi check, taake fauran rukk sake
    if (stopCheck()) {
      log("\n🛑 Scraping stopped by user.");
      return;
    }

    const websiteData = await scrapeOfficialWebsite(resort.official_url);
    await sleep(1500);

    const existing    = await getExistingResort(resort.id);
    const emptyFields = detectEmptyFields(existing);
    log(`    Empty fields (${emptyFields.length}): ${emptyFields.join(", ") || "none"}`);

    let aiData = {};
    if (emptyFields.length > 0) {
      aiData = await fillWithAI(resort, wikiData.description, websiteData, emptyFields);
      await sleep(2000);
    } else {
      log(`    [AI] ⏭️ All fields filled — skip`);
    }

    const merged = mergeData(existing, wikiData, aiData, websiteData, resort);
    await saveResort(resort.id, resort.name, merged);

    if (i < RESORTS.length - 1) {
      // ✅ NEW — pause se pehle bhi check karo, taake pause ke douraan stop ho to fauran ruk jaye
      if (stopCheck()) {
        log("\n🛑 Scraping stopped by user.");
        return;
      }
      log(`  ⏳ 4 sec pause...`);
      await sleep(4000);
    }
  }

  log("\n" + "=".repeat(60));
  log(`  ✅ DONE! All ${RESORTS.length} resorts processed`);
  log("=".repeat(60));
  // ❌ process.exit(0) hata diya — backend band nahi hoga
}

// ── Single resort scrape ──────────────────────────────────
async function scrapeOne(id, log = console.log) {
  const resort = RESORTS.find((r) => r.id === id || r.id === parseInt(id));
  if (!resort) { log(`Resort id ${id} not found`); return; }

  log(`\n▶ Scraping single: ${resort.name}`);
  const wikiData    = await scrapeWiki(resort.wiki);
  await sleep(2000);
  const websiteData = await scrapeOfficialWebsite(resort.official_url);
  await sleep(1500);
  const existing    = await getExistingResort(resort.id);
  const emptyFields = detectEmptyFields(existing);
  const aiData      = emptyFields.length > 0
    ? await fillWithAI(resort, wikiData.description, websiteData, emptyFields)
    : {};
  await sleep(1000);
  const merged = mergeData(existing, wikiData, aiData, websiteData, resort);
  await saveResort(resort.id, resort.name, merged);
  log(`✅ Done: ${resort.name}`);
  // ❌ process.exit(0) hata diya — backend band nahi hoga
}

// Direct terminal se run karne ke liye
if (require.main === module) {
  const arg = process.argv[2];
  if (arg) scrapeOne(arg).catch(console.error);
  else     scrapeAll().catch(console.error);
}

module.exports = { scrapeAll, scrapeOne };