import React, { useState, useEffect } from "react";
import axios from "axios";
import "./guider-emergency.css";

function GuiderEmergency() {
  const [emergencies, setEmergencies] = useState([]);
  const [acceptedEmergencies, setAcceptedEmergencies] = useState([]); // ✅ NEW
  const [activeTab, setActiveTab] = useState("active"); // ✅ NEW: "active" | "accepted"
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchEmergencies();
    fetchAcceptedEmergencies(); // ✅ NEW
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchEmergencies();
      fetchAcceptedEmergencies(); // ✅ NEW
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmergencies = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/emergency/guider/${currentUser.email}`
      );
      setEmergencies(res.data.emergencies || []);
    } catch (error) {
      console.error("Error fetching emergencies:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: accept ki hui emergencies fetch karna
  const fetchAcceptedEmergencies = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/emergency/guider/${currentUser.email}/accepted`
      );
      setAcceptedEmergencies(res.data.emergencies || []);
    } catch (error) {
      console.error("Error fetching accepted emergencies:", error);
    }
  };

  const handleResponse = async (emergencyId, action, guiderName) => {
    try {
      await axios.post("http://localhost:3000/api/emergency/respond", {
        emergency_id: emergencyId,
        guider_email: currentUser.email,
        guider_name: currentUser.name || guiderName,
        action: action,
      });

      alert(`✅ Emergency ${action === "accept" ? "accepted" : "rejected"}!`);
      fetchEmergencies();
      fetchAcceptedEmergencies(); // ✅ NEW: accept hote hi accepted list bhi refresh karo

      // ✅ NEW: accept karne ke baad seedha "Accepted" tab dikha do
      if (action === "accept") {
        setActiveTab("accepted");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Failed to respond");
    }
  };

  const openLocationModal = (emergency) => {
    setSelectedEmergency(emergency);
    setShowLocationModal(true);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  };

  // Get guider's current location (mock - replace with actual)
  const guiderLocation = { lat: 31.5204, lng: 74.3587 }; // Lahore default

  // ✅ NEW: jo list dikhani hai, active tab ke hisaab se
  const visibleList = activeTab === "active" ? emergencies : acceptedEmergencies;

  if (loading) {
    return (
      <div className="emergency-loading">
        <div className="spinner"></div>
        <p>Loading emergencies...</p>
      </div>
    );
  }

  return (
    <div className="guider-emergency-page">
      <div className="emergency-header">
        <h1>
          <i className="fa-solid fa-truck-medical"></i> Emergency Requests
        </h1>
        <p>Hunters near your area who need urgent assistance</p>
      </div>

      {/* ✅ NEW: Active / Accepted tabs */}
      <div className="emergency-tabs" style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            background: activeTab === "active" ? "#b6b14a" : "#eee",
            color: activeTab === "active" ? "#fff" : "#333",
          }}
        >
          Active {emergencies.length > 0 && `(${emergencies.length})`}
        </button>
        <button
          onClick={() => setActiveTab("accepted")}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            background: activeTab === "accepted" ? "#b6b14a" : "#eee",
            color: activeTab === "accepted" ? "#fff" : "#333",
          }}
        >
          Accepted {acceptedEmergencies.length > 0 && `(${acceptedEmergencies.length})`}
        </button>
      </div>

      {visibleList.length === 0 ? (
        <div className="no-emergencies">
          <i className="fa-solid fa-check-circle"></i>
          <h3>{activeTab === "active" ? "No Active Emergencies" : "No Accepted Emergencies"}</h3>
          <p>
            {activeTab === "active"
              ? "All clear! No emergency requests at the moment."
              : "You haven't accepted any emergency requests yet."}
          </p>
        </div>
      ) : (
        <div className="emergencies-list">
          {visibleList.map((emergency) => {
            const distance = getDistance(
              guiderLocation.lat, guiderLocation.lng,
              emergency.latitude, emergency.longitude
            );
            const isAcceptedTab = activeTab === "accepted"; // ✅ NEW

            return (
              <div key={emergency.id} className="emergency-card">
                <div className="emergency-card-header">
                  <div className="emergency-icon">
                    <i className="fa-solid fa-circle-exclamation"></i>
                  </div>
                  <div className="emergency-status">
                    {/* ✅ NEW: accepted tab mein "ACCEPTED" badge dikhao, urgent nahi */}
                    <span className={`status-badge ${isAcceptedTab ? "accepted" : "urgent"}`}>
                      {isAcceptedTab ? "ACCEPTED" : "URGENT"}
                    </span>
                    <span className="distance-badge">
                      <i className="fa-solid fa-location-dot"></i> {distance} km away
                    </span>
                  </div>
                </div>

                <div className="emergency-card-body">
                  <h3>{emergency.hunter_name || "Unknown Hunter"}</h3>
                  <div className="emergency-details">
                    <div className="detail-item">
                      <i className="fa-solid fa-phone"></i>
                      <span>{emergency.hunter_phone || "No phone"}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fa-regular fa-clock"></i>
                      <span>{new Date(emergency.created_at).toLocaleString()}</span>
                    </div>
                    {/* ✅ NEW: accepted tab mein accept hone ka time bhi dikhao */}
                    {isAcceptedTab && emergency.accepted_at && (
                      <div className="detail-item">
                        <i className="fa-solid fa-check-circle"></i>
                        <span>Accepted: {new Date(emergency.accepted_at).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <i className="fa-solid fa-location-crosshairs"></i>
                      <span 
                        className="location-link"
                        onClick={() => openLocationModal(emergency)}
                      >
                        View Location →
                      </span>
                    </div>
                    {emergency.location_text && (
                      <div className="detail-item">
                        <i className="fa-solid fa-location-dot"></i>
                        <span>{emergency.location_text}</span>
                      </div>
                    )}
                  </div>

                  <div className="emergency-message">
                    <i className="fa-solid fa-message"></i>
                    <p>
                      {isAcceptedTab
                        ? "✅ You accepted this request. Hunter has been notified."
                        : "🚨 Emergency assistance needed immediately!"}
                    </p>
                  </div>
                </div>

                {/* ✅ NEW: Accepted tab mein Accept/Reject buttons mat dikhao,
                    sirf Auto Call aur location options dikhao */}
                <div className="emergency-card-footer">
                  {!isAcceptedTab && (
                    <>
                      <button 
                        className="accept-btn"
                        onClick={() => handleResponse(emergency.id, "accept", currentUser.name)}
                      >
                        <i className="fa-solid fa-check"></i> Accept & Respond
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleResponse(emergency.id, "reject", currentUser.name)}
                      >
                        <i className="fa-solid fa-times"></i> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && selectedEmergency && (
        <div className="location-modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="location-modal-header">
              <h3>
                <i className="fa-solid fa-location-dot"></i> Hunter Location
              </h3>
              <button className="close-modal" onClick={() => setShowLocationModal(false)}>
                ✕
              </button>
            </div>
            <div className="location-modal-body">
              <div className="location-coordinates">
                <div className="coord-box">
                  <label>Latitude</label>
                  <p>{selectedEmergency.latitude}</p>
                </div>
                <div className="coord-box">
                  <label>Longitude</label>
                  <p>{selectedEmergency.longitude}</p>
                </div>
              </div>
              <div className="location-map-link">
                <a 
                  href={`https://www.google.com/maps?q=${selectedEmergency.latitude},${selectedEmergency.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  <i className="fa-solid fa-map"></i> Open in Google Maps
                </a>
              </div>
              <div className="location-actions">
                <button 
                  className="navigate-btn"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedEmergency.latitude},${selectedEmergency.longitude}`, "_blank")}
                >
                  <i className="fa-solid fa-car"></i> Get Directions
                </button>
                <button 
                  className="share-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://www.google.com/maps?q=${selectedEmergency.latitude},${selectedEmergency.longitude}`
                    );
                    alert("Location link copied!");
                  }}
                >
                  <i className="fa-solid fa-share"></i> Share Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuiderEmergency;