// ══════════════════════════════════════════════════════════════════════════
// weaponAiEnrich.js  —  Groq API version (FREE)
// Weapon scraping ke baad jo fields khali reh jayein, AI fill kare
// ══════════════════════════════════════════════════════════════════════════
require('dotenv').config();

const AI_FIELDS = [
  "short_desc",
  "description",
  "weapon_type",
  "common_use",
  "effective_range",
  "average_weight",
  "caliber_types",
  "firing_mechanism",
  "accuracy_level",
  "noise_level",
  "suitable_for",
  "advantages",
  "safety_guidelines",
  "legal_regulations",
  "additional_info",
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

  const prompt = `You are a hunting weapons expert with knowledge of firearms and hunting equipment used in Pakistan.

Weapon Details (jo scraping se mila):
- Name: ${merged.name}
- Short Desc: ${merged.short_desc || "not found"}
- Description: ${merged.description || "not found"}
- Weapon Type: ${merged.weapon_type || "not found"}
- Common Use: ${merged.common_use || "not found"}
- Effective Range: ${merged.effective_range || "not found"}
- Average Weight: ${merged.average_weight || "not found"}
- Caliber Types: ${merged.caliber_types || "not found"}
- Firing Mechanism: ${merged.firing_mechanism || "not found"}
- Accuracy Level: ${merged.accuracy_level || "not found"}
- Noise Level: ${merged.noise_level || "not found"}
- Suitable For: ${merged.suitable_for || "not found"}
- Advantages: ${merged.advantages || "not found"}
- Safety Guidelines: ${merged.safety_guidelines || "not found"}
- Legal Regulations: ${merged.legal_regulations || "not found"}
- Additional Info: ${merged.additional_info || "not found"}

Task: Fill ONLY these missing fields accurately: ${missing.join(", ")}

Field rules:
- short_desc: one short line describing the weapon
- description: 2-3 factual sentences about this weapon in English
- weapon_type: e.g. "Bolt-action rifle", "Semi-automatic shotgun"
- common_use: e.g. "Big Game Hunting", "Bird Hunting"
- effective_range: e.g. "300-800 meters"
- average_weight: e.g. "3.5-4.5 kg"
- caliber_types: common calibers used, comma-separated
- firing_mechanism: e.g. "Bolt-action", "Pump-action", "Break-action"
- accuracy_level: one of: Low, Medium, High, Very High
- noise_level: e.g. "High (150-165 dB)"
- suitable_for: animals suitable to hunt with this weapon in Pakistan, comma-separated
- advantages: key advantages for hunting, one sentence
- safety_guidelines: key safety rules, one sentence
- legal_regulations: Pakistan specific legal requirements, one sentence
- additional_info: any extra useful info for hunters in Pakistan

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