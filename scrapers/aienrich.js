// ══════════════════════════════════════════════════════════════════════════
// aiEnrich.js  —  Groq API version (FREE)
// Scraping ke baad jo fields khali reh jayein, AI fill kare
// ══════════════════════════════════════════════════════════════════════════
require('dotenv').config(); // ← pehli line
const AI_FIELDS = [
  "description",
  "animals",
  "season",
  "best_time",
  "weather",
  "rules_allowed",
  "rules_forbidden",
  "rules_warnings",
  "hotels",
  "fees",
  "status",
];

function hasMissingFields(merged) {
  return AI_FIELDS.some(
    (f) => !merged[f] || String(merged[f]).trim() === ""
  );
}

async function aiEnrichMissing(merged, log = console.log) {
  const missing = AI_FIELDS.filter(
    (f) => !merged[f] || String(merged[f]).trim() === ""
  );

  if (missing.length === 0) {
    log(`  [AI]   Skip — sab fields filled: ${merged.name}`);
    return merged;
  }

  log(`  [AI]   Enriching ${merged.name} — missing: ${missing.join(", ")}`);

  const prompt = `You are a Pakistan wildlife, hunting, and tourism expert with deep knowledge of all national parks, game reserves, and wildlife sanctuaries.

Area Details (jo scraping se mila):
- Name: ${merged.name}
- Province: ${merged.province || "unknown"}
- Region: ${merged.region || "unknown"}
- Season (scraped): ${merged.season || "not found"}
- Animals (scraped): ${merged.animals || "not found"}
- Description (scraped): ${merged.description || "not found"}
- Weather (scraped): ${merged.weather || "not found"}
- Hotels (scraped): ${merged.hotels || "not found"}
- Rules Allowed (scraped): ${merged.rules_allowed || "not found"}
- Rules Forbidden (scraped): ${merged.rules_forbidden || "not found"}
- Rules Warnings (scraped): ${merged.rules_warnings || "not found"}
- Fees (scraped): ${merged.fees || "not found"}
- Status (scraped): ${merged.status || "not found"}

Task: Fill ONLY these missing fields accurately: ${missing.join(", ")}

Rules:
- description: 2-3 sentences about this area in English, factual
- animals: comma-separated, Title Case (e.g. "Snow Leopard, Markhor, Ibex")
- season: short string like "October to March" or "Jul-Sep"
- best_time: same format as season
- weather: JSON string like {"Oct":"22C","Nov":"15C","icon":"sunny","note":"Dry mild winters"}
- rules_allowed: what hunting/activities are legally permitted here
- rules_forbidden: what is banned or requires special permit
- rules_warnings: fines, penalties, cautions for visitors
- hotels: nearest hotels with approx distance, pipe-separated
- fees: entry/permit fee like "PKR 25000 per trophy" or "Free entry"
- status: conservation status like "Protected", "National Park", "Game Reserve"

Return ONLY a valid JSON object with ONLY the missing fields listed above.
No explanation, no markdown, no backticks, no extra keys. Just raw JSON.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API error");
    }

    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```json|```/gi, "").trim();
    const aiData = JSON.parse(clean);

    missing.forEach((field) => {
      if (aiData[field] && String(aiData[field]).trim() !== "") {
        merged[field] = aiData[field];
        log(`    ✔ ${field}: filled by AI`);
      }
    });

    return merged;
  } catch (err) {
    log(`  [AI]   ⚠ Error for ${merged.name}: ${err.message}`);
    return merged;
  }
}

module.exports = { aiEnrichMissing, hasMissingFields };