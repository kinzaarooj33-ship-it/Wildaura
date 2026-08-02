import React, { useState, useEffect } from "react";
import axios from "axios";
import "./hunter-booking.css";

// ===== CUSTOM POPUP =====
function Popup({ type, title, message, onConfirm, onCancel, confirmText, cancelText }) {
  if (!message) return null;
  const icons = { confirm: "❓", success: "✅", error: "❌", warning: "⚠️", payment: "💰", info: "ℹ️" };
  const colors = { confirm: "#1565c0", success: "#2e7d32", error: "#c62828", warning: "#e65100", payment: "#6a1b9a", info: "#0277bd" };
  return (
    <div style={popupStyles.overlay}>
      <div style={popupStyles.box}>
        <div style={{ ...popupStyles.iconCircle, background: colors[type] + "15", border: `2px solid ${colors[type]}30` }}>
          <span style={{ fontSize: 34 }}>{icons[type]}</span>
        </div>
        {title && <h3 style={{ ...popupStyles.title, color: colors[type] }}>{title}</h3>}
        <p style={popupStyles.msg}>{message}</p>
        <div style={popupStyles.actions}>
          {onCancel && <button style={popupStyles.cancelBtn} onClick={onCancel}>{cancelText || "Cancel"}</button>}
          {onConfirm && <button style={{ ...popupStyles.confirmBtn, background: colors[type] }} onClick={onConfirm}>{confirmText || "OK"}</button>}
        </div>
      </div>
    </div>
  );
}
const popupStyles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" },
  box: { background: "#fff", borderRadius: 16, padding: "36px 32px 28px", maxWidth: 400, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", textAlign: "center", animation: "slideIn 0.25s ease" },
  iconCircle: { width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  title: { fontSize: 20, fontWeight: 700, margin: "0 0 8px" },
  msg: { fontSize: 15, color: "#555", margin: "0 0 24px", lineHeight: 1.6 },
  actions: { display: "flex", gap: 12, justifyContent: "center" },
  cancelBtn: { padding: "10px 24px", borderRadius: 8, border: "1.5px solid #ddd", background: "#f5f5f5", color: "#444", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  confirmBtn: { padding: "10px 24px", borderRadius: 8, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" },
};

// ===== PAYMENT MODAL =====
function PaymentModal({ booking, onClose, onSuccess }) {
  const [method, setMethod] = useState("cash");
  const [accountNo, setAccountNo] = useState("");
  const [senderName, setSenderName] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  const methodOptions = [
    { value: "cash", label: "💵 Cash (Pay in person)" },
    { value: "easypaisa", label: "📱 EasyPaisa" },
    { value: "jazzcash", label: "📱 JazzCash" },
    { value: "bank_transfer", label: "🏦 Bank Transfer" },
    { value: "sadapay", label: "💳 SadaPay" },
    { value: "nayapay", label: "💳 NayaPay" },
    { value: "paypal", label: "🌐 PayPal" },
    { value: "western_union", label: "🏢 Western Union" },
  ];

  const needsDetails = method !== "cash";

  const handleSubmit = async () => {
    if (needsDetails && (!senderName.trim() || !txnRef.trim())) {
      setPopup({ type: "warning", title: "Missing Info", message: "Please fill in your name and transaction reference number.", confirmText: "OK", onConfirm: () => setPopup(null) });
      return;
    }

    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      await axios.post("http://localhost:3000/api/booking/payment/initiate", {
        booking_id: booking.id,
        hunter_email: currentUser.email,
        guider_email: booking.guider_email,
        guider_name: booking.guider_name,
        amount: booking.total_amount,
        payment_method: method,
        sender_name: senderName,
        account_no: accountNo,
        transaction_ref: txnRef,
      });

      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      setPopup({ type: "error", title: "Submission Failed", message: err.response?.data?.message || "Something went wrong. Try again.", confirmText: "OK", onConfirm: () => setPopup(null) });
    }
  };

  return (
    <div className="hb-modal-overlay" onClick={onClose}>
      {popup && <Popup {...popup} />}
      <div className="hb-payment-modal" onClick={e => e.stopPropagation()}>
        <div className="hb-modal-header">
          <h3>💳 Submit Payment</h3>
          <button className="hb-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="hb-modal-body">
          {/* Booking Summary */}
          <div className="hb-payment-summary">
            <div className="hb-summary-row">
              <span>Guider</span>
              <strong>{booking.guider_name}</strong>
            </div>
            <div className="hb-summary-row">
              <span>Destination</span>
              <strong>{booking.destination}</strong>
            </div>
            <div className="hb-summary-row hb-summary-total">
              <span>Amount Due</span>
              <strong className="hb-amount">PKR {booking.total_amount?.toLocaleString() || "0"}</strong>
            </div>
          </div>

          {/* Payment Method */}
          <div className="hb-form-group">
            <label>Payment Method</label>
            <select value={method} onChange={e => { setMethod(e.target.value); setAccountNo(""); setSenderName(""); setTxnRef(""); }}>
              {methodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Cash instructions */}
          {method === "cash" && (
            <div className="hb-info-box">
              <p>💡 You've selected <strong>Cash</strong>. Pay the guider in person when you meet. Once paid, the guider will confirm receipt and mark your booking as completed.</p>
            </div>
          )}

          {/* Online payment fields */}
          {needsDetails && (
            <>
              <div className="hb-info-box hb-info-blue">
                <p>Send <strong>PKR {booking.total_amount?.toLocaleString()}</strong> via {methodOptions.find(m => m.value === method)?.label} to the guider's account, then fill in the details below.</p>
              </div>

              <div className="hb-form-group">
                <label>Your Full Name *</label>
                <input type="text" placeholder="Name used while sending payment" value={senderName} onChange={e => setSenderName(e.target.value)} />
              </div>

              <div className="hb-form-group">
                <label>Your Account / Phone No. (optional)</label>
                <input type="text" placeholder="e.g. 03001234567" value={accountNo} onChange={e => setAccountNo(e.target.value)} />
              </div>

              <div className="hb-form-group">
                <label>Transaction Reference / ID *</label>
                <input type="text" placeholder="e.g. TXN123456 or screenshot ref" value={txnRef} onChange={e => setTxnRef(e.target.value)} />
              </div>
            </>
          )}

          <div className="hb-notice">
            <span>⚠️</span> Your booking will be marked <strong>Payment Pending</strong> until the guider confirms receipt.
          </div>

          <button className="hb-submit-pay-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "⏳ Submitting..." : "✅ Submit Payment Info"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function HunterBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [popup, setPopup] = useState(null);
  const [payingBooking, setPayingBooking] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { fetchBookings(); }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/booking/hunter/${currentUser.email}`);
      let data = res.data.bookings || [];
      if (filter !== "all") data = data.filter(b => b.status === filter);
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (bookingId) => {
    setPopup({
      type: "confirm", title: "Cancel Booking?",
      message: "Are you sure you want to cancel this booking? This cannot be undone.",
      confirmText: "Yes, Cancel", cancelText: "Keep It",
      onCancel: () => setPopup(null),
      onConfirm: async () => {
        setPopup(null);
        try {
          await axios.patch(`http://localhost:3000/api/booking/${bookingId}/status`, { status: "cancelled" });
          setPopup({ type: "success", title: "Booking Cancelled", message: "Your booking has been cancelled successfully.", confirmText: "OK", onConfirm: () => { setPopup(null); fetchBookings(); } });
        } catch (err) {
          setPopup({ type: "error", title: "Error", message: "Could not cancel booking. Try again.", confirmText: "OK", onConfirm: () => setPopup(null) });
        }
      }
    });
  };

  const handlePaymentSuccess = () => {
    setPayingBooking(null);
    setPopup({
      type: "payment", title: "Payment Submitted!",
      message: "Your payment details have been sent to the guider. They will confirm receipt shortly and your booking will be completed.",
      confirmText: "Great!", onConfirm: () => { setPopup(null); fetchBookings(); }
    });
  };

  const getStatusBadge = (status, paymentStatus) => {
    if (status === "accepted" && paymentStatus === "payment_pending") {
      return <span className="hb-badge hb-badge-pay-pending">⏳ Payment Pending Confirmation</span>;
    }
    if (status === "accepted" && !paymentStatus) {
      return <span className="hb-badge hb-badge-accepted">✅ Accepted — Pay Now</span>;
    }
    const map = {
      pending: <span className="hb-badge hb-badge-pending">⏳ Pending</span>,
      accepted: <span className="hb-badge hb-badge-accepted">✅ Accepted</span>,
      rejected: <span className="hb-badge hb-badge-rejected">❌ Rejected</span>,
      completed: <span className="hb-badge hb-badge-completed">🎉 Completed</span>,
      cancelled: <span className="hb-badge hb-badge-cancelled">🚫 Cancelled</span>,
    };
    return map[status] || <span className="hb-badge hb-badge-pending">{status}</span>;
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    accepted: bookings.filter(b => b.status === "accepted").length,
    completed: bookings.filter(b => b.status === "completed").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
  };

  return (
    <div className="hb-page">
      {popup && <Popup {...popup} />}
      {payingBooking && <PaymentModal booking={payingBooking} onClose={() => setPayingBooking(null)} onSuccess={handlePaymentSuccess} />}

      <style>{`@keyframes slideIn { from { opacity:0; transform:scale(0.88) translateY(-16px); } to { opacity:1; transform:scale(1) translateY(0); }}`}</style>

      <div className="hb-header">
        <h1>🎯 My Bookings</h1>
        <p>Track your hunting trip requests and payments</p>
      </div>

      {/* Stats */}
      <div className="hb-stats">
        {[
          { label: "Total", value: counts.all, color: "#1a237e" },
          { label: "Pending", value: counts.pending, color: "#e65100" },
          { label: "Accepted", value: counts.accepted, color: "#1b5e20" },
          { label: "Completed", value: counts.completed, color: "#4a148c" },
        ].map(s => (
          <div className="hb-stat-card" key={s.label} style={{ borderTop: `3px solid ${s.color}` }}>
            <span className="hb-stat-num" style={{ color: s.color }}>{s.value}</span>
            <span className="hb-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="hb-filters">
        {["all", "pending", "accepted", "completed", "rejected", "cancelled"].map(f => (
          <button key={f} className={`hb-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="hb-loading"><div className="hb-spinner" /><p>Loading...</p></div>
      ) : bookings.length === 0 ? (
        <div className="hb-empty">
          <span style={{ fontSize: 48 }}>📭</span>
          <h3>No bookings found</h3>
          <p>You don't have any {filter !== "all" ? filter : ""} bookings yet.</p>
        </div>
      ) : (
        <div className="hb-list">
          {bookings.map(booking => (
            <div key={booking.id} className={`hb-card ${booking.status === "accepted" && !booking.payment_status ? "hb-card-action-needed" : ""}`}>

              {/* Action needed banner */}
              {booking.status === "accepted" && !booking.payment_status && (
                <div className="hb-action-banner">
                  💳 Payment required — your guider is waiting!
                </div>
              )}
              {booking.status === "accepted" && booking.payment_status === "payment_pending" && (
                <div className="hb-action-banner hb-banner-waiting">
                  ⏳ Payment submitted — waiting for guider confirmation
                </div>
              )}

              <div className="hb-card-header">
                <div className="hb-guider-info">
                  <div className="hb-avatar">🧭</div>
                  <div>
                    <h3>{booking.guider_name || "Guider"}</h3>
                    <p>{booking.guider_email}</p>
                  </div>
                </div>
                <div>{getStatusBadge(booking.status, booking.payment_status)}</div>
              </div>

              <div className="hb-card-body">
                <div className="hb-details-grid">
                  <div className="hb-detail"><span>📍 Destination</span><strong>{booking.destination}</strong></div>
                  <div className="hb-detail"><span>📅 Dates</span><strong>{formatDate(booking.start_date)} – {formatDate(booking.end_date)}</strong></div>
                  <div className="hb-detail"><span>⏱ Duration</span><strong>{booking.duration || "N/A"} days</strong></div>
                  <div className="hb-detail"><span>🎯 Species</span><strong>{booking.species || "N/A"}</strong></div>
                  <div className="hb-detail"><span>💰 Amount</span><strong className="hb-amount">PKR {booking.total_amount?.toLocaleString() || "0"}</strong></div>
                  <div className="hb-detail"><span>📆 Booked On</span><strong>{formatDate(booking.created_at)}</strong></div>
                </div>
                {booking.special_requests && (
                  <div className="hb-special-req">💬 {booking.special_requests}</div>
                )}
                {/* Payment info if submitted */}
                {booking.payment_method && (
                  <div className="hb-payment-info-row">
                    <span>💳 Payment via <strong>{booking.payment_method}</strong></span>
                    {booking.transaction_ref && <span> · Ref: <strong>{booking.transaction_ref}</strong></span>}
                  </div>
                )}
              </div>

              <div className="hb-card-footer">
                {/* Pay Now button — only if accepted and no payment submitted yet */}
                {booking.status === "accepted" && !booking.payment_status && (
                  <button className="hb-pay-btn" onClick={() => setPayingBooking(booking)}>
                    💳 Pay Now — PKR {booking.total_amount?.toLocaleString()}
                  </button>
                )}
                {/* Cancel — only if pending */}
                {booking.status === "pending" && (
                  <button className="hb-cancel-btn" onClick={() => handleCancelBooking(booking.id)}>
                    🚫 Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}