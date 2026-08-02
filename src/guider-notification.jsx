import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./guider-notification.css";

function GuiderNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const user = JSON.parse(localStorage.getItem("user"));
  const userEmail = user?.email;

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // ✅ sirf guider wali notifications fetch hongi (recipient_type = 'guider')
      const res = await fetch(`http://localhost:3000/api/notifications/guider/${userEmail}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      showToast("❌ Could not load notifications.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      // ✅ sirf guider ki notifications read mark hongi
      await fetch(`http://localhost:3000/api/notifications/guider/${userEmail}/read-all`, { method: "PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      showToast("✅ All notifications marked as read.");
    } catch {
      showToast("❌ Server error.", "error");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/notifications/${id}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  // ✅ Notification click — type ke hisaab se redirect
  const handleNotifClick = async (n) => {
    if (!n.is_read) await markAsRead(n.id);
    if (n.type === "feedback")  navigate("/guider-feedback");
    if (n.type === "booking")   navigate("/guider-booking");
    if (n.type === "emergency") navigate("/guider-emergency");
  };

  const getIcon = (type) => {
    switch (type) {
      case "booking":   return "📅";
      case "feedback":  return "💬";
      case "emergency": return "🚨";
      default:          return "🔔";
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case "booking":   return "notif-badge booking";
      case "feedback":  return "notif-badge feedback";
      case "emergency": return "notif-badge emergency";
      default:          return "notif-badge general";
    }
  };

  const filtered = filter === "all"
    ? notifications
    : filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notif-page">
      {toast.show && (
        <div className={`notif-toast ${toast.type}`}>{toast.message}</div>
      )}

      <div className="notif-header">
        <div>
          <h1 className="notif-title">
            🔔 Notifications
            {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
          </h1>
          <p className="notif-subtitle">Stay updated with bookings, feedback & emergencies</p>
        </div>
        {unreadCount > 0 && (
          <button className="notif-read-all-btn" onClick={markAllRead}>✓ Mark all as read</button>
        )}
      </div>

      <div className="notif-filters">
        {["all", "unread", "booking", "feedback", "emergency"].map(f => (
          <button
            key={f}
            className={`notif-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all"       && "All"}
            {f === "unread"    && `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
            {f === "booking"   && "📅 Bookings"}
            {f === "feedback"  && "💬 Feedback"}
            {f === "emergency" && "🚨 Emergency"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="notif-loading">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="notif-empty">
          <span style={{ fontSize: 48 }}>🔕</span>
          <p>No notifications here.</p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map(n => (
            <div
              key={n.id}
              className={`notif-item ${!n.is_read ? "unread" : ""} ${["feedback","booking","emergency"].includes(n.type) ? "clickable" : ""}`}
              onClick={() => handleNotifClick(n)}
            >
              <div className="notif-icon">{getIcon(n.type)}</div>
              <div className="notif-body">
                <div className="notif-top-row">
                  <span className={getBadgeClass(n.type)}>
                    {n.type?.charAt(0).toUpperCase() + n.type?.slice(1)}
                  </span>
                  {["feedback","booking","emergency"].includes(n.type) && (
                    <span className="notif-redirect-hint">Tap to view →</span>
                  )}
                  <span className="notif-time">
                    {new Date(n.created_at).toLocaleString("en-PK", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
                <p className="notif-message">{n.message}</p>
                {!n.is_read && <span className="notif-unread-dot" />}
              </div>
              <button
                className="notif-delete-btn"
                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GuiderNotifications;