import React, { useState, useEffect } from "react";
import axios from "axios";
import "./guider-booking.css";

// ===== CUSTOM POPUP COMPONENT =====
function Popup({ type, title, message, onConfirm, onCancel, confirmText, cancelText }) {
  if (!message) return null;

  const icons = {
    confirm: "❓",
    success: "✅",
    error: "❌",
    warning: "⚠️",
    payment: "💰",
  };

  const colors = {
    confirm: "#b8860b",
    success: "#2e7d32",
    error: "#c62828",
    warning: "#e65100",
    payment: "#6a1b9a",
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <div style={{ ...styles.popupIconCircle, background: colors[type] + "18", border: `2px solid ${colors[type]}33` }}>
          <span style={styles.popupIcon}>{icons[type]}</span>
        </div>
        {title && <h3 style={{ ...styles.popupTitle, color: colors[type] }}>{title}</h3>}
        <p style={styles.popupMessage}>{message}</p>
        <div style={styles.popupActions}>
          {onCancel && (
            <button style={styles.cancelBtn} onClick={onCancel}>
              {cancelText || "Cancel"}
            </button>
          )}
          {onConfirm && (
            <button style={{ ...styles.confirmBtn, background: colors[type] }} onClick={onConfirm}>
              {confirmText || "OK"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999, backdropFilter: "blur(3px)",
    animation: "fadeIn 0.2s ease",
  },
  popup: {
    background: "#fff", borderRadius: "16px", padding: "36px 32px 28px",
    maxWidth: "400px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    textAlign: "center", animation: "popupSlideIn 0.25s ease",
  },
  popupIconCircle: {
    width: "72px", height: "72px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  popupIcon: { fontSize: "36px", lineHeight: 1 },
  popupTitle: { fontSize: "20px", fontWeight: 700, margin: "0 0 8px" },
  popupMessage: { fontSize: "15px", color: "#555", margin: "0 0 24px", lineHeight: 1.5 },
  popupActions: { display: "flex", gap: "12px", justifyContent: "center" },
  cancelBtn: {
    padding: "10px 24px", borderRadius: "8px", border: "1.5px solid #ddd",
    background: "#f5f5f5", color: "#444", fontWeight: 600, fontSize: "14px",
    cursor: "pointer", transition: "all 0.2s",
  },
  confirmBtn: {
    padding: "10px 24px", borderRadius: "8px", border: "none",
    color: "#fff", fontWeight: 600, fontSize: "14px",
    cursor: "pointer", transition: "all 0.2s",
  },
};

// ===== MAIN COMPONENT =====
function GuiderBookings() {
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, rejected: 0, completed: 0 });
  const [filter, setFilter] = useState("all");
  const [areaSearch, setAreaSearch] = useState(""); // ✅ CHANGE: search input
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ===== POPUP STATE =====
  const [popup, setPopup] = useState(null);
  const showPopup = (config) => setPopup(config);
  const closePopup = () => setPopup(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/booking/guider/${currentUser.email}?status=${filter}`
      );
      setBookings(res.data.bookings || []);
      setCounts(res.data.counts || { pending: 0, accepted: 0, rejected: 0, completed: 0 });
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Filter bookings by status AND area search
  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (filter !== "all" && booking.status !== filter) return false;
    // Filter by area search (case insensitive)
    if (areaSearch && !booking.destination?.toLowerCase().includes(areaSearch.toLowerCase())) return false;
    return true;
  });

  // ✅ Clear search
  const clearAreaSearch = () => {
    setAreaSearch("");
  };

  // ===== ACCEPT / REJECT / STATUS UPDATE =====
  const handleStatusUpdate = (bookingId, status) => {
    const statusLabels = {
      accepted: "accept",
      rejected: "reject",
      pending: "mark as pending",
      completed: "mark as completed",
    };
    const label = statusLabels[status] || status;

    showPopup({
      type: "confirm",
      title: "Confirm Action",
      message: `Are you sure you want to ${label} this booking?`,
      confirmText: "Yes, Confirm",
      cancelText: "Cancel",
      onCancel: closePopup,
      onConfirm: async () => {
        closePopup();
        try {
          await axios.patch(
            `http://localhost:3000/api/booking/${bookingId}/status`,
            { status, guider_name: currentUser.name }
          );
          showPopup({
            type: "success",
            title: "Done!",
            message: `Booking ${label}ed successfully!`,
            confirmText: "OK",
            onConfirm: () => { closePopup(); fetchBookings(); },
          });
        } catch (error) {
          showPopup({
            type: "error",
            title: "Update Failed",
            message: "Error updating booking: " + (error.response?.data?.message || "Try again"),
            confirmText: "OK",
            onConfirm: closePopup,
          });
        }
      },
    });
  };

  // ===== CONFIRM PAYMENT RECEIVED =====
  const handleConfirmPayment = (booking) => {
    showPopup({
      type: "payment",
      title: "Confirm Payment Received?",
      message: `Confirm you received PKR ${booking.total_amount?.toLocaleString()} from ${booking.hunter_name} via ${booking.payment_method || "hunter"}? This will mark the booking as Completed.`,
      confirmText: "Yes, Confirm",
      cancelText: "Not Yet",
      onCancel: closePopup,
      onConfirm: async () => {
        closePopup();
        try {
          await axios.post("http://localhost:3000/api/booking/payment/confirm", {
            booking_id: booking.id,
            guider_email: currentUser.email,
            guider_name: currentUser.name,
          });
          showPopup({
            type: "success",
            title: "Payment Confirmed!",
            message: "Payment confirmed and booking is now completed.",
            confirmText: "OK",
            onConfirm: () => { closePopup(); fetchBookings(); },
          });
        } catch (error) {
          showPopup({
            type: "error",
            title: "Error",
            message: error.response?.data?.message || "Could not confirm payment. Try again.",
            confirmText: "OK",
            onConfirm: closePopup,
          });
        }
      },
    });
  };

  const openDetailModal = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: "badge-pending",
      accepted: "badge-accepted",
      rejected: "badge-rejected",
      completed: "badge-completed",
      cancelled: "badge-cancelled",
    };
    const labels = {
      pending: "⏳ Pending",
      accepted: "✅ Accepted",
      rejected: "❌ Rejected",
      completed: "🎉 Completed",
      cancelled: "🚫 Cancelled",
    };
    return <span className={`status-badge ${classes[status] || "badge-pending"}`}>{labels[status] || status}</span>;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-PK", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bookings-loading">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="guider-bookings-page">

      {popup && <Popup {...popup} />}

      <div className="bookings-header">
        <h1><i className="fa-solid fa-calendar-check"></i> My Bookings</h1>
        <p>Manage all your booking requests from hunters</p>
      </div>

      {/* Stats Cards */}
      <div className="bookings-stats">
        <div className="stat-card pending">
          <span className="stat-number">{counts.pending}</span>
          <span className="stat-label">⏳ Pending</span>
        </div>
        <div className="stat-card accepted">
          <span className="stat-number">{counts.accepted}</span>
          <span className="stat-label">✅ Accepted</span>
        </div>
        <div className="stat-card rejected">
          <span className="stat-number">{counts.rejected}</span>
          <span className="stat-label">❌ Rejected</span>
        </div>
        <div className="stat-card completed">
          <span className="stat-number">{counts.completed}</span>
          <span className="stat-label">🎉 Completed</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>📋 All</button>
        <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>⏳ Pending</button>
        <button className={filter === "accepted" ? "active" : ""} onClick={() => setFilter("accepted")}>✅ Accepted</button>
        <button className={filter === "rejected" ? "active" : ""} onClick={() => setFilter("rejected")}>❌ Rejected</button>
        <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>🎉 Completed</button>
      </div>

      {/* ✅ NEW: Area Search Input */}
      <div className="area-search-wrap">
        <div className="area-search-input-wrap">
          <i className="fa-solid fa-location-dot search-icon"></i>
          <input
            type="text"
            placeholder="Search by area / destination..."
            value={areaSearch}
            onChange={(e) => setAreaSearch(e.target.value)}
            className="area-search-input"
          />
          {areaSearch && (
            <button className="clear-search-btn" onClick={clearAreaSearch}>
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>
        <span className="filter-count">
          {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="no-bookings">
          <i className="fa-regular fa-calendar"></i>
          <h3>No Bookings Found</h3>
          <p>
            {areaSearch 
              ? `No ${filter !== "all" ? filter : ""} bookings found for "${areaSearch}"`
              : `You don't have any ${filter !== "all" ? filter : ""} bookings yet.`
            }
          </p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="booking-card">

              {booking.status === "accepted" && booking.payment_status === "payment_pending" && (
                <div style={{
                  background: "#6a1b9a", color: "#fff",
                  padding: "10px 18px", fontSize: "13px",
                  fontWeight: 600, textAlign: "center"
                }}>
                  💰 Hunter submitted payment — please confirm receipt!
                </div>
              )}

              <div className="booking-card-header">
                <div className="hunter-info">
                  <div className="hunter-avatar">
                    {booking.hunter_profile_image ? (
                      <img src={booking.hunter_profile_image} alt="Hunter" />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <div>
                    <h3>{booking.hunter_name || "Unknown Hunter"}</h3>
                    <p><i className="fa-solid fa-envelope"></i> {booking.hunter_email}</p>
                    {booking.hunter_phone && (
                      <p><i className="fa-solid fa-phone"></i> {booking.hunter_phone}</p>
                    )}
                  </div>
                </div>
                <div className="booking-status">{getStatusBadge(booking.status)}</div>
              </div>

              <div className="booking-card-body">
                <div className="booking-details-grid">
                  <div className="detail-item">
                    <label>📍 Destination</label>
                    <p>{booking.destination}</p>
                  </div>
                  <div className="detail-item">
                    <label>📅 Dates</label>
                    <p>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</p>
                  </div>
                  <div className="detail-item">
                    <label>⏱️ Duration</label>
                    <p>{booking.duration || "N/A"} days</p>
                  </div>
                  <div className="detail-item">
                    <label>🎯 Species</label>
                    <p>{booking.species || "Not specified"}</p>
                  </div>
                  <div className="detail-item">
                    <label>💰 Amount</label>
                    <p className="amount">PKR {booking.total_amount?.toLocaleString() || "0"}</p>
                  </div>
                </div>

                {booking.special_requests && (
                  <div className="special-requests-mini">
                    <i className="fa-solid fa-message"></i>
                    <span>{booking.special_requests}</span>
                  </div>
                )}

                {booking.payment_status === "payment_pending" && (
                  <div style={{
                    background: "#f3e5f5", borderRadius: 8,
                    padding: "10px 14px", marginTop: 10,
                    fontSize: 13, color: "#4a148c"
                  }}>
                    <strong>💳 Payment Info from Hunter:</strong><br />
                    Method: <strong>{booking.payment_method}</strong>
                    {booking.sender_name && <> &nbsp;·&nbsp; Name: <strong>{booking.sender_name}</strong></>}
                    {booking.transaction_ref && <> &nbsp;·&nbsp; Ref: <strong>{booking.transaction_ref}</strong></>}
                    {booking.account_no && <> &nbsp;·&nbsp; Account: <strong>{booking.account_no}</strong></>}
                  </div>
                )}
              </div>

              <div className="booking-card-footer">
                {booking.status === "pending" && (
                  <>
                    <button className="view-btn" onClick={() => openDetailModal(booking)}>
                      <i className="fa-solid fa-eye"></i> Details
                    </button>
                    <button className="accept-btn" onClick={() => handleStatusUpdate(booking.id, "accepted")}>
                      <i className="fa-solid fa-check"></i> Accept
                    </button>
                    <button className="reject-btn" onClick={() => handleStatusUpdate(booking.id, "rejected")}>
                      <i className="fa-solid fa-times"></i> Reject
                    </button>
                  </>
                )}

                {booking.status === "accepted" && (
                  <>
                    <button className="view-btn" onClick={() => openDetailModal(booking)}>
                      <i className="fa-solid fa-eye"></i> Details
                    </button>

                    {booking.payment_status === "payment_pending" ? (
                      <button
                        className="accept-btn"
                        style={{ background: "#6a1b9a", flex: 1 }}
                        onClick={() => handleConfirmPayment(booking)}
                      >
                        <i className="fa-solid fa-circle-check"></i> Confirm Payment Received
                      </button>
                    ) : (
                      <button className="pending-btn" onClick={() => handleStatusUpdate(booking.id, "pending")}>
                        <i className="fa-solid fa-clock"></i> Move to Pending
                      </button>
                    )}
                  </>
                )}

                {booking.status === "rejected" && (
                  <button className="view-btn" onClick={() => openDetailModal(booking)}>
                    <i className="fa-solid fa-eye"></i> View Details
                  </button>
                )}

                {booking.status === "completed" && (
                  <button className="view-btn" onClick={() => openDetailModal(booking)}>
                    <i className="fa-solid fa-eye"></i> View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="detail-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3><i className="fa-solid fa-clipboard-list"></i> Booking Details</h3>
              <button className="close-modal" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="detail-modal-body">
              <div className="hunter-profile-section">
                <div className="hunter-profile-avatar">
                  {selectedBooking.hunter_profile_image ? (
                    <img src={selectedBooking.hunter_profile_image} alt="Hunter" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="hunter-profile-info">
                  <h4>{selectedBooking.hunter_name}</h4>
                  <p><i className="fa-solid fa-envelope"></i> {selectedBooking.hunter_email}</p>
                  <p><i className="fa-solid fa-phone"></i> {selectedBooking.hunter_phone || "N/A"}</p>
                </div>
              </div>

              <div className="detail-divider"></div>

              <div className="trip-details-section">
                <h4><i className="fa-solid fa-map-location-dot"></i> Trip Details</h4>
                <div className="trip-details-grid">
                  <div><strong>📍 Destination:</strong> {selectedBooking.destination}</div>
                  <div><strong>📅 Start Date:</strong> {formatDate(selectedBooking.start_date)}</div>
                  <div><strong>📅 End Date:</strong> {formatDate(selectedBooking.end_date)}</div>
                  <div><strong>⏱️ Duration:</strong> {selectedBooking.duration || "N/A"} days</div>
                  <div><strong>🎯 Species:</strong> {selectedBooking.species || "Not specified"}</div>
                  <div><strong>💰 Total Amount:</strong> <span className="amount-text">PKR {selectedBooking.total_amount?.toLocaleString() || "0"}</span></div>
                </div>
                {selectedBooking.special_requests && (
                  <div className="special-requests">
                    <strong><i className="fa-solid fa-message"></i> Special Requests:</strong>
                    <p>{selectedBooking.special_requests}</p>
                  </div>
                )}
              </div>

              <div className="detail-divider"></div>

              <div className="booking-status-section">
                <h4><i className="fa-solid fa-info-circle"></i> Status</h4>
                <div className="status-display">{getStatusBadge(selectedBooking.status)}</div>
                <div className="booking-timeline">
                  <div><strong>📅 Created:</strong> {formatDateTime(selectedBooking.created_at)}</div>
                  {selectedBooking.updated_at && (
                    <div><strong>🔄 Updated:</strong> {formatDateTime(selectedBooking.updated_at)}</div>
                  )}
                  {selectedBooking.completed_at && (
                    <div><strong>✅ Completed:</strong> {formatDateTime(selectedBooking.completed_at)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popupSlideIn { from { opacity: 0; transform: scale(0.85) translateY(-20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

export default GuiderBookings;