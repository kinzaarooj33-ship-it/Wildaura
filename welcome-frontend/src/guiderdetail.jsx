import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import TripScheduleModal from "./TripScheduleModal";
import "./guiderdetail.css";

function GuiderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guider, setGuider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isGuest = localStorage.getItem("isGuest") === "true";

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/guiders/${id}`)
      .then((res) => { 
        setGuider(res.data.guider); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleGuestBlock = () => {
    if (isGuest) { 
      setShowLoginPopup(true); 
      return true; 
    }
    return false;
  };

  const handleBookNow = () => {
    if (handleGuestBlock()) return;
    setShowTripModal(true);
  };

  const handleGiveFeedback = () => {
    if (handleGuestBlock()) return;
    navigate("/feedback", {
      state: { to_email: guider.email, to_role: "guider", to_name: guider.name }
    });
  };

  const handleViewFeedback = () => {
    if (handleGuestBlock()) return;
    navigate("/feedbackview", {
      state: { email: guider.email, role: "guider" }
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="gd-page">
          <div className="gd-container">
            <div className="gd-loading">
              <div className="gd-spinner"></div>
              <p>Loading guider details...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!guider) {
    return (
      <>
        <Navbar />
        <div className="gd-page">
          <div className="gd-container">
            <div className="gd-loading">
              <p>No Guider Found!</p>
              <div className="gd-back-wrap">
                <button className="gd-back-btn" onClick={() => navigate(-1)}>
                  <i className="fa-solid fa-arrow-left"></i> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* LOGIN POPUP */}
      {showLoginPopup && (
        <div className="popup-overlay" onClick={() => setShowLoginPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <div className="popup-icon">🔒</div>
            <h3>Login Required</h3>
            <p>Please login first to book a guider!</p>
            <div className="popup-buttons">
              <button className="popup-login-btn" onClick={() => navigate("/login")}>
                Login Now
              </button>
              <button className="popup-cancel-btn" onClick={() => setShowLoginPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTripModal && (
        <TripScheduleModal
          guider={guider}
          hunter={currentUser}
          onClose={() => setShowTripModal(false)}
        />
      )}

      <div className="gd-page">
        <div className="gd-container">
          {/* Back Button - aligned with card's left edge */}
        

          <div className="gd-card">
            {/* LEFT PANEL */}
        
            <div className="gd-left">
                         <button
  className="gd-back-btn"
  onClick={() => navigate(-1)}
>
  <i className="fa-solid fa-arrow-left"></i>
  Back
</button>
              <div className="gd-photo-wrap">
                {guider.profile_image ? (
                  <img 
                    src={`http://localhost:3000/uploads/${guider.profile_image}`} 
                    alt={guider.name} 
                    className="gd-photo" 
                  />
                ) : (
                  <div className="gd-photo-placeholder">
                    <i className="fa-solid fa-user-tie"></i>
                  </div>
                )}
              </div>

              <span className="gd-avail-badge available">
                <i className="fa-solid fa-circle-check"></i> Available
              </span>

              <div className="gd-buttons">
                <button className="gd-book-btn" onClick={handleBookNow}>
                  <i className="fa-solid fa-calendar-check"></i> Book Now
                </button>
                <button className="gd-feedback-btn" onClick={handleGiveFeedback}>
                  <i className="fa-solid fa-pen-to-square"></i> Give Feedback
                </button>
                <button className="gd-viewfb-btn" onClick={handleViewFeedback}>
                  <i className="fa-solid fa-comments"></i> View Feedback
                </button>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="gd-right">
              <h1 className="gd-name">{guider.name}</h1>
              <p className="gd-role-tag">Professional Hunting Guider</p>
              <div className="gd-divider"></div>
              
              <div className="gd-info-grid">
                <div className="gd-info-item">
                  <div className="gd-info-icon">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div>
                    <span className="gd-info-label">Address</span>
                    <span className="gd-info-value">{guider.address || "—"}</span>
                  </div>
                </div>

                <div className="gd-info-item">
                  <div className="gd-info-icon">
                    <i className="fa-solid fa-map"></i>
                  </div>
                  <div>
                    <span className="gd-info-label">Province</span>
                    <span className="gd-info-value">{guider.province || "—"}</span>
                  </div>
                </div>

                <div className="gd-info-item">
                  <div className="gd-info-icon">
                    <i className="fa-solid fa-crosshairs"></i>
                  </div>
                  <div>
                    <span className="gd-info-label">Specialization</span>
                    <span className="gd-info-value">{guider.specialization || "—"}</span>
                  </div>
                </div>

                <div className="gd-info-item">
                  <div className="gd-info-icon">
                    <i className="fa-solid fa-briefcase"></i>
                  </div>
                  <div>
                    <span className="gd-info-label">Experience</span>
                    <span className="gd-info-value">{guider.guiding_experience ? `${guider.guiding_experience} Years` : "—"}</span>
                  </div>
                </div>

                <div className="gd-info-item">
                  <div className="gd-info-icon">
                    <i className="fa-solid fa-money-bill-wave"></i>
                  </div>
                  <div>
                    <span className="gd-info-label">Price Per Hour</span>
                    <span className="gd-info-value">{guider.price_per_hour ? `PKR ${Number(guider.price_per_hour).toLocaleString()}/hr` : "—"}</span>
                  </div>
                </div>

                <div className="gd-info-item">
                  <div className="gd-info-icon">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div>
                    <span className="gd-info-label">Phone</span>
                    <span className="gd-info-value">{guider.phone_number || "—"}</span>
                  </div>
                </div>

                <div className="gd-info-item">
                  <div className="gd-info-icon">
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div>
                    <span className="gd-info-label">Email</span>
                    <span className="gd-info-value">{guider.email || "—"}</span>
                  </div>
                </div>

                <div className="gd-info-item">
                  <div className="gd-info-icon">
                    <i className="fa-solid fa-id-card"></i>
                  </div>
                  <div>
                    <span className="gd-info-label">License No.</span>
                    <span className="gd-info-value">{guider.license_number || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GuiderDetail;