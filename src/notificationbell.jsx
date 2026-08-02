import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../notificationcontent.jsx";
import { FaBell } from "react-icons/fa";

function timeAgo(date) {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "Abhi abhi";
  if (diff < 3600) return `${Math.floor(diff / 60)} min pehle`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ghante pehle`;
  return `${Math.floor(diff / 86400)} din pehle`;
}

function getIcon(type) {
  if (type === "booking_accepted") return "✅";
  if (type === "booking_rejected") return "❌";
  if (type === "system_update") return "📢";
  return "🔔";
}

export default function NotificationBell() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={ref}>

      {/* Bell Button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "6px",
          color: "black",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <FaBell size={20} />
        <span style={{ fontSize: "14px", fontWeight: "bold" }}>Notifications</span>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            background: "red",
            color: "white",
            fontSize: "11px",
            borderRadius: "50%",
            minWidth: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            border: "2px solid #6b7c2d",
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "40px",
          width: "320px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          border: "1px solid #eee",
          zIndex: 9999,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
          }}>
            <span style={{ fontWeight: "600", fontSize: "14px" }}>Notifications</span>
            <button
              onClick={(e) => { e.stopPropagation(); markAllRead(); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7c2d",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              Mark all read
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <p style={{ textAlign: "center", color: "#aaa", padding: "32px 16px", fontSize: "14px" }}>
                Koi notification nahi
              </p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f5f5f5",
                    background: !n.read ? "#f4f8e8" : "white",
                    transition: "background 0.2s",
                  }}
                >
                  <span style={{ fontSize: "20px", marginTop: "2px" }}>{getIcon(n.type)}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", color: "#333", margin: 0, lineHeight: "1.4" }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: "11px", color: "#aaa", margin: "4px 0 0" }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#6b7c2d",
                      marginTop: "6px",
                      flexShrink: 0,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}