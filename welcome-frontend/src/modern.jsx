import React, { useState, useEffect } from "react";
import "./modern.css";
import { useLocation, useNavigate } from "react-router-dom";

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = location.state?.role || "hunter";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", success: false });

  const showPopup = (message, success) => {
    setPopup({ show: true, message, success });
    setTimeout(() => setPopup({ show: false, message: "", success: false }), 3000);
  };

  // ✅ Login ke baad navigate karo — SIRF role ke hisaab se
  const handleLoginSuccess = (userData) => {
    // ✅ FIX: Pehle localStorage clear karo taake koi purana data na rahe
    localStorage.removeItem("isGuest");
    localStorage.removeItem("user");

    // ✅ FIX: Server se jo role aaya wo save karo
    localStorage.setItem("user", JSON.stringify(userData));

    showPopup(`Welcome ${userData.email}!`, true);

    setTimeout(() => {
      // ✅ FIX: Sirf server se aaya hua role use karo, override mat karo
      if (userData.role === "guider") {
        navigate("/guider-profile");
      } else {
        navigate("/hunter-profile");
      }
    }, 2000);
  };

  const handleCredentialLogin = async (response) => {
    const idToken = response.credential;
    try {
      const res = await fetch("http://localhost:3000/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, role }), // ✅ selected role bhejo
      });
      const data = await res.json();

      if (data.message === "Login successful!") {
        handleLoginSuccess(data.user);
      } else {
        // ✅ Role mismatch error clearly dikhao
        showPopup(data.message || "Google login failed.", false);
      }
    } catch (err) {
      console.error("Google login error:", err);
      showPopup("Server not connected. Please try again!", false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: "339839379528-eblju42hkjn1r8eaufl4s2jmdmj6uje2.apps.googleusercontent.com",
        callback: handleCredentialLogin,
        auto_select: false,
      });

      const hiddenDiv = document.getElementById("google-hidden-btn");
      if (hiddenDiv) {
        window.google.accounts.id.renderButton(hiddenDiv, {
          theme: "outline",
          size: "large",
          width: 300,
          text: "continue_with",
        });
      }

      window.google.accounts.id.disableAutoSelect();
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [role]);

  const handleGoogleClick = () => {
    const hiddenBtn = document.querySelector("#google-hidden-btn div[role=button]");
    if (hiddenBtn) {
      hiddenBtn.click();
    } else {
      window.google?.accounts?.id?.prompt();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }), // ✅ role bhejo
      });

      const text = await response.text();

      if (text.startsWith("{")) {
        const data = JSON.parse(text);

        if (data.message === "Login successful!") {
          handleLoginSuccess(data.user); // ✅ centralized function use karo
        } else {
          // ✅ Server ka exact error message dikhao (role mismatch bhi)
          showPopup(data.message || "Invalid credentials. Please try again.", false);
        }
      } else {
        showPopup("Invalid credentials. Please try again.", false);
      }
    } catch (err) {
      showPopup("Server not connected. Please try again!", false);
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <span className="bg-animate"></span>

        {popup.show && (
          <div className={`popup ${popup.success ? "success" : "error"}`}>
            {popup.success ? "✅ " : "❌ "} {popup.message}
          </div>
        )}

        <div className="form-box login">
          <button className="back-btn-b" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>

          <h2>Login as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>

          <form onSubmit={handleLogin}>
            <div className="input-box">
              <input
                type="email"
                required
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email</label>
              <i className="fa-solid fa-envelope"></i>
            </div>

            <div className="input-box password-box">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
              <i
                className={`fa-solid eye-toggle ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            <button type="submit" className="btn">Login</button>

            <div className="forgot-password">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/forgotpassword"); }}>
                Forgot Password?
              </a>
            </div>

            <div className="logreg-link">
              <p>
                Don't have an Account?{" "}
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  navigate("/registrationm", { state: { role: role } });
                }}>
                  Sign Up
                </a>
              </p>
            </div>

            <button type="button" className="custom-google-btn" onClick={handleGoogleClick}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width="20"
                height="20"
                style={{ objectFit: "contain" }}
              />
              Continue with Google
            </button>

            <div id="google-hidden-btn" style={{
              position: "absolute",
              left: "-9999px",
              visibility: "hidden"
            }}></div>
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

export default Login;