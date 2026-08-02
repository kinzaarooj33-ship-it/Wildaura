import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Compass, CalendarCheck, Bell,
  Trophy, Siren, ChevronLeft, ChevronRight,
  UserCircle, LogOut, User, MessageSquare
} from 'lucide-react';
import { useNotifications } from './components/notificationcontent.jsx';
import './guider-dashboard.css';


const GuiderLayout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ FIX: sidebar badge ab NotificationContext ke unreadCount se aayega,
  // isi context ko NotificationBell.jsx bhi use karta hai. Pehle sidebar
  // apna alag /guider-notifications API call karta tha jiska NotificationBell
  // ke markRead/markAllRead se koi connection nahi tha — isliye dropdown mein
  // notification "dekh lene" ke baad bhi sidebar ka badge purana number dikhata
  // rehta tha. Ab dono ek hi shared state use karte hain, isliye turant sync hoga.
  const { unreadCount: notifCount } = useNotifications();

  const user = JSON.parse(localStorage.getItem("user"));
  const userName = user?.name || user?.email || "User";
  const userEmail = user?.email;

  const fetchCounts = async () => {
    if (!userEmail) return;
    try {
      const fbRes = await fetch(`http://localhost:3000/api/feedback/${userEmail}`);
      const fbData = await fbRes.json();
      const unread = (fbData.feedbacks || []).filter(f => !f.is_seen).length;
      setFeedbackCount(unread);

      const emRes = await fetch(`http://localhost:3000/api/emergency/guider/${userEmail}`);
      const emData = await emRes.json();
      setEmergencyCount((emData.emergencies || []).length);
    } catch {}
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard',      path: '/guider-dashboard' },
    { icon: <Compass size={20} />,         label: 'Explore',         path: '/guider-explore' },
    { icon: <CalendarCheck size={20} />,   label: 'My Booking',      path: '/guider-booking' },
    {
      icon: <Siren size={20} />,
      label: 'Emergency',
      path: '/guider-emergency',
      count: emergencyCount,
      isEmergency: true,
    },
    { icon: <Trophy size={20} />,          label: 'Success Stories', path: '/guider-success' },
    {
      icon: <MessageSquare size={20} />,
      label: 'Feedback',
      path: '/guider-feedback',
      count: feedbackCount,
    },
    {
      icon: <Bell size={20} />,
      label: 'Notifications',
      path: '/guider-notifications',
      count: notifCount,
    },
  ];

  const confirmLogout = () => {
    localStorage.removeItem("user");
    // ✅ FIX: role state pass karo taake Login page "Login as Guider" dikhaye,
    // warna location.state undefined ho jata hai aur default "hunter" use hota hai
    navigate("/login", { state: { role: "guider" } });
  };

  return (
    <div className="gl-wrapper">
      <div className="gl-bg"></div>

      {/* Logout Confirm Modal */}
      {showLogoutModal && (
        <div
          className="popup-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999999,
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="popup-box"
            style={{
              background: '#fff', borderRadius: '14px', padding: '32px 30px',
              textAlign: 'center', maxWidth: '380px', width: '90%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#1f2937' }}>
              Confirm Logout
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px', lineHeight: 1.5 }}>
              Are you sure you want to log out? You will need to log in again to access your dashboard.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={confirmLogout}
                style={{
                  padding: '10px 26px', background: '#b6b14a', color: '#fff',
                  border: 'none', borderRadius: '8px', fontWeight: 700,
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  padding: '10px 26px', background: '#eee', color: '#333',
                  border: 'none', borderRadius: '8px', fontWeight: 700,
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`gl-sidebar ${isOpen ? 'open' : 'closed'}`}>
        <button className="gl-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="gl-logo">
          <img src="/wild aura logo.png" alt="Wild Aura" className="gl-logo-img" />
          {isOpen && <div className="gl-logo-text">WILD AURA</div>}
        </div>

        <nav className="gl-nav">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`gl-nav-item ${location.pathname === item.path ? 'active' : ''} ${item.isEmergency && item.count > 0 ? 'emergency-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="gl-nav-icon">{item.icon}</span>
              {isOpen && <span className="gl-nav-text">{item.label}</span>}
              {item.count > 0 && (
                <span className={`gl-nav-badge ${item.isEmergency ? 'emergency' : ''}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <div className="gl-right">
        <header className="gl-topbar" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 24px',
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Guider Dashboard
          </h2>
          <div className="gl-user-wrap">
            <button className="gl-user-btn" onClick={() => setShowUserMenu(prev => !prev)}>
              <UserCircle size={30} color="#4b5563" />
              <span className="gl-user-label">{userName}</span>
            </button>
            {showUserMenu && (
              <div className="gl-dropdown" style={{ zIndex: 9999 }}>
                <button className="gl-dd-item" onClick={() => { setShowUserMenu(false); navigate("/guider-profile"); }}>
                  <User size={15} /> My Profile
                </button>
                <hr className="gl-dd-divider" />
                <button className="gl-dd-item danger" onClick={() => { setShowUserMenu(false); setShowLogoutModal(true); }}>
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="gl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default GuiderLayout;