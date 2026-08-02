import React, { useState } from "react";
import "./forgotpassword.css";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage("❌ " + data.message);
        return;
      }

      // ✅ Sirf email bhejo URL mein — OTP nahi
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);

    } catch (err) {
      setMessage("❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="container">
        <div className="logo">
          <img src="/wild aura logo.png" alt="Wild Aura Logo" />
        </div>

        <h2>Forgot Password?</h2>
        <p className="subtitle">Enter your email to reset password</p>

        {message && (
          <div className="message" style={{ color: "red" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              required
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email Address</label>
            <i className="fa-solid fa-envelope"></i>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Sending..." : "Continue"}
          </button>
        </form>

        <p className="back-link">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
            ← Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;