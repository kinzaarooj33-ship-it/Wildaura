import { useState, useEffect } from "react";
import Sidebar from "./components/sidebar";
import TopBar from "./components/topbar";

const BACKEND_URL = "http://localhost:3000";

export default function AdminSuccessStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/stories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const formatted = data.stories.map((s) => ({
            ...s,
            date: s.submitted_at
              ? new Date(s.submitted_at).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Recently",
          }));
          setStories(formatted);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/stories/${storyId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: true }),
      });

      const data = await res.json();

      if (data.success) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
        setDeleteMsg("✅ Story deleted successfully!");
        setTimeout(() => setDeleteMsg(""), 2500);
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Could not delete story.");
    }
  };

  return (
    // ✅ Outer wrapper — flex row (sidebar left, content right)
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
      
      {/* ✅ SIDEBAR — left side */}
      <Sidebar />

      {/* ✅ Right side — TopBar upar, content neeche */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* ✅ TOPBAR — sabse upar */}
        <TopBar />

        {/* ✅ MAIN CONTENT — topbar ke neeche */}
        <div style={{ padding: "24px", fontFamily: "sans-serif", overflowY: "auto", flex: 1 }}>

          {/* HEADER */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
              ⭐ Success Stories
            </h2>
          </div>

          {/* STATS BADGE */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "#fef9e7", border: "1px solid #f0c040",
            borderRadius: "8px", padding: "8px 16px", marginBottom: "20px"
          }}>
            <span style={{ fontSize: "20px" }}>🏆</span>
            <span style={{ fontWeight: "600", color: "#b8860b" }}>
              Total Stories: {stories.length}
            </span>
          </div>

          {/* SUCCESS MSG */}
          {deleteMsg && (
            <div style={{
              background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb",
              borderRadius: "8px", padding: "10px 16px", marginBottom: "16px",
              fontSize: "14px", fontWeight: "500"
            }}>
              {deleteMsg}
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
              Loading stories...
            </div>
          ) : stories.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "60px", color: "#888",
              background: "#f9f9f9", borderRadius: "12px", border: "1px dashed #ddd"
            }}>
              No stories submitted yet.
            </div>
          ) : (

            /* STORIES TABLE */
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%", borderCollapse: "collapse",
                background: "#fff", borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden"
              }}>
                <thead>
  <tr style={{ background: "#fff", color: "#000000" }}>
    {["#", "Hunter", "Area", "Trophy", "Story", "Image", "Date", "Status", "Action"].map((h) => (
      <th key={h} style={{
        padding: "12px 14px", textAlign: "left",
        fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap"
      }}>
        {h}
      </th>
    ))}
  </tr>
</thead>
<tbody>
  {stories.map((s, i) => (
    <tr key={s.id} style={{
      borderBottom: "1px solid #eeeeee",
      background: i % 2 === 0 ? "#ffffff" : "#f7f7f7",  // ✅ grey alternating rows
      transition: "background 0.2s"
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "#fffbea"}
      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "#f7f7f7"}
    >
      {/* # */}
      <td style={{ padding: "12px 14px", color: "#888", fontSize: "13px" }}>
        {i + 1}
      </td>

      {/* HUNTER NAME + EMAIL */}
      <td style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "#c8a800", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "700", fontSize: "15px", flexShrink: 0
          }}>
            {s.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: "600", fontSize: "14px", color: "#1a1a1a" }}>
              {s.name}
            </div>
            <div style={{ fontSize: "11px", color: "#999" }}>
              {s.user_email || "—"}
            </div>
          </div>
        </div>
      </td>

      {/* AREA */}
      <td style={{ padding: "12px 14px", fontSize: "13px", color: "#555" }}>
        📍 {s.area}
      </td>

      {/* TROPHY */}
      <td style={{ padding: "12px 14px", fontSize: "13px" }}>
        {s.trophy ? (
          <span style={{
            background: "#fff8dc", color: "#8b6914",
            padding: "3px 8px", borderRadius: "20px",
            fontSize: "12px", fontWeight: "500"
          }}>
            🎯 {s.trophy}
          </span>
        ) : (
          <span style={{ color: "#bbb", fontSize: "12px" }}>—</span>
        )}
      </td>

      {/* STORY */}
      <td style={{ padding: "12px 14px", maxWidth: "260px" }}>
        <p style={{
          margin: 0, fontSize: "13px", color: "#444",
          overflow: expandedId === s.id ? "visible" : "hidden",
          display: "-webkit-box",
          WebkitLineClamp: expandedId === s.id ? "unset" : 2,
          WebkitBoxOrient: "vertical",
          lineHeight: "1.5"
        }}>
          {s.story}
        </p>
        <button
          onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
          style={{
            background: "none", border: "none", color: "#c8a800",
            cursor: "pointer", fontSize: "11px", padding: "2px 0",
            fontWeight: "600"
          }}
        >
          {expandedId === s.id ? "▲ Less" : "▼ More"}
        </button>
      </td>

      {/* IMAGE */}
      <td style={{ padding: "12px 14px" }}>
        {s.image ? (
          <img
            src={s.image.startsWith("/uploads") ? `${BACKEND_URL}${s.image}` : s.image}
            alt="story"
            style={{
              width: "60px", height: "45px",
              objectFit: "cover", borderRadius: "6px",
              border: "1px solid #eee"
            }}
          />
        ) : (
          <span style={{ color: "#bbb", fontSize: "12px" }}>No image</span>
        )}
      </td>

      {/* DATE */}
      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>
        📅 {s.date}
      </td>

      {/* ✅ STATUS BADGE */}
      <td style={{ padding: "12px 14px" }}>
        {s.status === "approved" ? (
          <span style={{
            background: "#d4edda", color: "#155724",
            padding: "4px 10px", borderRadius: "20px",
            fontSize: "11px", fontWeight: "600"
          }}>
            ✅ Approved
          </span>
        ) : s.status === "rejected" ? (
          <span style={{
            background: "#f8d7da", color: "#721c24",
            padding: "4px 10px", borderRadius: "20px",
            fontSize: "11px", fontWeight: "600"
          }}>
            ❌ Rejected
          </span>
        ) : (
          <span style={{
            background: "#fff3cd", color: "#856404",
            padding: "4px 10px", borderRadius: "20px",
            fontSize: "11px", fontWeight: "600"
          }}>
            ⏳ Pending
          </span>
        )}
      </td>

      {/* DELETE */}
      <td style={{ padding: "12px 14px" }}>
        <button
          onClick={() => handleDelete(s.id)}
          style={{
            background: "#fff0f0", color: "#c0392b",
            border: "1px solid #f5c6cb", borderRadius: "6px",
            padding: "6px 12px", cursor: "pointer",
            fontSize: "12px", fontWeight: "600",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#c0392b";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff0f0";
            e.currentTarget.style.color = "#c0392b";
          }}
        >
          🗑️ Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}