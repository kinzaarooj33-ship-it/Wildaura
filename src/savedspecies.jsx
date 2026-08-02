import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./shared-detail.css";

export default function SavedSpecies() {
  const [saved, setSaved] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("savedSpecies") || "[]");
    setSaved(data);
  }, []);

  const handleRemove = (scientific_name) => {
    const updated = saved.filter(s => s.scientific_name !== scientific_name);
    localStorage.setItem("savedSpecies", JSON.stringify(updated));
    setSaved(updated);
  };

  const handleDownload = (item) => {
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name || "species"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <div className="sd-page">
        <div className="sd-container sdp-wrapper">

          <div className="sd-hero sdp-hero">
            <button onClick={() => navigate(-1)} className="sd-back-btn">← Back</button>
            <h1 className="sdp-title" style={{ marginTop: "16px" }}>🔖 Saved Species</h1>
            <p className="sdp-desc">Your saved species will appear here.</p>
          </div>

          <div className="sdp-body">
            {saved.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
                <p style={{ fontSize: "18px" }}>no species saved.</p>
                <button
                  onClick={() => navigate("/species-info")}
                  style={{
                    marginTop: "16px", padding: "10px 24px",
                    background: "#8a7d2e", color: "#fff",
                    border: "none", borderRadius: "8px",
                    fontSize: "14px", cursor: "pointer", fontWeight: "600"
                  }}
                >
                  Explore Species
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {saved.map((item, i) => (
                  <div key={i} style={{
                    background: "#fff", border: "1px solid #e0d9a0",
                    borderRadius: "12px", padding: "20px 24px",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: "12px"
                  }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#3d3400" }}>
                        {item.name}
                      </h3>
                      <p style={{ margin: "0", fontSize: "13px", color: "#888" }}>
                        {item.scientific_name} • {item.animal_type}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#aaa" }}>
                        Saved: {new Date(item.savedAt).toLocaleDateString("en-PK")}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => navigate(`/species/${item.name?.toLowerCase().replace(/\s+/g, "-")}`)}
                        style={{
                          padding: "8px 16px", borderRadius: "8px",
                          background: "#8a7d2e", color: "#fff",
                          border: "none", fontSize: "13px",
                          cursor: "pointer", fontWeight: "600"
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        style={{
                          padding: "8px 16px", borderRadius: "8px",
                          background: "transparent", color: "#8a7d2e",
                          border: "2px solid #8a7d2e", fontSize: "13px",
                          cursor: "pointer", fontWeight: "600"
                        }}
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={() => handleRemove(item.scientific_name)}
                        style={{
                          padding: "8px 16px", borderRadius: "8px",
                          background: "transparent", color: "#c0392b",
                          border: "2px solid #c0392b", fontSize: "13px",
                          cursor: "pointer", fontWeight: "600"
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}