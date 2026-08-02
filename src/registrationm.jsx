import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./registrationm.css";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", success: false });

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Login page se jo role aaya wo lo, default hunter
  const role = location.state?.role || "hunter";

  const validateEmail = (email) => {
    const noDigitAtStart = /^[a-zA-Z][a-zA-Z0-9.]+@/;
    const gmailOrYahoo = /^[a-zA-Z0-9.]+@(gmail\.com|yahoo\.com)$/;
    if (!noDigitAtStart.test(email)) {
      return "digit_start";
    }
    if (!gmailOrYahoo.test(email)) {
      return "invalid_domain";
    }
    return "valid";
  };

  const validatePassword = (password) => {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    return pattern.test(password);
  };

  const showPopup = (message, success) => {
    setPopup({ show: true, message, success });
    if (!success) {
      setTimeout(() => setPopup({ show: false, message: "", success: false }), 6000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Invalid symbol check
    const invalidSymbols = /[^a-zA-Z0-9.@]/g;
    const found = email.match(invalidSymbols);
    if (found) {
      const unique = [...new Set(found)].join(" ");
      showPopup(`Symbol "${unique}" Not Allowed!`, false);
      return;
    }

    const emailCheck = validateEmail(email);
    if (emailCheck === "digit_start") {
      showPopup("Email must start with a letter! (e.g. name@gmail.com)", false);
      return;
    }
    if (emailCheck === "invalid_domain") {
      showPopup("Only Gmail or Yahoo email allowed! (e.g. name@gmail.com or name@yahoo.com)", false);
      return;
    }

    if (!validatePassword(password)) {
      showPopup("Password must be 8+ characters with uppercase, lowercase & number!", false);
      return;
    }

    if (password !== confirmPassword) {
      showPopup("Passwords do not match!", false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          role: role, // ✅ hardcoded "user" ki jagah actual role
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", role); // ✅ role save

        // ✅ Success popup manually handle
        setPopup({ show: true, message: "Successfully registered! Redirecting to login...", success: true });

        setTimeout(() => {
          setPopup({ show: false, message: "", success: false });

          // ✅ Role ke hisaab se login page pe redirect
          if (role === "guider") {
            navigate("/login", { state: { role: "guider" } });
          } else {
            navigate("/login", { state: { role: "hunter" } });
          }
        }, 2000);

      } else if (res.status === 409) {
        showPopup("This email is already registered! Please login.", false);
      } else {
        showPopup(data.message || "Something went wrong! Try again.", false);
      }
    } catch (err) {
      console.error("Register error:", err);
      showPopup("Server not connected. Please try again!", false);
    }
  };

  return (
    <div className="registration-page">
      <div className="wrapper">
        <span className="bg-animate"></span>

        {popup.show && (
          <div className={`popup ${popup.success ? "success" : "error"}`}>
            {popup.success ? "✅ " : "❌ "}{popup.message}
          </div>
        )}

        <div className="form-box login">
          <button className="back-btn-n" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>

          {/* ✅ Role show karo heading mein */}
          <h2>Sign Up as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>

          <form onSubmit={handleSubmit}>

            <div className="input-box">
              <input
                type="text"
                required
                placeholder=" "
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  const invalidSymbols = /[^a-zA-Z0-9.@_\-]/g;
                  const found = val.match(invalidSymbols);
                  if (found) {
                    const unique = [...new Set(found)].join(" ");
                    showPopup(`Symbol "${unique}" Not Allowed!`, false);
                  }
                }}
              />
              <label>Email</label>
              <i className="fa-solid fa-envelope"></i>
            </div>

            <div className="input-box">
              <input
                type={showPassword ? "text" : "password"}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
              <i
                className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
              ></i>
            </div>

            <div className="input-box">
              <input
                type={showConfirm ? "text" : "password"}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <label>Confirm Password</label>
              <i
                className={`fa-solid ${showConfirm ? "fa-eye" : "fa-eye-slash"}`}
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ cursor: "pointer" }}
              ></i>
            </div>

            <button type="submit" className="btn">Register</button>

            <div className="logreg-link">
              <p>
                Already have an Account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // ✅ Login pe bhi role pass karo
                    navigate("/login", { state: { role: role } });
                  }}
                  className="register-link"
                >
                  Login
                </a>
              </p>
            </div>

          </form>
        </div>

        <div className="info-text login">
          <h2>Welcome!</h2>
          <p>Your Journey Starts Here</p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;