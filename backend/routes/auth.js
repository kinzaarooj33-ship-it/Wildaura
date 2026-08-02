const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const resetTokens = new Map();

const GOOGLE_CLIENT_ID = "339839379528-eblju42hkjn1r8eaufl4s2jmdmj6uje2.apps.googleusercontent.com";

function decodeGoogleToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    return payload;
  } catch (e) {
    return null;
  }
}

// ========== REGISTER ==========
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = "INSERT INTO authuser (email, password, role) VALUES (?, ?, ?)";
  db.query(sql, [email, hashedPassword, role || "hunter"], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email already registered!" });
      return res.status(500).json({ message: "Database error during registration" });
    }
    res.json({ message: "Registration successful!" });
  });
});

// ========== LOGIN — FIXED ==========
router.post("/login", (req, res) => {
  const { email, password, role } = req.body; // ✅ role bhi lo request se

  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const sql = "SELECT * FROM authuser WHERE email = ?";
  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error during login" });
    if (result.length === 0) return res.status(401).json({ message: "Invalid email or password" });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // ✅ Role mismatch — generic message, koi info leak nahi
    if (role && user.role && user.role !== role) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful!",
      user: { email: user.email, role: user.role || role || "hunter" }
    });
  });
});

// ========== GOOGLE LOGIN — FIXED ==========
router.post("/google-login", async (req, res) => {
  const credential = req.body.credential || req.body.token;
  const requestedRole = req.body.role || "hunter";

  if (!credential) {
    return res.status(400).json({ message: "Google credential token is required" });
  }

  const payload = decodeGoogleToken(credential);
  if (!payload || !payload.email) {
    return res.status(401).json({ message: "Invalid Google token" });
  }
  if (payload.aud !== GOOGLE_CLIENT_ID) {
    return res.status(401).json({ message: "Token audience mismatch" });
  }

  const googleEmail = payload.email;

  const checkSql = "SELECT * FROM authuser WHERE email = ?";
  db.query(checkSql, [googleEmail], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.length > 0) {
      const existingUser = result[0];

      // ✅ Role mismatch — generic message, koi info leak nahi
      if (existingUser.role && existingUser.role !== requestedRole) {
        return res.status(401).json({ message: "Login failed. Please try again." });
      }

      return res.json({
        message: "Login successful!",
        user: { email: existingUser.email, role: existingUser.role || requestedRole }
      });
    }

    // Naya Google user — requested role se register karo
    const randomPassword = "google_" + Math.random().toString(36).substring(2, 15);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const insertSql = "INSERT INTO authuser (email, password, role) VALUES (?, ?, ?)";
    db.query(insertSql, [googleEmail, hashedPassword, requestedRole], (insertErr) => {
      if (insertErr) {
        if (insertErr.code === "ER_DUP_ENTRY") {
          return res.json({ message: "Login successful!", user: { email: googleEmail, role: requestedRole } });
        }
        return res.status(500).json({ message: "Error creating Google user" });
      }
      res.json({ message: "Login successful!", user: { email: googleEmail, role: requestedRole } });
    });
  });
});

// ========== FORGOT PASSWORD ==========
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required!" });
  if (/^\d/.test(email)) return res.status(400).json({ message: "Email cannot start with a number!" });
  if (email.includes("..")) return res.status(400).json({ message: "Email cannot contain consecutive dots!" });
  if (!email.includes("@")) return res.status(400).json({ message: "Email must contain '@' symbol!" });

  const domain = email.split("@")[1];
  if (!domain || !domain.includes(".")) return res.status(400).json({ message: "Valid domain required!" });

  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return res.status(400).json({ message: "Please enter a valid email!" });

  const checkSql = "SELECT * FROM authuser WHERE email = ?";
  db.query(checkSql, [email], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length === 0) return res.status(400).json({ message: "This email is not registered!" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetTokens.set(email, { code, expires: Date.now() + 3600000 });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Wild Aura - Password Reset OTP",
      html: `<h2>Your OTP is: <b>${code}</b></h2><p>Valid for 1 hour.</p>`,
    };

    transporter.sendMail(mailOptions, (mailErr) => {
      if (mailErr) return res.status(500).json({ message: "Email send karne mein error!" });
      res.json({ message: "OTP sent to your email!" });
    });
  });
});

// ========== RESET PASSWORD ==========
router.post("/reset-password", async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) return res.status(400).json({ message: "All fields are required" });

  const stored = resetTokens.get(email);
  if (!stored) return res.status(400).json({ message: "No reset request found" });
  if (stored.code !== token) return res.status(400).json({ message: "Invalid reset code" });
  if (Date.now() > stored.expires) {
    resetTokens.delete(email);
    return res.status(400).json({ message: "Reset code has expired" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const updateSql = "UPDATE authuser SET password = ? WHERE email = ?";
  db.query(updateSql, [hashedPassword, email], (err) => {
    if (err) return res.status(500).json({ message: "Error updating password" });
    resetTokens.delete(email);
    res.json({ message: "Password reset successful!" });
  });
});

// ========== VERIFY OTP ==========
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  const stored = resetTokens.get(email);
  if (!stored) return res.status(400).json({ message: "Please submit a forgot password request first!" });
  if (stored.code !== otp) return res.status(400).json({ message: "Invalid OTP. Please try again!" });
  if (Date.now() > stored.expires) {
    resetTokens.delete(email);
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  res.json({ message: "OTP verified!", token: stored.code });
});

module.exports = router;