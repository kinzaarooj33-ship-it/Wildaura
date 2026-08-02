// routes/generateschedule.js
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  console.log("📥 REQUEST RECEIVED at /api/generate-schedule");
  console.log("📥 Body:", req.body);

  const { 
    target_species, 
    destination, 
    start_date, 
    end_date, 
    duration_days, 
    group_detail, 
    guider_name, 
    hunter_name 
  } = req.body;

  console.log("✅ Extracted:", { target_species, destination, duration_days });

  if (!target_species || !destination || !start_date || !end_date) {
    console.error("❌ Missing required fields");
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // 🆓 FREE MOCK DATA
  const schedule = {
    daily_plan: Array.from({ length: duration_days || 3 }, (_, i) => ({
      day: i + 1,
      date: new Date(new Date(start_date).getTime() + i * 86400000).toISOString().split('T')[0],
      title: `Day ${i + 1}: ${target_species} Hunt`,
      activities: [
        "05:00 AM - Early morning tracking",
        "08:00 AM - Breakfast at camp",
        "09:30 AM - Move to hunting zone",
        "12:00 PM - Mid-day rest & lunch",
        "03:00 PM - Evening hunt session",
        "07:00 PM - Return to camp & dinner"
      ]
    })),
    best_route: `Route from base to ${destination}: Take N-25 Highway → Chitral Road → ${destination} Base Camp (approx 6 hours drive)`,
    estimated_cost: {
      guider_fee: "PKR 15,000/day",
      accommodation: "PKR 5,000/day",
      transport: "PKR 8,000",
      equipment: "PKR 3,000",
      total: `PKR ${((duration_days || 3) * 20000 + 11000).toLocaleString()}`
    },
    required_items: [
      "Hunting rifle with license",
      "Ammunition (50 rounds)",
      "Binoculars (8x42)",
      "Camouflage clothing",
      "Hiking boots",
      "First aid kit",
      "GPS/Compass",
      "Water purification tablets"
    ]
  };

  console.log("📤 Sending response:", schedule);
  res.json({ success: true, schedule });
});

module.exports = router;