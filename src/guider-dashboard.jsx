import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarCheck, Clock, CheckCircle, XCircle } from 'lucide-react';

const GuideDashboardPage = () => {
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, rejected: 0, completed: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCounts();
    // Har 15 second baad refresh (bookings page ki tarah)
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/booking/guider/${currentUser.email}?status=all`
      );
      const c = res.data.counts || { pending: 0, accepted: 0, rejected: 0, completed: 0 };
      setCounts(c);
      // Total = sab statuses ka sum (ya agar backend total bhejta hai to wo use karein)
      setTotal(res.data.total ?? (c.pending + c.accepted + c.rejected + c.completed));
    } catch (error) {
      console.error('Error fetching booking counts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper" style={{ flex: 1, minHeight: '100%' }}>
      <h1 className="welcome-text">Welcome</h1>
      <div className="stats-card">
        <h2 className="stats-title">Your Bookings</h2>
        <div className="stats-grid">
          <StatBox
            icon={<CalendarCheck size={22} />}
            val={loading ? '...' : total}
            label="Total Bookings"
          />
          <StatBox
            icon={<Clock size={22} />}
            val={loading ? '...' : counts.pending}
            label="Pending Requests"
          />
          <StatBox
            icon={<CheckCircle size={22} />}
            val={loading ? '...' : counts.accepted}
            label="Accepted"
          />
          <StatBox
            icon={<XCircle size={22} />}
            val={loading ? '...' : counts.rejected}
            label="Rejected"
          />
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon, val, label }) => (
  <div className="stat-box">
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{val}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default GuideDashboardPage;