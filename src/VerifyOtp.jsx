import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./VerifyOtp.css";

function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/reset-password?token=${data.token}&email=${encodeURIComponent(email)}`);
      } else {
        setMessage("❌ " + (data.message || "Invalid OTP"));
      }
    } catch (err) {
      setMessage("❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-otp-page">
      <div className="verify-container">

        <img src="/wild aura logo.png" alt="Wild Aura Logo" className="verify-logo" />

        <h2>Enter OTP</h2>

        <p className="verify-subtitle">
          OTP has been sent to: <strong>{email}</strong>
        </p>

        {message && (
          <div className={`verify-message ${message.startsWith("✅") ? "success" : ""}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <input
            type="text"
            required
            placeholder="6-digit OTP"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value)}
            className="otp-input"
          />

          <button type="submit" disabled={loading} className="verify-btn">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="resend-link">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/forgotpassword"); }}>
            ← Resend OTP
          </a>
        </p>

      </div>
    </div>
  );
}

export default VerifyOtp;