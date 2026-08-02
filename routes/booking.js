const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ─── ADMIN — GET ALL BOOKINGS ─────────────────────────────────────
router.get("/admin/all", async (req, res) => {
  try {
    const [bookings] = await db.promise().query(
      `SELECT * FROM bookings ORDER BY created_at DESC`
    );

    const [counts] = await db.promise().query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status='pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status='accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status='rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status='completed' THEN 1 END) as completed
      FROM bookings
    `);

    res.json({
      success: true,
      bookings,
      summary: counts[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ─── CREATE BOOKING REQUEST ──────────────────────────────────────
router.post("/create", async (req, res) => {
  const {
    hunter_id,
    hunter_name,
    hunter_email,
    hunter_phone,
    guider_id,
    guider_name,
    guider_email,
    schedule_id,
    start_date,
    end_date,
    duration,
    destination,
    species,
    special_requests,
    total_amount,
    hunter_profile_image
  } = req.body;

  if (!hunter_email || !guider_email) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  // ✅ FIX: Ensure hunter_name is not null
  const finalHunterName = hunter_name || hunter_email?.split("@")[0] || "Hunter";

  try {
    const [result] = await db.promise().query(
      `INSERT INTO bookings (
        hunter_id, hunter_name, hunter_email, hunter_phone,
        guider_id, guider_name, guider_email,
        schedule_id, start_date, end_date, duration,
        destination, species, special_requests,
        total_amount, hunter_profile_image,
        status, created_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        'pending', NOW()
      )`,
      [
        hunter_id,
        finalHunterName, // ✅ Use fallback name
        hunter_email,
        hunter_phone,
        guider_id,
        guider_name,
        guider_email,
        schedule_id,
        start_date,
        end_date,
        duration,
        destination,
        species,
        special_requests,
        total_amount,
        hunter_profile_image
      ]
    );

    const bookingId = result.insertId;

    await db.promise().query(
      `INSERT INTO notifications
      (user_email, type, message, is_read, created_at)
      VALUES (?, 'booking', ?, 0, NOW())`,
      [
        guider_email,
        `📅 New booking request from ${finalHunterName} for ${destination}`
      ]
    );

    await db.promise().query(
      `INSERT INTO notifications
      (user_email, type, message, is_read, created_at)
      VALUES (?, 'booking', ?, 0, NOW())`,
      [
        hunter_email,
        `✅ Booking request sent to ${guider_name}. Waiting for response.`
      ]
    );

    res.json({
      success: true,
      message: "Booking request sent!",
      bookingId
    });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ─── GET BOOKINGS FOR GUIDER ──────────────────────────────────────
router.get("/guider/:guider_email", async (req, res) => {
  const { guider_email } = req.params;
  const { status } = req.query;

  let sql = `SELECT * FROM bookings WHERE guider_email = ?`;
  const params = [guider_email];

  if (status && status !== "all") {
    sql += ` AND status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY created_at DESC`;

  try {
    const [bookings] = await db.promise().query(sql, params);

    const [counts] = await db.promise().query(
      `SELECT
        COUNT(CASE WHEN status='pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status='accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status='rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status='completed' THEN 1 END) as completed
       FROM bookings
       WHERE guider_email=?`,
      [guider_email]
    );

    res.json({
      success: true,
      bookings,
      counts:
        counts[0] || {
          pending: 0,
          accepted: 0,
          rejected: 0,
          completed: 0
        }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ─── GET BOOKINGS FOR HUNTER ──────────────────────────────────────
router.get("/hunter/:hunter_email", async (req, res) => {
  const { hunter_email } = req.params;

  try {
    const [bookings] = await db.promise().query(
      `SELECT *
       FROM bookings
       WHERE hunter_email = ?
       ORDER BY created_at DESC`,
      [hunter_email]
    );

    res.json({
      success: true,
      bookings
    });
  } catch (err) {
    console.error("Get hunter bookings error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ─── UPDATE BOOKING STATUS ──────────────────────────────────────
router.patch("/:booking_id/status", async (req, res) => {
  const { booking_id } = req.params;
  const { status, guider_name } = req.body;

  if (
    ![
      "pending",
      "accepted",
      "rejected",
      "completed",
      "cancelled"
    ].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid status"
    });
  }

  try {
    await db.promise().query(
      `UPDATE bookings
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, booking_id]
    );

    const [booking] = await db.promise().query(
      `SELECT * FROM bookings WHERE id = ?`,
      [booking_id]
    );

    if (booking.length > 0) {
      const b = booking[0];

      let hunterMsg = "";
      let guiderMsg = "";

      if (status === "accepted") {
        hunterMsg = `✅ ${guider_name || "Guider"} accepted your booking for ${b.destination}! Please proceed with payment of PKR ${b.total_amount}.`;
      } else if (status === "rejected") {
        hunterMsg = `❌ ${guider_name || "Guider"} rejected your booking for ${b.destination}.`;
      } else if (status === "completed") {
        hunterMsg = `🎉 Your booking with ${guider_name || "Guider"} for ${b.destination} is now COMPLETED!`;
        guiderMsg = `🎉 Booking for ${b.destination} marked as completed.`;
      } else if (status === "cancelled") {
        guiderMsg = `🚫 Hunter cancelled the booking for ${b.destination}.`;
      }

      if (hunterMsg) {
        await db.promise().query(
          `INSERT INTO notifications
          (user_email, type, message, is_read, created_at)
          VALUES (?, 'booking_accepted', ?, 0, NOW())`,
          [b.hunter_email, hunterMsg]
        );
      }

      if (guiderMsg) {
        await db.promise().query(
          `INSERT INTO notifications
          (user_email, type, message, is_read, created_at)
          VALUES (?, 'booking', ?, 0, NOW())`,
          [b.guider_email, guiderMsg]
        );
      }
    }

    res.json({
      success: true,
      message: `Booking ${status}`
    });
  } catch (err) {
    console.error("Update booking error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ─── PAYMENT SUBMIT (Hunter submits payment) ────────────────────
router.post("/payment/submit", async (req, res) => {
  const {
    booking_id,
    hunter_email,
    guider_email,
    amount,
    payment_method,
    sender_name,
    transaction_ref,
    account_no,
    note
  } = req.body;

  if (!booking_id || !hunter_email || !guider_email || !amount) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  try {
    // Check if booking exists and is accepted
    const [bookingCheck] = await db.promise().query(
      `SELECT * FROM bookings WHERE id = ? AND status = 'accepted'`,
      [booking_id]
    );

    if (bookingCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Booking not found or not in accepted status"
      });
    }

    // Update booking with payment info
    await db.promise().query(
      `UPDATE bookings SET
        payment_status = 'payment_pending',
        payment_method = ?,
        sender_name = ?,
        transaction_ref = ?,
        account_no = ?,
        payment_note = ?,
        payment_submitted_at = NOW()
       WHERE id = ?`,
      [payment_method, sender_name, transaction_ref, account_no, note, booking_id]
    );

    // Notify guider
    await db.promise().query(
      `INSERT INTO notifications
      (user_email, type, message, is_read, created_at)
      VALUES (?, 'payment', ?, 0, NOW())`,
      [
        guider_email,
        `💰 Hunter ${hunter_email} has submitted payment for booking #${booking_id}. Please confirm receipt.`
      ]
    );

    // Notify hunter
    await db.promise().query(
      `INSERT INTO notifications
      (user_email, type, message, is_read, created_at)
      VALUES (?, 'payment', ?, 0, NOW())`,
      [
        hunter_email,
        `✅ Payment submitted successfully! Waiting for guider confirmation.`
      ]
    );

    res.json({
      success: true,
      message: "Payment submitted! Waiting for guider confirmation."
    });
  } catch (err) {
    console.error("Payment submit error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ─── PAYMENT CONFIRM (Guider confirms) ──────────────────────────
router.post("/payment/confirm", async (req, res) => {
  const {
    booking_id,
    guider_email,
    guider_name
  } = req.body;

  if (!booking_id || !guider_email) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  try {
    // Check if booking exists
    const [bookingCheck] = await db.promise().query(
      `SELECT * FROM bookings WHERE id = ?`,
      [booking_id]
    );

    if (bookingCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const booking = bookingCheck[0];

    // Update booking to completed
    await db.promise().query(
      `UPDATE bookings SET
        status = 'completed',
        payment_status = 'completed',
        payment_confirmed_at = NOW(),
        completed_at = NOW(),
        updated_at = NOW()
       WHERE id = ?`,
      [booking_id]
    );

    // Notify hunter
    await db.promise().query(
      `INSERT INTO notifications
      (user_email, type, message, is_read, created_at)
      VALUES (?, 'payment', ?, 0, NOW())`,
      [
        booking.hunter_email,
        `🎉 Payment confirmed by ${guider_name || "Guider"}! Your booking is now COMPLETED.`
      ]
    );

    // Notify guider
    await db.promise().query(
      `INSERT INTO notifications
      (user_email, type, message, is_read, created_at)
      VALUES (?, 'payment', ?, 0, NOW())`,
      [
        guider_email,
        `✅ Payment confirmed for booking #${booking_id}. Booking is now COMPLETED.`
      ]
    );

    res.json({
      success: true,
      message: "Payment confirmed! Booking completed."
    });
  } catch (err) {
    console.error("Payment confirm error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ─── GET PAYMENT DETAILS ─────────────────────────────────────────
router.get("/payment/:booking_id", async (req, res) => {
  const { booking_id } = req.params;

  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM bookings WHERE id = ?`,
      [booking_id]
    );

    const booking = rows[0] || null;

    res.json({
      success: true,
      payment: booking
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;