import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./huntinglaws.css";
import Navbar from "./components/Navbar";

function ActDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isGuider = location.pathname.startsWith('/guider/');

  const [act, setAct] = useState(null);
  const [laws, setLaws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/act/" + id)
      .then((res) => res.json())
      .then((data) => {
        setAct(data.act);
        setLaws(data.laws);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Error:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        {!isGuider && <Navbar />}
        <div className="sd-page">
          <div style={{ textAlign: "center", padding: "60px", fontSize: "18px" }}>
            Loading...
          </div>
        </div>
      </>
    );
  }

  if (!act) {
    return (
      <>
        {!isGuider && <Navbar />}
        <div className="sd-page">
          <div style={{ textAlign: "center", padding: "60px", fontSize: "18px" }}>
            Act not found.
          </div>
        </div>
      </>
    );
  }

  const keyPoints = act.key_points ? act.key_points.split("|") : [];

  return (
    <>
      {!isGuider && <Navbar />}
      <div className="sd-page">
        <div className="sd-container">

          {/* ── GOLD HEADER ── */}
          <div className="sd-hero">
            <button className="sd-back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div className="laws-header-icon">⚖</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 4px" }}>
              {act.name}
            </h1>
            <p style={{ margin: 0, opacity: 0.75 }}>
              {act.province} — {act.year}
            </p>
          </div>

          {/* ── DESCRIPTION ── */}
          <div style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "10px", color: "#5a6e2c" }}>About this Act</h3>
            <p style={{ fontSize: "15px", lineHeight: "1.7", color: "#444" }}>
              {act.description}
            </p>
          </div>

          {/* ── KEY POINTS ── */}
          {keyPoints.length > 0 && (
            <div style={{ padding: "0 24px 24px" }}>
              <h3 style={{ marginBottom: "14px", color: "#5a6e2c" }}>Key Points</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {keyPoints.map((point, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "#f5f7ee",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      color: "#333",
                    }}
                  >
                    <span style={{ color: "#8a9e3a", fontWeight: "bold", fontSize: "18px" }}>✓</span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RELATED LAWS ── */}
          <div style={{ padding: "0 24px 24px" }}>
            <h3 style={{ marginBottom: "14px", color: "#5a6e2c" }}>
              Related Laws {laws.length > 0 && "(" + laws.length + ")"}
            </h3>

            {laws.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "30px",
                background: "#f9f9f9",
                borderRadius: "12px",
                color: "#888",
              }}>
                No related laws found.
              </div>
            ) : (
              laws.map((law) => (
                <div className="law-card" key={law.id}>
                  <div className="law-card-header">
                    <span className="law-title">{law.title}</span>
                    <span className={getTagClass(law.category)}>
                      {law.category}
                    </span>
                  </div>
                  <div className="law-desc">{law.description}</div>
                  <div className="law-footer">
                    <span className="footer-label">{law.footerLabel}: </span>
                    <span className="footer-val">{law.footerValue}</span>
                  </div>
                  <div className="act-ref">{law.reference}</div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}

function getTagClass(type) {
  switch (type) {
    case "Prohibited":     return "tag-prohibited";
    case "License":        return "tag-license";
    case "Seasonal":       return "tag-seasonal";
    case "Special Permit": return "tag-special";
    default:               return "";
  }
}

export default ActDetail;