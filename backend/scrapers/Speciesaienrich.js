// ══════════════════════════════════════════════════════════════════════════
// speciesAiEnrich.js  —  Groq API version (FREE)
// Species scraping ke baad jo fields khali reh jayein, AI fill kare
// ══════════════════════════════════════════════════════════════════════════
require('dotenv').config();

const AI_FIELDS = [
  "subtitle",
  "description",
  "animal_type",
  "lifespan",
  "found_in",
  "common_areas",
  "habitat_type",
  "climate",
  "status",
  "average_weight",
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

  const prompt = `You are a wildlife expert specializing in animals found in Pakistan and South/Central Asia.

Species Details (jo scraping se mila):
- Name: ${merged.name}
- Scientific Name: ${merged.scientific_name || "unknown"}
- Subtitle: ${merged.subtitle || "not found"}
- Description: ${merged.description || "not found"}
- Animal Type: ${merged.animal_type || "not found"}
- Lifespan: ${merged.lifespan || "not found"}
- Found In: ${merged.found_in || "not found"}
- Common Areas: ${merged.common_areas || "not found"}
- Habitat Type: ${merged.habitat_type || "not found"}
- Climate: ${merged.climate || "not found"}
- Status: ${merged.status || "not found"}
- Average Weight: ${merged.average_weight || "not found"}

Task: Fill ONLY these missing fields accurately: ${missing.join(", ")}

Field rules:
- subtitle: one short line describing the animal (e.g. "A large wild goat native to mountainous regions")
- description: 2-3 factual sentences about this animal in English
- animal_type: one of: Mammal, Bird, Reptile, Fish, Amphibian
- lifespan: e.g. "10-15 years in wild"
- found_in: countries/regions where found, comma-separated
- common_areas: specific areas in Pakistan where found, comma-separated
- habitat_type: e.g. "Alpine meadows, Rocky mountains"
- climate: e.g. "Cold alpine, Temperate"
- status: IUCN status e.g. "Least Concern", "Vulnerable", "Endangered", "Near Threatened"
- average_weight: e.g. "40-75 kg"

Return ONLY a valid JSON object with ONLY the missing fields listed above.
No explanation, no markdown, no backticks. Just raw JSON.`;

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