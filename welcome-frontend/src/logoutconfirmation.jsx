import { useNavigate } from "react-router-dom";
import "./logoutconfirmation.css";

function LogoutConfirmation() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/home");
  };

  return (
    <div className="page">
      <div className="confirm-box">
        <h2>Confirm Logout</h2>
        <p>
          Are you sure you want to log out?<br />
          You will be signed out of your account and will need to log in again
          to access your dashboard.
        </p>
        <div className="btn-group">
          <button className="btn logout-btn" onClick={handleLogout}>
              Yes, Logout
          </button>
          <button className="btn cancel-btn" onClick={handleCancel}>
            Cancel

          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirmation;