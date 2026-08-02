import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./hunter-notifications.css";

// onOpenTripSchedule → Navbar se aata hai, booking notification click par modal kholta hai
function HunterNotifications({ onClose, onOpenTripSchedule }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);

  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/notifications/hunter/${currentUser.email}`
      );
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `http://localhost:3000/api/notifications/hunter/${currentUser.email}/read-all`
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // ✅ FIXED: navigate ki jagah onOpenTripSchedule callback use karo
  const handleNotifClick = async (notif) => {
    if (!notif.is_read) await markAsRead(notif.id);

    switch (notif.type) {
      case "booking":
      case "booking_accepted":
      case "booking_rejected":
        // Navbar ko batao: TripScheduleView kholo, "bookings" tab pe
        if (onOpenTripSchedule) {
          onOpenTripSchedule("bookings");
        } else {
          // fallback agar prop na mile
          onClose();
          navigate("/trip-schedule");
        }
        break;
      case "feedback":
        onClose();
        navigate("/feedback");
        break;
      case "emergency":
        onClose();
        navigate("/emergency");
        break;
      default:
        onClose();
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "emergency":        return "🚨";
      case "booking":          return "📅";
      case "booking_accepted": return "✅";
      case "booking_rejected": return "❌";
      case "feedback":         return "💬";
      default:                 return "🔔";
    }
  };

  const getRedirectHint = (type) => {
    switch (type) {
      case "booking":
      case "booking_accepted":
      case "booking_rejected": return "Tap to view booking →";
      case "feedback":         return "Tap to view reply →";
      case "emergency":        return "Tap to view →";
      default:                 return null;
    }
  };

  const formatTime = (timestamp) => {
    const date     = new Date(timestamp);
    const now      = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1)    return "Just now";
    if (diffMins < 60)   return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className="notif-modal" onClick={(e) => e.stopPropagation()}>

        <div className="notif-header">
          <h3>
            <i className="fa-solid fa-bell"></i> Notifications
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </h3>
          <div className="notif-actions">
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="notif-list">
          {loading ? (
            <div className="notif-loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">
              <i className="fa-regular fa-bell-slash"></i>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-item ${!notif.is_read ? "unread" : ""} ${getRedirectHint(notif.type) ? "clickable" : ""}`}
                onClick={() => handleNotifClick(notif)}
                style={{ cursor: getRedirectHint(notif.type) ? "pointer" : "default" }}
              >
                <div className="notif-icon">{getNotificationIcon(notif.type)}</div>
                <div className="notif-content">
                  <div className="notif-message">{notif.message}</div>
                  {getRedirectHint(notif.type) && (
                    <div className="notif-redirect-hint">
                      {getRedirectHint(notif.type)}
                    </div>
                  )}
                  <div className="notif-time">{formatTime(notif.created_at)}</div>
                </div>
                {!notif.is_read && <div className="unread-dot"></div>}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default HunterNotifications;