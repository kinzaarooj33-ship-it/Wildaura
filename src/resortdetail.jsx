import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./resortdetail.css";
import Navbar from "./components/Navbar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TABS = [
  { key: "overview",  label: "Overview",  icon: "📋" },
  { key: "amenities", label: "Amenities", icon: "🏊" },
  { key: "packages",  label: "Packages",  icon: "💰" },
  { key: "location",  label: "Location",  icon: "📍" },
];

function ResortDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isGuider = location.pathname.startsWith('/guider/');

  const [resort, setResort]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [imgError, setImgError]     = useState(false);
  const [activeTab, setActiveTab]   = useState("overview");
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfRef = useRef();

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/resorts/${id}`)
      .then((res) => { setResort(res.data.data); setLoading(false); })
      .catch((err) => { console.log("Error:", err); setLoading(false); });
  }, [id]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${resort.name}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    }
    setPdfLoading(false);
  };

  if (loading) return <h3 style={{ textAlign: "center", marginTop: "120px" }}>Loading...</h3>;
  if (!resort)  return <h3 style={{ textAlign: "center", marginTop: "120px" }}>Resort not found</h3>;

  const features    = resort.features     ? resort.features.split("||").map(f => f.trim())  : [];
  const amenities   = resort.amenities    ? resort.amenities.split("||").map(a => a.trim()) : [];
  const packages    = resort.packages     ? resort.packages.split("||").map(p => {
    const parts = p.split(" - ");
    return { name: parts[0], price: parts[1], includes: parts[2] };
  }) : [];
  const nearbyAreas = resort.nearby_areas ? resort.nearby_areas.split("||").map(a => a.trim()) : [];
  const starRating  = resort.stars        ? parseInt(resort.stars) : 3;

  const hasCoords = resort.latitude && resort.longitude &&
    parseFloat(resort.latitude) !== 0 && parseFloat(resort.longitude) !== 0;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${resort.latitude},${resort.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(resort.name + " " + resort.location)}`;

  return (
    <>
      {!isGuider && <Navbar />}
      <div className="sd-page rd-page">
        <div className="sd-container" ref={pdfRef}>

          {/* HERO */}
          <div className="sd-hero">
            <button className="sd-back-btn" onClick={() => navigate(-1)}>
              ← Back to Resorts
            </button>

            <div className="rd-hero">
              <div className="rd-hero-img-wrap">
                {imgError ? (
                  <div className="rd-hero-fallback"><span>{resort.name[0]}</span></div>
                ) : (
                  <img
                    src={`http://localhost:3000/uploads/${resort.image}`}
                    alt={resort.name}
                    className="rd-hero-img"
                    onError={() => setImgError(true)}
                  />
                )}
              </div>

              <div className="rd-hero-info">
                <div className="rd-hero-top">
                  <div>
                    <h1 className="rd-name">{resort.name}</h1>
                    <div className="rd-stars">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} style={{ color: i < starRating ? "#000000" : "#ddd", fontSize: "18px" }}>★</span>
                      ))}
                      <span className="rd-star-label">{starRating} Star Resort</span>
                    </div>
                  </div>
                  <div className="rd-price-pill">
                    {resort.price_per_night}
                    <span className="rd-price-sub">/night</span>
                  </div>
                </div>

                <div className="rd-meta-grid">
                  <div className="rd-meta-item">
                    <span className="rd-meta-label">Province</span>
                    <span className="rd-meta-val">🗺 {resort.province}</span>
                  </div>
                  <div className="rd-meta-item">
                    <span className="rd-meta-label">Location</span>
                    <span className="rd-meta-val">📍 {resort.location}</span>
                  </div>
                  <div className="rd-meta-item">
                    <span className="rd-meta-label">Type</span>
                    <span className="rd-meta-val">🏨 {resort.type}</span>
                  </div>
                  <div className="rd-meta-item">
                    <span className="rd-meta-label">Phone</span>
                    <span className="rd-meta-val">📞 {resort.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
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

          {/* TAB CONTENT */}
          <div className="rd-tab-content">

            {activeTab === "overview" && (
              <div>
                <h2 className="rd-section-title">About this resort</h2>
                <p className="rd-desc">{resort.description}</p>

                {features.length > 0 && (
                  <div className="rd-features-wrap">
                    <h3 className="rd-sub-title">✨ Key Features</h3>
                    <div className="rd-feature-chips">
                      {features.map((f, i) => (
                        <span key={i} className="rd-feature-chip">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rd-info-card" style={{ marginTop: "1.25rem" }}>
                  <h3 className="rd-sub-title">📞 Contact Information</h3>
                  <div className="rd-info-row">
                    <span className="rd-info-label">Phone</span>
                    <span className="rd-info-val">{resort.phone}</span>
                  </div>
                  <div className="rd-info-row">
                    <span className="rd-info-label">Email</span>
                    <span className="rd-info-val">
                      {resort.email
                        ? <a href={`mailto:${resort.email}`} style={{ color: "#b6a910" }}>{resort.email}</a>
                        : "N/A"}
                    </span>
                  </div>
                  <div className="rd-info-row" style={{ borderBottom: "none" }}>
                    <span className="rd-info-label">Website</span>
                    <span className="rd-info-val">
                      {resort.website
                        ? <a href={resort.website.startsWith("http") ? resort.website : `https://${resort.website}`}
                            target="_blank" rel="noopener noreferrer" style={{ color: "#b6a910" }}>{resort.website}</a>
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "amenities" && (
              <div>
                <h2 className="rd-section-title">Amenities & Facilities</h2>
                <div className="rd-amenities-grid">
                  {amenities.map((a, i) => (
                    <div key={i} className="rd-amenity-item">
                      <span className="rd-amenity-icon">✅</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
                <div className="rd-info-card" style={{ marginTop: "1.25rem" }}>
                  <h3 className="rd-sub-title">ℹ️ Resort Info</h3>
                  <div className="rd-info-row" style={{ borderBottom: "none" }}>
                    <span className="rd-info-label">Total Rooms</span>
                    <span className="rd-info-val">{resort.total_rooms || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "packages" && (
              <div>
                <h2 className="rd-section-title">Packages & Pricing</h2>
                <div className="rd-packages-list">
                  {packages.map((p, i) => (
                    <div key={i} className="rd-package-card">
                      <div className="rd-package-header">
                        <span className="rd-package-name">🏷️ {p.name}</span>
                        <span className="rd-package-price">{p.price}</span>
                      </div>
                      <div className="rd-package-includes">
                        <span className="rd-includes-label">Includes:</span> {p.includes}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rd-info-card" style={{ marginTop: "1rem" }}>
                  <h3 className="rd-sub-title">💳 Booking Info</h3>
                  <div className="rd-info-row">
                    <span className="rd-info-label">Base Price</span>
                    <span className="rd-info-val">{resort.price_per_night}/night</span>
                  </div>
                  <div className="rd-info-row">
                    <span className="rd-info-label">Payment</span>
                    <span className="rd-info-val">{resort.payment_methods || "Cash, Card"}</span>
                  </div>
                  <div className="rd-info-row" style={{ borderBottom: "none" }}>
                    <span className="rd-info-label">Cancellation</span>
                    <span className="rd-info-val">{resort.cancellation_policy || "48 hours notice required"}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div>
                <h2 className="rd-section-title">Location & Nearby Areas</h2>

                {hasCoords && (
                  <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "1rem", height: "350px" }}>
                    <MapContainer
                      center={[parseFloat(resort.latitude), parseFloat(resort.longitude)]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      <Marker position={[parseFloat(resort.latitude), parseFloat(resort.longitude)]}>
                        <Popup>{resort.name}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}

                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "#4285F4", color: "#fff", padding: "10px 18px",
                      borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px"
                    }}
                  >
                    🗺️ Open in Google Maps
                  </a>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "#b6b14a", color: "#fff", padding: "10px 18px",
                      borderRadius: "8px", border: "none", cursor: "pointer",
                      fontWeight: "600", fontSize: "14px",
                      opacity: pdfLoading ? 0.7 : 1
                    }}
                  >
                    {pdfLoading ? "⏳ Generating..." : "📄 Download PDF"}
                  </button>
                </div>

                <div className="rd-info-card">
                  <h3 className="rd-sub-title">📍 Address</h3>
                  <div className="rd-info-row">
                    <span className="rd-info-label">Full Address</span>
                    <span className="rd-info-val">{resort.address || resort.location}</span>
                  </div>
                  <div className="rd-info-row">
                    <span className="rd-info-label">Province</span>
                    <span className="rd-info-val">{resort.province}</span>
                  </div>
                  <div className="rd-info-row" style={{ borderBottom: "none" }}>
                    <span className="rd-info-label">Distance from city</span>
                    <span className="rd-info-val">{resort.distance_from_city || "N/A"}</span>
                  </div>
                </div>

                {nearbyAreas.length > 0 && (
                  <div className="rd-info-card" style={{ marginTop: "1rem" }}>
                    <h3 className="rd-sub-title">🌿 Nearby Hunting Areas</h3>
                    <div className="rd-nearby-list">
                      {nearbyAreas.map((area, i) => (
                        <div key={i} className="rd-nearby-item">
                          <span>🎯</span><span>{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rd-info-card" style={{ marginTop: "1rem" }}>
                  <h3 className="rd-sub-title">🚗 How to Reach</h3>
                  <div className="rd-tip-list">
                    <div className="rd-tip-item">✈️ Nearest airport: {resort.nearest_airport || "Check with resort"}</div>
                    <div className="rd-tip-item">🚌 Bus service available from main city</div>
                    <div className="rd-tip-item">🚗 Private car recommended for best access</div>
                    <div className="rd-tip-item">📞 Resort can arrange pickup: {resort.phone}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default ResortDetail;