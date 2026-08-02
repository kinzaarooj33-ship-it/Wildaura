import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import './dashboard.css'

import Sidebar from './components/sidebar.jsx'
import TopBar  from './components/topbar.jsx'

export default function Dashboard() {
  const [stats, setStats]     = useState({ hunters: 0, guides: 0, bookings: 0, trips: 0 })
  const [growth, setGrowth]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const [usersRes, guidesRes, bookingsRes, tripsRes, growthRes] = await Promise.all([
        fetch('http://localhost:3000/api/admin/users'),
        fetch('http://localhost:3000/api/admin/guides'),
        fetch('http://localhost:3000/api/bookings/admin/all'),
        fetch('http://localhost:3000/api/trip-schedules/admin/all'),
        fetch('http://localhost:3000/api/admin/growth-stats'),
      ])

      const users    = await usersRes.json()
      const guides   = await guidesRes.json()
      const bookings = bookingsRes.ok ? await bookingsRes.json() : { bookings: [] }
      const trips    = tripsRes.ok    ? await tripsRes.json()    : { schedules: [] }
      const growthRaw = growthRes.ok  ? await growthRes.json()  : { growth: [] }

      setStats({
        hunters:  Array.isArray(users)   ? users.length   : 0,
        guides:   Array.isArray(guides)  ? guides.length  : 0,
        bookings: bookings?.summary?.total ?? (Array.isArray(bookings?.bookings) ? bookings.bookings.length : 0),
        trips: trips?.active_count ?? 0,
      })
      setGrowth(growthRaw.growth || [])
    } catch (err) {
      console.log('Stats fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="admin-wrapper">
      <TopBar />

      <div className="admin-body">
        <Sidebar activeLabel="Dashboard" />

        <main className="main-content">
          <h2 className="page-title">Dashboard</h2>

          {/* Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div>
                <p className="stat-label">Total Hunters</p>
                <h3 className="stat-value">{loading ? '...' : stats.hunters}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div>
                <p className="stat-label">Total Guides</p>
                <h3 className="stat-value">{loading ? '...' : stats.guides}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div>
                <p className="stat-label">Total Bookings</p>
                <h3 className="stat-value">{loading ? '...' : stats.bookings}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div>
                <p className="stat-label">Active Trips</p>
                <h3 className="stat-value">{loading ? '...' : stats.trips}</h3>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <h4 className="chart-title">Booking Statistics</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={growth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#D4B800" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h4 className="chart-title">User Growth</h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={growth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="hunters" stroke="#D4B800" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="guides"  stroke="#a08800" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}