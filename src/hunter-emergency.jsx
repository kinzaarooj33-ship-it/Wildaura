import { useState, useEffect } from "react";
import axios from "axios";
import "./hunter-emergency.css";

function HunterEmergency({ onClose }) {
  const [step, setStep] = useState("confirm");
  const [location, setLocation] = useState(null);
  const [locationText, setLocationText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [timer, setTimer] = useState(300);
  const [timerInterval, setTimerInterval] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    return () => { if (timerInterval) clearInterval(timerInterval); };
  }, [timerInterval]);

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getLocation = () => {
    setStep("locating");

    // ✅ Browser support check
    if (!navigator.geolocation) {
      setErrorMsg("Your browser does not support location. Please use Chrome or Firefox.");
      setStep("error");
      return;
    }

    // ✅ HTTPS check — localhost pe bhi kaam karta hai
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost";
    if (!isSecure) {
      setErrorMsg("Location access only works on HTTPS or localhost.");
      setStep("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.address;
          const text = [
            addr.village || addr.town || addr.city || addr.county,
            addr.state,
            addr.country
          ].filter(Boolean).join(", ");
          setLocationText(text);
          sendEmergency(latitude, longitude, text);
        } catch {
          const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocationText(fallback);
          sendEmergency(latitude, longitude, fallback);
        }
      },
      (err) => {
        // ✅ Har error code ka alag clear message
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            setErrorMsg(
              "Location permission is denied. Please follow these steps:\n\n" +
              "1. Click the 🔒 icon in the browser address bar\n" +
              "2. Set 'Location' to 'Allow'\n" +
              "3. Refresh the page and try again"
            );
            break;
          case 2: // POSITION_UNAVAILABLE
            setErrorMsg(
              "Your location could not be detected. Please turn on GPS or connect to WiFi and try again."
            );
            break;
          case 3: // TIMEOUT
            setErrorMsg(
              "Location request timed out. GPS signal is weak — please go outside or try again."
            );
            break;
          default:
            setErrorMsg("A location error occurred. Please try again.");
        }
        setStep("error");
      },
      {
        // ✅ FIX: enableHighAccuracy false — laptops mein dedicated GPS chip
        // nahi hoti, high accuracy mode GPS dhoondhne ki koshish karta hai
        // aur timeout ho jata hai. False karne se browser WiFi/IP-based
        // location estimate use karta hai jo laptops par kaam karta hai
        // aur zyada tez milta hai (mobile par bhi chalega, bas thora kam precise).
        timeout: 30000,        // ✅ FIX: 15s se 30s — WiFi-lookup ko zyada waqt
        enableHighAccuracy: false,
        maximumAge: 60000       // ✅ FIX: 1 min purani cached location bhi chale, fast response
      }
    );
  };

  const sendEmergency = async (lat, lng, locText) => {
    setStep("sending");
    try {
      const res = await axios.post("http://localhost:3000/api/emergency/send", {
        hunter_id: currentUser.id,
        hunter_name: currentUser.name || currentUser.email,
        hunter_email: currentUser.email,
        hunter_phone: currentUser.phone_number || null,
        latitude: lat,
        longitude: lng,
        location_text: locText,
      });
      if (res.data.success) {
        setNotifiedCount(res.data.notified || 0);
        setStep("sent");
        startTimer();
      } else {
        throw new Error("Server se success nahi aaya");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "";
      if (err?.code === "ERR_NETWORK") {
        setErrorMsg("Cannot connect to server. Is the backend running? (localhost:3000)");
      } else if (msg) {
        setErrorMsg("Emergency could not be sent: " + msg);
      } else {
        setErrorMsg("Emergency could not be sent. Please try again.");
      }
      setStep("error");
    }
  };

  // ── CONFIRM ──────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="hem-overlay" onClick={onClose}>
        <div className="hem-box" onClick={e => e.stopPropagation()}>
          <div className="hem-icon">🚨</div>
          <h2>Emergency Alert</h2>
          <p>This will share your <strong>current location</strong> with nearby guiders and send an emergency request.</p>
          <p className="hem-warn">Only use this in a real emergency situation.</p>
          <div className="hem-btns">
            <button className="hem-send-btn" onClick={getLocation}>
              📍 Share Location & Send Alert
            </button>
            <button className="hem-cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOCATING ─────────────────────────────────────────────────
  if (step === "locating") {
    return (
      <div className="hem-overlay">
        <div className="hem-box">
          <div className="hem-spinner"></div>
          <h2>Getting Your Location...</h2>
          <p>Please allow location access when prompted.</p>
          <p style={{ fontSize: "0.85rem", color: "#aaa", marginTop: "8px" }}>
            If a popup appears, click "Allow"
          </p>
        </div>
      </div>
    );
  }

  // ── SENDING ──────────────────────────────────────────────────
  if (step === "sending") {
    return (
      <div className="hem-overlay">
        <div className="hem-box">
          <div className="hem-spinner red"></div>
          <h2>Sending Emergency Alert...</h2>
          <p>Finding nearby guiders and sending alerts.</p>
          {locationText && (
            <div className="hem-loc-chip">
              <i className="fa-solid fa-location-dot"></i> {locationText}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── SENT ─────────────────────────────────────────────────────
  if (step === "sent") {
    return (
      <div className="hem-overlay" onClick={onClose}>
        <div className="hem-box success" onClick={e => e.stopPropagation()}>
          <div className="hem-success-icon">✅</div>
          <h2>Emergency Alert Sent!</h2>
          <div className="hem-loc-chip">
            <i className="fa-solid fa-location-dot"></i> {locationText}
          </div>
          <div className="hem-stats">
            <div className="hem-stat">
              <span className="hem-stat-val">{notifiedCount}</span>
              <span className="hem-stat-label">Guiders Notified</span>
            </div>
            <div className="hem-stat">
              <span className="hem-stat-val">{formatTime(timer)}</span>
              <span className="hem-stat-label">Broadcast Timer</span>
            </div>
          </div>
          <div className="hem-info-list">
            <div className="hem-info-item">
              <i className="fa-solid fa-circle-check"></i>
              Nearby guiders have been notified
            </div>
            <div className="hem-info-item">
              <i className="fa-solid fa-bell"></i>
              You'll be notified when a guider responds
            </div>
            <div className="hem-info-item">
              <i className="fa-solid fa-broadcast-tower"></i>
              {timer > 0
                ? `If no response in ${formatTime(timer)}, ALL guiders will be alerted`
                : "⚠️ Broadcasting to ALL guiders now!"}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${location?.latitude},${location?.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hem-map-btn"
          >
            <i className="fa-brands fa-google"></i> View My Location on Map
          </a>
          <button className="hem-cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="hem-overlay" onClick={onClose}>
        <div className="hem-box" onClick={e => e.stopPropagation()}>
          <div className="hem-icon">⚠️</div>
          <h2>Location Error</h2>
          {/* ✅ whiteSpace: pre-line se newlines bhi show honge */}
          <p style={{ whiteSpace: "pre-line", textAlign: "left", fontSize: "0.9rem" }}>
            {errorMsg}
          </p>
          <div className="hem-btns">
            <button className="hem-send-btn" onClick={getLocation}>
              Try Again
            </button>
            <button className="hem-cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default HunterEmergency;