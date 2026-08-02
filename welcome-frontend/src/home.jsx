import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HunterEmergency from "./hunter-emergency";
import "./home.css";
import Navbar from "./components/Navbar";

function Home() {
  const [showEmergency, setShowEmergency] = useState(false);
  const navigate  = useNavigate();
  const isGuest   = localStorage.getItem("isGuest") === "true";
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const handleGuestBlock = () => {
    if (isGuest) { setShowLoginPopup(true); return true; }
    return false;
  };

  return (
    <div className="home-page" id="home-top">

      {/* ── Unified Navbar ── */}
      <Navbar />

      {/* Emergency Modal */}
      {showEmergency && (
        <HunterEmergency onClose={() => setShowEmergency(false)} />
      )}

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="popup-overlay" onClick={() => setShowLoginPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h3>🔒 Login Required</h3>
            <p>Please login first to access this feature.</p>
            <div className="popup-buttons">
              <button className="popup-login-btn" onClick={() => navigate("/login")}>Login</button>
              <button className="popup-cancel-btn" onClick={() => setShowLoginPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-text">
          <h1>Your Ultimate<br />Hunting Companion</h1>
          <p>Explore the wild, hunt with confidence, stay safe always.</p>
        </div>
        <div className="hero-buttons">
          <button
            className="btn-primary"
            onClick={() => { if (handleGuestBlock()) return; navigate("/guiders"); }}
          >
            Book Guider
          </button>
          <button
            className="btn-secondary"
            onClick={() => { if (handleGuestBlock()) return; setShowEmergency(true); }}
          >
            Emergency
          </button>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="why">
        <div className="why-container">
          <h2>Why Choose Us?</h2>
          <div className="why-boxes">
            <div className="why-box"><span className="icon">🛡️</span><p>Safe & Trusted Platform</p></div>
            <div className="why-box"><span className="icon">🚨</span><p>One Tap Emergency Support</p></div>
            <div className="why-box"><span className="icon">🧑</span><p>Professional Guider</p></div>
            <div
              className="why-box"
              style={{ cursor: "pointer" }}
              onClick={() => { if (handleGuestBlock()) return; navigate("/trip-schedule"); }}
            >
              <span className="icon">📅</span><p>Easy Trip Schedule</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED HUNTING AREAS ── */}
      <section className="areas">
        <div className="area-container">
          <h2>Featured Hunting Areas</h2>
          <div className="areas-grid">
            <div className="area-card">
              <div className="area-img">🏔️</div>
              <h3>Chitral Valley</h3>
              <p>Snow leopard & Markhor territory in the north.</p>
              <button onClick={() => navigate("/hunting-areas/2")}>Explore</button>
            </div>
            <div className="area-card">
              <div className="area-img">🌿</div>
              <h3>Thal Desert</h3>
              <p>Chinkara & migratory birds in the south.</p>
              <button onClick={() => navigate("/hunting-areas/3")}>Explore</button>
            </div>
            <div className="area-card">
              <div className="area-img">🦅</div>
              <h3>Zhob Wildlife</h3>
              <p>Urial & Houbara bustard hunting zones.</p>
              <button onClick={() => navigate("/hunting-areas/14")}>Explore</button>
            </div>
            <div className="area-card">
              <div className="area-img">🌲</div>
              <h3>Swat Game Reserve</h3>
              <p>Dense forests with rich wildlife diversity.</p>
              <button onClick={() => navigate("/hunting-areas/12")}>Explore</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP GUIDERS ── */}
      <section className="guiders">
        <div className="guider-container">
          <h2>Top Guiders</h2>
          <div className="guiders-grid">
            <div className="guider-card">
              <div className="guider-avatar">👤</div>
              <h3>Ahmad Khan</h3>
              <p>⭐ 4.9 | Chitral Expert</p>
              <button onClick={() => { if (handleGuestBlock()) return; navigate("/guiders"); }}>Book Now</button>
            </div>
            <div className="guider-card">
              <div className="guider-avatar">👤</div>
              <h3>Bilal Raza</h3>
              <p>⭐ 4.8 | Balochistan Expert</p>
              <button onClick={() => { if (handleGuestBlock()) return; navigate("/guiders"); }}>Book Now</button>
            </div>
            <div className="guider-card">
              <div className="guider-avatar">👤</div>
              <h3>Usman Ali</h3>
              <p>⭐ 4.7 | Swat Expert</p>
              <button onClick={() => { if (handleGuestBlock()) return; navigate("/guiders"); }}>Book Now</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUCCESS STORIES ── */}
      <section className="stories">
        <div className="stories-container">
          <h2>Latest Success Stories</h2>
          <div className="stories-grid">
            <div className="story-card">
              <span className="story-icon">🏆</span>
              <h3>First Markhor Hunt</h3>
              <p>"Amazing experience with Wild Aura. The guider was professional and the trip was unforgettable!"</p>
              <span className="story-author">— Kamran, Lahore</span>
            </div>
            <div className="story-card">
              <span className="story-icon">🦅</span>
              <h3>Houbara Bustard Trip</h3>
              <p>"Best hunting trip of my life. Wild Aura made everything so easy and safe."</p>
              <span className="story-author">— Tariq, Karachi</span>
            </div>
            <div className="story-card">
              <span className="story-icon">🌄</span>
              <h3>Chitral Adventure</h3>
              <p>"The emergency support feature gave us confidence throughout the trip."</p>
              <span className="story-author">— Zaid, Islamabad</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-header">
            <img src="/wild aura logo.png" alt="Wild Aura Logo" className="footer-logo" />
            <h3>A Pakistani Wildlife & Ethical<br />Hunting Experience</h3>
          </div>
          <p className="footer-desc">
            Discover unforgettable hunting adventures across Pakistan's breathtaking landscapes —
            from northern mountains to rugged deserts. Wild Aura blends ethics, conservation
            awareness and a premium hunting experience curated just for true adventurers.
          </p>
          <div className="footer-links-section">
            <div className="footer-column">
              <h4>Useful Links</h4>
              <ul>
                <li>
                  <a
                    onClick={() => document.getElementById("home-top").scrollIntoView({ behavior: "smooth" })}
                    style={{ cursor: "pointer" }}
                  >
                    Home
                  </a>
                </li>
                <li><a onClick={() => navigate("/species-info")} style={{ cursor: "pointer" }}>Species</a></li>
                <li><a onClick={() => navigate("/hunting-areas")} style={{ cursor: "pointer" }}>Hunting Areas</a></li>
                <li><a onClick={() => { if (handleGuestBlock()) return; navigate("/guiders"); }} style={{ cursor: "pointer" }}>Guiders</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Contact Us</h4>
              <ul>
                <li><i className="fa-regular fa-envelope"></i><span>info@wildaura.com</span></li>
                <li><i className="fa-solid fa-phone"></i><span>+92-xxx-xxxxxxx</span></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Wild Aura. All Rights Reserved</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Home;