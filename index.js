require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes          = require("./routes/auth");
const profileRoutes       = require("./routes/profile");
const wildlifeRoutes      = require("./routes/wildlife");
const adminRoutes         = require("./routes/admin");
const bookingRoutes       = require("./routes/booking");
const guideRoutes         = require("./routes/guide");
const feedbackRoutes      = require("./routes/feedback");
const guiderExtraRoutes   = require('./guider-extra-routes');
const tripScheduleRoutes  = require('./routes/tripschedule');
const generateScheduleRoute = require('./routes/generateschedule');
const emergencyRoutes     = require("./routes/emergency");
const notificationRoutes  = require("./routes/notifications");
const resortRoutes        = require("./routes/resorts");  // ✅ ADD
const successRoutes       = require("./routes/stories");
const scrapeRoutes        = require("./routes/scrapeRoute"); // ✅ ADD — scraper endpoints
const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith("http://localhost")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIX: absolute path use kiya (path.join) taake uploads folder
// kisi bhi directory se "node server.js" chalane par sahi serve ho.
// Pehle "uploads" (relative) tha jo sirf tabhi kaam karta jab process
// usi exact folder se start ho jaha "uploads/" subfolder ho.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== ROUTES ==========
app.use("/", authRoutes);
app.use("/api", authRoutes);
app.use("/", profileRoutes);
app.use("/api", wildlifeRoutes);
app.use("/api", guideRoutes);
app.use("/api", feedbackRoutes);
app.use("/api/booking", bookingRoutes);   // ✅ "bookings" ki jagah "booking" (singular)
app.use("/api/admin", adminRoutes);
app.use("/api/admin/scrape", scrapeRoutes); // ✅ ADD — must come after adminRoutes mount, separate prefix avoids clashing with adminRoutes' own routes
app.use(guiderExtraRoutes);
app.use('/api/trip-schedules', tripScheduleRoutes);
app.use('/api/generate-schedule', generateScheduleRoute);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/resorts", resortRoutes);  // ✅ ADD
app.use("/api/success-stories", successRoutes);  // ✅ ADD
app.get("/test", (req, res) => {
  res.json({ message: "Server is working! ✅" });
});

app.get("/", (req, res) => res.send("Backend running 🚀"));

app.listen(3000, () => {
  console.log("✅ Server running on port 3000");
  console.log(`✅ Serving uploads from: ${path.join(__dirname, "uploads")}`);
});