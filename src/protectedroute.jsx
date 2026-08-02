// ProtectedRoute.jsx
// Is file ko src folder mein rakho

import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole, allowGuest = false }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const isGuest = !user && localStorage.getItem("isGuest") === "true";

  // ✅ Guest user — sirf un routes pe allow karo jahan allowGuest=true hai
  if (isGuest) {
    if (allowGuest) {
      return children;
    }
    return <Navigate to="/" replace />;
  }

  // Login nahi hua aur guest bhi nahi
  if (!user || !user.email) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch — galat dashboard access karne ki koshish
  if (allowedRole && user.role !== allowedRole) {
    // Hunter guider dashboard access karne ki koshish kare
    if (user.role === "hunter") {
      return <Navigate to="/home" replace />;
    }
    // Guider hunter pages access karne ki koshish kare
    if (user.role === "guider") {
      return <Navigate to="/guider-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;