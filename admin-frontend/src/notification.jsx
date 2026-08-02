import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/sidebar.jsx";
import TopBar from "./components/topbar.jsx";
import "./user.css";

export default function BroadcastNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/notifications/all");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const deleteAll = async () => {
    if (!window.confirm("Sab notifications delete karo?")) return;
    try {
      await axios.delete("http://localhost:3000/api/notifications/all");
      setNotifications([]);
    } catch (err) {
      console.error("Delete all error:", err);
    }
  };

  return (
    <div className="admin-wrapper">
      <TopBar />
      <div className="admin-body">
        <Sidebar activeLabel="Notifications" />
        <main className="main-content">

          <div className="table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="page-title">🔔 Notifications</h2>
            {notifications.length > 0 && (
              <button
                onClick={deleteAll}
                style={{
                  background: "#e53e3e",
                  color: "#fff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px"
                }}
              >
                🗑️ Delete All
              </button>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", overflow: "hidden", marginTop: "16px" }}>
            {loading ? (
              <p style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>Loading...</p>
            ) : notifications.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>Koi notification nahi</p>
            ) : (
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                    <th style={th}>#</th>
                    <th style={th}>Email</th>
                    <th style={th}>Type</th>
                    <th style={th}>Title</th>
                    <th style={th}>Message</th>
                    <th style={th}>Role</th>
                    <th style={th}>Read</th>
                    <th style={th}>Date</th>
                    <th style={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n, i) => (
                    <tr key={n.id} style={{ borderBottom: "1px solid #f5f5f5", background: n.is_read ? "#fff" : "#f4f8e8" }}>
                      <td style={td}>{i + 1}</td>
                      <td style={td}>{n.user_email}</td>
                      <td style={td}>
                        <span style={{
                          background: "#e8f0c8",
                          color: "#6b7c2d",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600
                        }}>
                          {n.type}
                        </span>
                      </td>
                      <td style={td}>{n.title || "—"}</td>
                      <td style={{ ...td, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</td>
                      <td style={td}>{n.user_role || "—"}</td>
                      <td style={td}>
                        <span style={{
                          background: n.is_read ? "#c6f6d5" : "#fed7d7",
                          color: n.is_read ? "#276749" : "#c53030",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600
                        }}>
                          {n.is_read ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td style={td}>{new Date(n.created_at).toLocaleDateString()}</td>
                      <td style={td}>
                        <button
                          onClick={() => deleteNotification(n.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#e53e3e",
                            fontSize: "16px"
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const th = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 600,
  color: "#555",
};

const td = {
  padding: "12px 16px",
  fontSize: "13px",
  color: "#333",
};