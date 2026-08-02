import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/.test(password)) {
      setMessage("❌ Password must be 8+ chars with uppercase, lowercase & number!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000); // ✅ 2 sec mein login par
      } else {
        setMessage("❌ " + (data.message || "Invalid or expired code"));
      }
    } catch (err) {
      setMessage("❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      justifyContent: "center", alignItems: "center",
      fontFamily: "Arial, sans-serif", padding: "20px",
    }}>
      <div style={{
        backgroundColor: "white", width: "100%", maxWidth: "450px",
        padding: "50px 40px", borderRadius: "10px",
        boxShadow: "0 0 25px #b6b14a", boxSizing: "border-box",
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
      }}>
        <img src="/wild aura logo.png" alt="Wild Aura Logo"
          style={{ width: "80px", marginBottom: "10px" }} />

        <h2 style={{ fontSize: "24px", marginBottom: "2px", color: "#333" }}>Reset Password</h2>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "30px" }}>Enter your new password</p>

        {message && (
          <div style={{
            padding: "12px", borderRadius: "5px", marginBottom: "20px",
            fontSize: "14px", width: "100%", boxSizing: "border-box",
            backgroundColor: message.startsWith("✅") ? "#e6ffe6" : "#ffe6e6",
            color: message.startsWith("✅") ? "green" : "red",
            border: message.startsWith("✅") ? "1px solid green" : "1px solid red",
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>

          {/* New Password */}
          <div style={{ position: "relative", marginBottom: "25px" }}>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%", padding: "12px 40px 12px 15px",
                border: "2px solid #ddd", borderRadius: "5px",
                fontSize: "14px", outline: "none", boxSizing: "border-box",
              }}
            />
            <label style={{
              position: "absolute", left: "15px",
              top: "50%", transform: "translateY(-50%)",
              fontSize: "14px", color: "#b6b14a", background: "white",
              padding: "0 5px", pointerEvents: "none",
            }}>New Password</label>
            <i
              className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#999", cursor: "pointer" }}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ position: "relative", marginBottom: "25px" }}>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%", padding: "12px 40px 12px 15px",
                border: "2px solid #ddd", borderRadius: "5px",
                fontSize: "14px", outline: "none", boxSizing: "border-box",
              }}
            />
            <label style={{
              position: "absolute", left: "15px",
              top: "50%", transform: "translateY(-50%)",
              fontSize: "14px", color: "#b6b14a", background: "white",
              padding: "0 5px", pointerEvents: "none",
            }}>Confirm Password</label>
            <i className="fa-solid fa-lock"
              style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px",
            backgroundColor: loading ? "#ccc" : "#b6b14a",
            color: "white", border: "none", borderRadius: "40px",
            fontSize: "16px", fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "10px",
          }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p style={{ marginTop: "25px", fontSize: "14px" }}>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}
            style={{ color: "#b6b14a", textDecoration: "none", fontWeight: "bold" }}>
            ← Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;