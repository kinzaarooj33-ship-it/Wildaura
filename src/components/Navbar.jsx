import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import HunterNotifications from "../hunter-notifications";
import HunterEmergency from "../hunter-emergency";
import TripScheduleView from "../TripScheduleView";
import "./Navbar.css";

function Navbar() {
  const [exploreOpen, setExploreOpen]         = useState(false);
  const [userOpen, setUserOpen]               = useState(false);
  const [showLoginPopup, setShowLoginPopup]   = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ── Modals ──
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmergency, setShowEmergency]         = useState(false);
  const [showTripSchedule, setShowTripSchedule]   = useState(false);

  // ── TripScheduleView initial tab (notifications se set hoga) ──
  const [tripScheduleInitialTab, setTripScheduleInitialTab] = useState("bookings");

  // ── Unread badge ──
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate   = useNavigate();
  const exploreRef = useRef(null);
  const userRef    = useRef(null);

  const user    = JSON.parse(localStorage.getItem("user") || "null");
  const isGuest = !user && localStorage.getItem("isGuest") === "true";
  const email   = user?.email;

  // ── Fetch unread count ──
  useEffect(() => {
    if (!isGuest && email) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchUnreadCount = () => {
    axios
      .get(`http://localhost:3000/api/notifications/unread-count/${email}/hunter`)
      .then((res) => setUnreadCount(res.data?.count || 0))
      .catch(() => {});
  };

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target))
        setExploreOpen(false);
      if (userRef.current && !userRef.current.contains(e.target))
        setUserOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGuestBlock = () => {
    if (isGuest) { setShowLoginPopup(true); return true; }
    return false;
  };

  const closeAll = () => {
    setExploreOpen(false);
    setUserOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isGuest");
    navigate("/");
  };

  // ── Called from HunterNotifications when booking notification clicked ──
  const handleOpenTripSchedule = (tab = "bookings") => {
    setShowNotifications(false);   // notification modal band karo
    setTripScheduleInitialTab(tab);
    setShowTripSchedule(true);     // trip schedule modal kholo
  };

  return (
    <>
      {/* ══════════ MODALS ══════════ */}

      {/* Notifications Modal */}
      {showNotifications && (
        <HunterNotifications
          onClose={() => {
            setShowNotifications(false);
            fetchUnreadCount();
          }}
          onOpenTripSchedule={handleOpenTripSchedule}  // ← naya prop
        />
      )}

      {/* Emergency Modal */}
      {showEmergency && (
        <HunterEmergency onClose={() => setShowEmergency(false)} />
      )}

      {/* Trip Schedule Modal */}
      {showTripSchedule && (
        <TripScheduleView
          initialTab={tripScheduleInitialTab}          // ← initial tab pass
          onClose={() => {
            setShowTripSchedule(false);
            setTripScheduleInitialTab("bookings");     // reset
          }}
        />
      )}

      {/* Login Required Popup */}
      {showLoginPopup && (
        <div className="popup-overlay" onClick={() => setShowLoginPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h3>🔒 Login Required</h3>
            <p>Please login first to access this feature.</p>
            <div className="popup-buttons">
              <button className="popup-login-btn" onClick={() => navigate("/login")}>
                Login
              </button>
              <button className="popup-cancel-btn" onClick={() => setShowLoginPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutModal && (
        <div className="popup-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>
              Are you sure you want to log out? You will need to log in again to
              access your dashboard.
            </p>
            <div className="popup-buttons">
              <button className="popup-login-btn" onClick={handleLogout}>
                Yes, Logout
              </button>
              <button className="popup-cancel-btn" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="navbar">
        {/* Logo */}
        <div className="nav-left">
          <img src="/wild aura logo.png" alt="Logo" className="logo" />
        </div>

        {/* Nav Links */}
        <ul className="nav-center">

          <li>
            <a onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>
              <i className="fa-solid fa-house"></i> Home
            </a>
          </li>

          <li className="dropdown" ref={exploreRef}>
            <span
              onClick={() => { setExploreOpen(!exploreOpen); setUserOpen(false); }}
              style={{ cursor: "pointer" }}
            >
              <i className="fa-solid fa-compass"></i> Explore ▾
            </span>
            {exploreOpen && (
              <ul className="dropdown-menu">
                <li onClick={() => { setExploreOpen(false); navigate("/species-info"); }}>
                  <a><i className="fa-solid fa-paw"></i> Species Info</a>
                </li>
                <li onClick={() => { setExploreOpen(false); navigate("/weapon-info"); }}>
                  <a><i className="fa-solid fa-gun"></i> Weapon Info</a>
                </li>
                <li onClick={() => { setExploreOpen(false); navigate("/hunting-areas"); }}>
                  <a><i className="fa-solid fa-map-location-dot"></i> Hunting Areas</a>
                </li>
                <li onClick={() => { setExploreOpen(false); navigate("/resort"); }}>
                  <a><i className="fa-solid fa-hotel"></i> Resort Info</a>
                </li>
                <li onClick={() => { setExploreOpen(false); if (handleGuestBlock()) return; navigate("/guider-detail"); }}>
                  <a><i className="fa-solid fa-user-shield"></i> Guider Detail</a>
                </li>
                <li onClick={() => { setExploreOpen(false); navigate("/hunting-laws"); }}>
                  <a><i className="fa-solid fa-scale-balanced"></i> Hunting Laws</a>
                </li>
              </ul>
            )}
          </li>

          <li onClick={() => { if (handleGuestBlock()) return; closeAll(); navigate("/success-stories"); }}>
            <a style={{ cursor: "pointer" }}>
              <i className="fa-solid fa-trophy"></i> Success Story
            </a>
          </li>

          <li onClick={() => { if (handleGuestBlock()) return; closeAll(); navigate("/feedback"); }}>
            <a style={{ cursor: "pointer" }}>
              <i className="fa-solid fa-comment-dots"></i> Feedback
            </a>
          </li>

          <li onClick={() => { if (handleGuestBlock()) return; closeAll(); setShowNotifications(true); }}>
            <a style={{ cursor: "pointer" }}>
              <span className="nav-notif-wrap" style={{ marginRight: "6px" }}>
                <i className="fa-solid fa-bell"></i>
                {/* ✅ FIX: chota number badge, bilkul bell ke upar */}
                {unreadCount > 0 && (
                  <span className="nav-notif-badge">{unreadCount}</span>
                )}
              </span>
              Notifications
            </a>
          </li>

          <li onClick={() => { if (handleGuestBlock()) return; closeAll(); setShowEmergency(true); }}>
            <a style={{ cursor: "pointer" }}>
              <i className="fa-solid fa-triangle-exclamation"></i> Emergency
            </a>
          </li>

        </ul>

        {/* User Dropdown */}
        <div className="nav-right dropdown" ref={userRef}>
          <img
            src="/user1.png"
            className="user-icon"
            alt="User"
            onClick={() => {
              if (handleGuestBlock()) return;
              setUserOpen(!userOpen);
              setExploreOpen(false);
            }}
          />
          {userOpen && (
            <ul className="dropdown-menu right">
              <li onClick={() => { setUserOpen(false); navigate("/my-profile"); }}>
                <a><i className="fa-solid fa-user"></i> My Profile</a>
              </li>
              <li onClick={() => { setUserOpen(false); navigate("/saved-species"); }}>
                <a><i className="fa-solid fa-bookmark"></i> My Collection</a>
              </li>
              <li onClick={() => { setUserOpen(false); setTripScheduleInitialTab("bookings"); setShowTripSchedule(true); }}>
                <a><i className="fa-solid fa-calendar-days"></i> Trip Schedule</a>
              </li>
              <li onClick={() => { setUserOpen(false); setShowLogoutModal(true); }}>
                <a><i className="fa-solid fa-right-from-bracket"></i> Log out</a>
              </li>
            </ul>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;