import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Huntingareadetail.css";
import Navbar from "./components/Navbar";

const TABS = [
  { key: "overview",   label: "Overview",   icon: "📋" },
  { key: "weather",    label: "Weather",    icon: "🌤" },
  { key: "rules",      label: "Rules",      icon: "📜" },
  { key: "facilities", label: "Facilities", icon: "🏥" },
];

function HuntingAreaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isGuider = location.pathname.startsWith('/guider/');

  const [area, setArea]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [imgError, setImgError]   = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/hunting-areas/${id}`)
      .then((res) => { setArea(res.data.data); setLoading(false); })
      .catch((err) => { console.log("Error:", err); setLoading(false); });
  }, [id]);

  if (loading) return <h3 style={{ textAlign: "center", marginTop: "120px" }}>Loading...</h3>;
  if (!area)   return <h3 style={{ textAlign: "center", marginTop: "120px" }}>Area not found</h3>;

  const weather        = area.weather         ? JSON.parse(area.weather)         : [];
  const animals        = area.animals         ? area.animals.split(",").map(a => a.trim()) : [];
  const rulesAllowed   = area.rules_allowed   ? area.rules_allowed.split("||")   : [];
  const rulesForbidden = area.rules_forbidden ? area.rules_forbidden.split("||") : [];
  const rulesWarnings  = area.rules_warnings  ? area.rules_warnings.split("||")  : [];
  const hospitals      = area.hospitals       ? area.hospitals.split("||").map(h => { const p = h.split(" - "); return { name: p[0], distance: p[1], phone: p[2] }; }) : [];
  const hotels         = area.hotels          ? area.hotels.split("||").map(h => { const p = h.split(" - "); return { name: p[0], distance: p[1], price: p[2] }; }) : [];
  const supplies       = area.supplies        ? area.supplies.split("||").map(s => { const p = s.split(" - "); return { name: p[0], distance: p[1], note: p[2] }; }) : [];

  const statusColors = {
    Open:    { bg: "#e8f5e9", color: "#2e7d32", icon: "✅" },
    Limited: { bg: "#fff8e1", color: "#b45309", icon: "⚠️" },
    Closed:  { bg: "#fce4ec", color: "#c62828", icon: "🚫" },
  };
  const sc = statusColors[area.status] || statusColors.Open;

  return (
    <>
      {!isGuider && <Navbar />}

      <div className="sd-page had-page">
        <div className="sd-container had-container">

          <div className="sd-hero">
            <button className="sd-back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>

            <div className="had-hero">
              <div className="had-hero-img-wrap">
                {imgError ? (
                  <div className="had-hero-fallback"><span>{area.name[0]}</span></div>
                ) : (
                  <img
                    src={`http://localhost:3000/uploads/${area.image}`}
                    alt={area.name}
                    className="had-hero-img"
                    onError={() => setImgError(true)}
                  />
                )}
              </div>

              <div className="had-hero-info">
                <div className="had-hero-top">
                  <h1 className="had-name">{area.name}</h1>
                  <div className="had-status-pill" style={{ background: sc.bg, color: sc.color }}>
                    {sc.icon} {area.status}
                  </div>
                </div>
                <div className="had-meta-grid">
                  <div className="had-meta-item">
                    <span className="had-meta-label">Province</span>
                    <span className="had-meta-val">🗺 {area.province}</span>
                  </div>
                  <div className="had-meta-item">
                    <span className="had-meta-label">Region</span>
                    <span className="had-meta-val">📍 {area.region}</span>
                  </div>
                  <div className="had-meta-item">
                    <span className="had-meta-label">Season</span>
                    <span className="had-meta-val">📅 {area.season}</span>
                  </div>
                  <div className="had-meta-item">
                    <span className="had-meta-label">Permit</span>
                    <span className="had-meta-val">{area.permit_required ? "✅ Required" : "❌ Not Required"}</span>
                  </div>
                  <div className="had-meta-item">
                    <span className="had-meta-label">Contact</span>
                    <span className="had-meta-val">📞 {area.contact_phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sd-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`sd-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.icon}</span> <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="had-tab-content">

            {activeTab === "overview" && (
              <div className="had-section">
                <h2 className="had-section-title">About this area</h2>
                <p className="had-desc">{area.description}</p>
                <div className="had-animals-wrap">
                  <h3 className="had-sub-title">🦌 Animals Found Here</h3>
                  <div className="had-animal-chips">
                    {animals.map((a, i) => <span key={i} className="had-animal-chip">{a}</span>)}
                  </div>
                </div>
                <div className="had-info-card" style={{ marginTop: "1.25rem" }}>
                  <h3 className="had-sub-title">📞 Contact Information</h3>
                  <div className="had-info-row">
                    <span className="had-info-label">Department</span>
                    <span className="had-info-val">{area.contact}</span>
                  </div>
                  <div className="had-info-row">
                    <span className="had-info-label">Phone</span>
                    <span className="had-info-val">{area.contact_phone}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "weather" && (
              <div className="had-section">
                <h2 className="had-section-title">Weather & Best Time to Visit</h2>
                <div className="had-weather-grid">
                  {weather.map((w, i) => (
                    <div className="had-weather-cell" key={i}>
                      <div className="had-weather-month">{w.month}</div>
                      <div className="had-weather-icon">{w.icon}</div>
                      <div className="had-weather-temp">{w.temp}</div>
                      <div className="had-weather-note">{w.note}</div>
                    </div>
                  ))}
                </div>
                <div className="had-best-time-banner">
                  <span style={{ fontSize: "1.8rem" }}>⭐</span>
                  <div>
                    <div className="had-best-label">Best time to visit</div>
                    <div className="had-best-val">{area.best_time}</div>
                  </div>
                </div>
                <div className="had-info-card" style={{ marginTop: "1rem" }}>
                  <h3 className="had-sub-title">💡 Weather Tips</h3>
                  <div className="had-tip-list">
                    <div className="had-tip-item">🧥 Warm layers recommended — temperatures drop sharply at night</div>
                    <div className="had-tip-item">🌧 Carry waterproof gear during rainy months</div>
                    <div className="had-tip-item">☀ Start early morning for best wildlife activity</div>
                    <div className="had-tip-item">💧 Carry sufficient drinking water</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rules" && (
              <div className="had-section">
                <div className="had-permit-banner" style={{
                  background:   area.status === "Closed" ? "#fce4ec" : "#f0f7e6",
                  borderColor:  area.status === "Closed" ? "#ef9a9a" : "#a5d6a7",
                }}>
                  <span style={{ fontSize: "2rem" }}>
                    {area.status === "Closed" ? "🚫" : area.permit_required ? "📋" : "✅"}
                  </span>
                  <div>
                    <div className="had-permit-title">
                      {area.status === "Closed" ? "Area Currently CLOSED" : area.permit_required ? "Permit Required" : "Open — No Permit Needed"}
                    </div>
                    <div className="had-permit-sub">Season: <strong>{area.season}</strong></div>
                  </div>
                </div>

                {rulesAllowed.length > 0 && (
                  <>
                    <h3 className="had-sub-title" style={{ marginTop: "1.25rem" }}>✅ Allowed</h3>
                    <div className="had-rules-list">
                      {rulesAllowed.map((r, i) => (
                        <div key={i} className="had-rule-item" style={{ borderLeftColor: "#8aaf3f" }}>
                          <span>✅</span><span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {rulesForbidden.length > 0 && (
                  <>
                    <h3 className="had-sub-title" style={{ marginTop: "1.25rem" }}>❌ Forbidden</h3>
                    <div className="had-rules-list">
                      {rulesForbidden.map((r, i) => (
                        <div key={i} className="had-rule-item" style={{ borderLeftColor: "#ef5350" }}>
                          <span>❌</span><span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {rulesWarnings.length > 0 && (
                  <>
                    <h3 className="had-sub-title" style={{ marginTop: "1.25rem" }}>⚠️ Warnings</h3>
                    <div className="had-rules-list">
                      {rulesWarnings.map((r, i) => (
                        <div key={i} className="had-rule-item" style={{ borderLeftColor: "#f59e0b" }}>
                          <span>⚠️</span><span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "facilities" && (
              <div className="had-section">
                <div className="had-info-card">
                  <h3 className="had-sub-title">🏥 Nearby Hospitals</h3>
                  {hospitals.map((h, i) => (
                    <div className="had-facility-row" key={i}>
                      <span style={{ fontSize: "1.2rem" }}>🏥</span>
                      <div className="had-facility-info">
                        <div className="had-facility-name">{h.name}</div>
                        <div className="had-facility-sub">📞 {h.phone}</div>
                      </div>
                      <span className="had-facility-dist">{h.distance}</span>
                    </div>
                  ))}
                </div>
                <div className="had-info-card" style={{ marginTop: "1rem" }}>
                  <h3 className="had-sub-title">🛏 Hotels & Accommodation</h3>
                  {hotels.map((h, i) => (
                    <div className="had-facility-row" key={i}>
                      <span style={{ fontSize: "1.2rem" }}>🏨</span>
                      <div className="had-facility-info">
                        <div className="had-facility-name">{h.name}</div>
                        <div className="had-facility-sub">💰 {h.price}</div>
                      </div>
                      <span className="had-facility-dist">{h.distance}</span>
                    </div>
                  ))}
                </div>
                <div className="had-info-card" style={{ marginTop: "1rem" }}>
                  <h3 className="had-sub-title">🛒 Supplies & Stores</h3>
                  {supplies.map((s, i) => (
                    <div className="had-facility-row" key={i}>
                      <span style={{ fontSize: "1.2rem" }}>🏪</span>
                      <div className="had-facility-info">
                        <div className="had-facility-name">{s.name}</div>
                        <div className="had-facility-sub">{s.note}</div>
                      </div>
                      <span className="had-facility-dist">{s.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default HuntingAreaDetail;