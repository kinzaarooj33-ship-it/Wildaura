import React, { useState, useEffect } from "react";
import axios from "axios";
import TripScheduleModal from "./TripScheduleModal"; // schedule form modal
import "./tripscheduleview.css";


function TripScheduleView({ onClose, initialTab = "bookings" }) {
  const [bookings, setBookings]     = useState([]);
  const [schedules, setSchedules]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [activeTab, setActiveTab]   = useState(initialTab);
  const [popup, setPopup]           = useState(null);
  const [showPaymentModal, setShowPaymentModal]   = useState(false);
  const [selectedBooking, setSelectedBooking]     = useState(null);
  const [selectedSchedule, setSelectedSchedule]  = useState(null); // for schedule detail view
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);
  const [showTripModal, setShowTripModal]         = useState(false); // TripScheduleModal toggle
  const [paymentData, setPaymentData] = useState({
    payment_method: "JazzCash",
    sender_name: "",
    transaction_ref: "",
    account_no: "",
  });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { fetchBookings(); fetchSchedules(); }, []);

  // ── fetch bookings ──────────────────────────────────────────────
  const fetchBookings = async () => {
    setLoading(true);
    try {
      if (!currentUser.email) return;
      const res = await axios.get(`http://localhost:3000/api/booking/hunter/${currentUser.email}`);
      if (res.data.success) setBookings(res.data.bookings || []);
      else setBookings([]);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  };

  // ── fetch schedules ─────────────────────────────────────────────
  const fetchSchedules = async () => {
    try {
      if (!currentUser.email) return;
      const res = await axios.get(`http://localhost:3000/api/trip-schedules/hunter/${currentUser.email}`);
      if (res.data?.schedules) setSchedules(res.data.schedules);
      else setSchedules([]);
    } catch { setSchedules([]); }
  };

  // ── payment modal ───────────────────────────────────────────────
  const openPaymentModal = (booking) => {
    setSelectedBooking(booking);
    setPaymentData({ payment_method: "JazzCash", sender_name: "", transaction_ref: "", account_no: "" });
    setShowPaymentModal(true);
  };

  const [paymentErrors, setPaymentErrors] = useState({});

  const handlePaymentSubmit = async () => {
    const errors = {};
    if (!paymentData.sender_name.trim())    errors.sender_name = "Sender name is required";
    if (!paymentData.transaction_ref.trim()) errors.transaction_ref = "Transaction reference is required";
    if (Object.keys(errors).length > 0) { setPaymentErrors(errors); return; }
    setPaymentErrors({});
    setLoading(true);
    try {
      await axios.post("http://localhost:3000/api/booking/payment/submit", {
        booking_id: selectedBooking.id,
        hunter_email: currentUser.email,
        payment_method: paymentData.payment_method,
        sender_name: paymentData.sender_name,
        transaction_ref: paymentData.transaction_ref,
        account_no: paymentData.account_no,
      });
      setShowPaymentModal(false);
      setPopup({ type: "success", title: "Payment Submitted!", message: "Your payment details have been sent to the guider for confirmation." });
      await fetchBookings();
    } catch (err) {
      setPopup({ type: "error", title: "Error", message: err.response?.data?.message || "Could not submit payment. Try again." });
    } finally { setLoading(false); }
  };

  // ── helpers ─────────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  };

  const getStatusLabel = (s) =>
    ({ pending: "⏳ Pending", accepted: "✅ Accepted", rejected: "❌ Rejected", completed: "🎉 Completed" }[s] || s);

  // ── parse schedule data safely ──────────────────────────────────
  const parseScheduleData = (raw) => {
    try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
    catch { return null; }
  };

  // ── open schedule detail ────────────────────────────────────────
  const openScheduleDetail = (sch) => {
    setSelectedSchedule(sch);
    setShowScheduleDetail(true);
  };

  return (
    <div className="tsv-overlay">
      <div className="tsv-modal">

        {/* ── HEADER ────────────────────────────── */}
        <div className="tsv-header">
          <h3 className="tsv-header-title">📅 My Hunting Trips</h3>
          <button className="tsv-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── TABS ──────────────────────────────── */}
        <div className="tsv-tabs">
          <button
            className={`tsv-tab ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            📋 My Bookings
          </button>
          <button
            className={`tsv-tab ${activeTab === "schedules" ? "active" : ""}`}
            onClick={() => setActiveTab("schedules")}
          >
            🗓️ My Schedules
          </button>
          <button
            className={`tsv-tab ${activeTab === "make" ? "active" : ""}`}
            onClick={() => setActiveTab("make")}
          >
            ✨ Make Schedule
          </button>
        </div>

        <div className="tsv-body">

          {/* ── POPUP ─────────────────────────────── */}
          {popup && (
            <div className="tsv-popup-overlay">
              <div className="tsv-popup-box">
                <div className="tsv-popup-icon">{popup.type === "success" ? "✅" : "❌"}</div>
                <h4 className={`tsv-popup-title ${popup.type}`}>{popup.title}</h4>
                <p className="tsv-popup-msg">{popup.message}</p>
                <button className="tsv-popup-btn" onClick={() => setPopup(null)}>OK</button>
              </div>
            </div>
          )}

          {/* ── PAYMENT MODAL ─────────────────────── */}
          {showPaymentModal && selectedBooking && (
            <div className="pay-overlay" onClick={() => setShowPaymentModal(false)}>
              <div className="pay-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="pay-modal-header">
                  <div className="pay-modal-icon">💳</div>
                  <h3 className="pay-modal-title">Submit Payment</h3>
                  <button className="pay-modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
                </div>

                {/* Amount banner */}
                <div className="pay-amount-banner">
                  <span className="pay-amount-label">Total Amount</span>
                  <span className="pay-amount-value">PKR {selectedBooking.total_amount?.toLocaleString()}</span>
                  <span className="pay-amount-to">to <strong>{selectedBooking.guider_name}</strong></span>
                </div>

                <div className="pay-modal-body">

                  {/* Payment Method */}
                  <div className="pay-field">
                    <label className="pay-label">Payment Method</label>
                    <div className="pay-method-row">
                      {["JazzCash", "EasyPaisa", "Bank Transfer", "Cash"].map(m => (
                        <button
                          key={m}
                          className={`pay-method-chip ${paymentData.payment_method === m ? "active" : ""}`}
                          onClick={() => setPaymentData({ ...paymentData, payment_method: m })}
                        >
                          {m === "JazzCash" ? "🟠" : m === "EasyPaisa" ? "🟢" : m === "Bank Transfer" ? "🏦" : "💵"} {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sender Name */}
                  <div className="pay-field">
                    <label className="pay-label">Sender Name <span className="pay-req">*</span></label>
                    <input
                      className={`pay-input ${paymentErrors.sender_name ? "error" : ""}`}
                      placeholder="Your name on account"
                      value={paymentData.sender_name}
                      onChange={e => {
                        setPaymentData({ ...paymentData, sender_name: e.target.value });
                        if (paymentErrors.sender_name) setPaymentErrors({ ...paymentErrors, sender_name: "" });
                      }}
                    />
                    {paymentErrors.sender_name && (
                      <span className="pay-error-msg">⚠ {paymentErrors.sender_name}</span>
                    )}
                  </div>

                  {/* Transaction Ref */}
                  <div className="pay-field">
                    <label className="pay-label">Transaction Reference / TID <span className="pay-req">*</span></label>
                    <input
                      className={`pay-input ${paymentErrors.transaction_ref ? "error" : ""}`}
                      placeholder="e.g. TXN123456789"
                      value={paymentData.transaction_ref}
                      onChange={e => {
                        setPaymentData({ ...paymentData, transaction_ref: e.target.value });
                        if (paymentErrors.transaction_ref) setPaymentErrors({ ...paymentErrors, transaction_ref: "" });
                      }}
                    />
                    {paymentErrors.transaction_ref && (
                      <span className="pay-error-msg">⚠ {paymentErrors.transaction_ref}</span>
                    )}
                  </div>

                  {/* Account Number (optional) */}
                  <div className="pay-field">
                    <label className="pay-label">Account / Mobile Number <span className="pay-optional">(Optional)</span></label>
                    <input
                      className="pay-input"
                      placeholder="e.g. 03001234567"
                      value={paymentData.account_no}
                      onChange={e => setPaymentData({ ...paymentData, account_no: e.target.value })}
                    />
                  </div>

                </div>

                {/* Footer */}
                <div className="pay-modal-footer">
                  <button className="pay-cancel-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button className="pay-submit-btn" onClick={handlePaymentSubmit} disabled={loading}>
                    {loading ? <span className="pay-spinner"></span> : "💳"} {loading ? "Submitting..." : "Submit Payment"}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              TAB 1 — MY BOOKINGS
          ════════════════════════════════════════ */}
          {activeTab === "bookings" && (
            <div>
              {loading ? (
                <div className="tsv-spinner-wrap">
                  <div className="tsv-spinner"></div>
                  <p style={{ color: "#888", marginTop: 12 }}>Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="tsv-empty">
                  <div className="tsv-empty-icon">📭</div>
                  <h4>No Bookings Yet</h4>
                  <p>First create a schedule, then send a booking request to a guider.</p>
                  <button className="tsv-send-btn full" onClick={() => setActiveTab("make")}>
                    ✨ Make Schedule
                  </button>
                </div>
              ) : (
                bookings.map((booking) => {
                  const isAccepted  = booking.status === "accepted";
                  const paymentDone = booking.payment_status === "payment_pending" || booking.payment_status === "paid";
                  return (
                    <div key={booking.id} className="tsv-card">
                      <div className={`tsv-card-status-bar ${booking.status}`}>
                        <span className={`tsv-status-label ${booking.status}`}>{getStatusLabel(booking.status)}</span>
                        {isAccepted && !paymentDone && <span className="tsv-badge-pay">💳 Payment Required</span>}
                        {paymentDone && <span className="tsv-badge-paid">✅ Payment Submitted</span>}
                      </div>

                      <div className="tsv-card-body">
                        <div className="tsv-card-grid">
                          <div className="tsv-card-item">
                            <span className="tsv-card-label">👤 Guider</span>
                            <span className="tsv-card-value">{booking.guider_name}</span>
                          </div>
                          <div className="tsv-card-item">
                            <span className="tsv-card-label">📍 Destination</span>
                            <span className="tsv-card-value">{booking.destination}</span>
                          </div>
                          <div className="tsv-card-item">
                            <span className="tsv-card-label">📅 Start Date</span>
                            <span className="tsv-card-value">{formatDate(booking.start_date)}</span>
                          </div>
                          <div className="tsv-card-item">
                            <span className="tsv-card-label">📅 End Date</span>
                            <span className="tsv-card-value">{formatDate(booking.end_date)}</span>
                          </div>
                          <div className="tsv-card-item">
                            <span className="tsv-card-label">⏱️ Duration</span>
                            <span className="tsv-card-value">{booking.duration} days</span>
                          </div>
                          <div className="tsv-card-item">
                            <span className="tsv-card-label">💰 Amount</span>
                            <span className="tsv-card-value amount">PKR {booking.total_amount?.toLocaleString()}</span>
                          </div>
                          {booking.species && (
                            <div className="tsv-card-item">
                              <span className="tsv-card-label">🎯 Species</span>
                              <span className="tsv-card-value">{booking.species}</span>
                            </div>
                          )}
                        </div>

                        {booking.special_requests && (
                          <div className="tsv-message-box">
                            <strong>💬 Message:</strong> {booking.special_requests}
                          </div>
                        )}

                        {isAccepted && !paymentDone && (
                          <button className="tsv-pay-btn" onClick={() => openPaymentModal(booking)}>
                            💳 Pay Now — PKR {booking.total_amount?.toLocaleString()}
                          </button>
                        )}

                        {booking.payment_status === "payment_pending" && (
                          <div className="tsv-payment-info">
                            <strong>💳 Payment submitted via {booking.payment_method}</strong>
                            <span>Waiting for guider confirmation...</span>
                          </div>
                        )}

                        {booking.status === "completed" && (
                          <div className="tsv-payment-info completed">
                            🎉 Trip completed successfully!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ════════════════════════════════════════
              TAB 2 — MY SCHEDULES
          ════════════════════════════════════════ */}
          {activeTab === "schedules" && (
            <div>
              {schedules.length === 0 ? (
                <div className="tsv-empty">
                  <div className="tsv-empty-icon">🗓️</div>
                  <h4>No Schedules Yet</h4>
                  <p>Create a trip schedule to get started.</p>
                  <button className="tsv-send-btn full" onClick={() => setActiveTab("make")}>
                    ✨ Make Schedule
                  </button>
                </div>
              ) : (
                <div>
                  {schedules.map((sch) => {
                    const parsed = parseScheduleData(sch.schedule_data);
                    return (
                      <div key={sch.id} className="tsv-card">
                        <div className="tsv-card-status-bar accepted">
                          <span className="tsv-status-label accepted">🗓️ Schedule Ready</span>
                          <span style={{ fontSize: 12, color: "#555" }}>
                            {formatDate(sch.created_at)}
                          </span>
                        </div>
                        <div className="tsv-card-body">
                          <div className="tsv-card-grid">
                            <div className="tsv-card-item">
                              <span className="tsv-card-label">👤 Guider</span>
                              <span className="tsv-card-value">{sch.guider_name}</span>
                            </div>
                            <div className="tsv-card-item">
                              <span className="tsv-card-label">📍 Destination</span>
                              <span className="tsv-card-value">{sch.destination}</span>
                            </div>
                            <div className="tsv-card-item">
                              <span className="tsv-card-label">🎯 Species</span>
                              <span className="tsv-card-value">{sch.target_species}</span>
                            </div>
                            <div className="tsv-card-item">
                              <span className="tsv-card-label">📅 Dates</span>
                              <span className="tsv-card-value">
                                {formatDate(sch.start_date)} → {formatDate(sch.end_date)}
                              </span>
                            </div>
                            <div className="tsv-card-item">
                              <span className="tsv-card-label">⏱️ Duration</span>
                              <span className="tsv-card-value">{sch.duration_days} days</span>
                            </div>
                            {parsed?.estimated_cost?.total && (
                              <div className="tsv-card-item">
                                <span className="tsv-card-label">💰 Est. Cost</span>
                                <span className="tsv-card-value amount">{parsed.estimated_cost.total}</span>
                              </div>
                            )}
                          </div>
                          <div className="tsv-sched-actions">
                            <button className="tsv-view-sched-btn" onClick={() => openScheduleDetail(sch)}>
                              👁️ View Full Schedule
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════
              TAB 3 — MAKE SCHEDULE
          ════════════════════════════════════════ */}
          {activeTab === "make" && (
            <div className="tsv-make-schedule-tab">
              <div className="tsv-make-schedule-hero">
                <div className="tsv-make-icon">🗺️</div>
                <h3>Plan Your Hunting Trip</h3>
                <p>
                  Create your personalized trip schedule and send a booking request to your chosen guider.
                  Everything you need for a successful hunting adventure, all in one place.
                </p>
                <div className="tsv-make-steps">
                  <div className="tsv-step">
                    <span className="tsv-step-num">1</span>
                    <span>Choose guider & trip details</span>
                  </div>
                  <div className="tsv-step-arrow">→</div>
                  <div className="tsv-step">
                    <span className="tsv-step-num">2</span>
                    <span>Get your trip schedule</span>
                  </div>
                  <div className="tsv-step-arrow">→</div>
                  <div className="tsv-step">
                    <span className="tsv-step-num">3</span>
                    <span>Send booking request</span>
                  </div>
                </div>
                <button
                  className="tsv-send-btn full"
                  style={{ marginTop: 24, fontSize: 16, padding: "14px 0" }}
                  onClick={() => setShowTripModal(true)}
                >
                  ✨ Plan Your Trip Now
                </button>
              </div>
              {/* Show existing schedules count as hint */}
              {schedules.length > 0 && (
                <div className="tsv-existing-hint">
                  <span>📋 You have {schedules.length} existing schedule{schedules.length > 1 ? "s" : ""}.</span>
                  <button className="tsv-link-btn" onClick={() => setActiveTab("schedules")}>
                    View them →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── SCHEDULE DETAIL MODAL ─────────────────────────────────── */}
      {showScheduleDetail && selectedSchedule && (() => {
        const parsed = parseScheduleData(selectedSchedule.schedule_data);
        return (
          <div className="tsv-sched-detail-overlay" onClick={() => setShowScheduleDetail(false)}>
            <div className="tsv-sched-detail-modal" onClick={e => e.stopPropagation()}>
              <div className="tsv-sched-detail-header">
                <div>
                  <h3>🗓️ Trip Schedule</h3>
                  <p>{selectedSchedule.destination} · {formatDate(selectedSchedule.start_date)} → {formatDate(selectedSchedule.end_date)}</p>
                </div>
                <button className="tsv-close-btn" onClick={() => setShowScheduleDetail(false)}>✕</button>
              </div>

              <div className="tsv-sched-detail-body">
                {parsed ? (
                  <>
                    {/* Daily Plan */}
                    {parsed.daily_plan?.length > 0 && (
                      <div className="tsv-detail-section">
                        <h4>☀️ Daily Activity Plan</h4>
                        {parsed.daily_plan.map((day, i) => (
                          <div key={i} className="tsv-day-card">
                            <div className="tsv-day-badge">Day {day.day}</div>
                            <div className="tsv-day-content">
                              <div className="tsv-day-title">{day.date} — {day.title}</div>
                              <ul className="tsv-activity-list">
                                {day.activities?.map((act, j) => (
                                  <li key={j}>▶ {act}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Best Route */}
                    {parsed.best_route && (
                      <div className="tsv-detail-section">
                        <h4>🛣️ Best Route</h4>
                        <p className="tsv-route-text">{parsed.best_route}</p>
                      </div>
                    )}

                    {/* Cost */}
                    {parsed.estimated_cost && (
                      <div className="tsv-detail-section">
                        <h4>💰 Estimated Cost</h4>
                        <div className="tsv-cost-grid">
                          {Object.entries(parsed.estimated_cost).map(([k, v]) => (
                            <div key={k} className={`tsv-cost-item ${k === "total" ? "total" : ""}`}>
                              <span className="tsv-cost-label">{k.replace(/_/g, " ")}</span>
                              <span className="tsv-cost-val">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Required Items */}
                    {parsed.required_items?.length > 0 && (
                      <div className="tsv-detail-section">
                        <h4>🎒 Required Items</h4>
                        <div className="tsv-items-grid">
                          {parsed.required_items.map((item, i) => (
                            <div key={i} className="tsv-item-chip">✔ {item}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: "#888", textAlign: "center", padding: 24 }}>
                    Could not load schedule details.
                  </p>
                )}
              </div>

              <div className="tsv-sched-detail-footer">
                <button className="tsv-done-btn" onClick={() => setShowScheduleDetail(false)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TRIP SCHEDULE MODAL (Make Schedule flow) ─────────────── */}
      {showTripModal && (
        <TripScheduleModal
          guider={null}        // null = hunter selects guider inside form
          hunter={currentUser}
          onClose={() => {
            setShowTripModal(false);
            fetchSchedules(); // refresh schedules after making one
          }}
        />
      )}
    </div>
  );
}

export default TripScheduleView;