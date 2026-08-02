import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/sidebar.jsx'
import TopBar from './components/topbar.jsx'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: '#fff8e1', color: '#f59e0b', icon: '⏳' },
  broadcast: { label: 'Broadcast', bg: '#fff3e0', color: '#f97316', icon: '📢' },
  accepted:  { label: 'Accepted',  bg: '#e8f5e9', color: '#2d7a4f', icon: '✅' },
  resolved:  { label: 'Resolved',  bg: '#e8f5e9', color: '#1a5cc8', icon: '🔒' },
  rejected:  { label: 'Rejected',  bg: '#fdecea', color: '#d11a2a', icon: '❌' },
}

export default function EmergencyRequests() {
  const [emergencies, setEmergencies] = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  const [search, setSearch]           = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const res  = await fetch('http://localhost:3000/api/emergency/all')
      const data = await res.json()
      if (data.success) setEmergencies(data.emergencies)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = emergencies.filter(e => {
    const matchFilter = filter === 'all' || e.status === filter
    const matchSearch = !search ||
      e.hunter_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.hunter_email?.toLowerCase().includes(search.toLowerCase()) ||
      e.location_text?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    all:       emergencies.length,
    pending:   emergencies.filter(e => e.status === 'pending').length,
    broadcast: emergencies.filter(e => e.status === 'broadcast').length,
    accepted:  emergencies.filter(e => e.status === 'accepted').length,
    resolved:  emergencies.filter(e => e.status === 'resolved').length,
  }

  const formatTime = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const filters = [
    { key: 'all',       label: 'All',       color: '#1a1a1a' },
    { key: 'pending',   label: 'Pending',   color: '#f59e0b' },
    { key: 'broadcast', label: 'Broadcast', color: '#f97316' },
    { key: 'accepted',  label: 'Accepted',  color: '#2d7a4f' },
    { key: 'resolved',  label: 'Resolved',  color: '#1a5cc8' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f7f7f5' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeLabel="Emergency Requests" />

        <main style={{ flex: 1, padding: '32px 28px' }}>

          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🚨</span> Emergency Requests
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
              All emergency requests from hunters
            </p>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total',     value: counts.all,       color: '#1a1a1a', bg: '#fff' },
              { label: 'Pending',   value: counts.pending,   color: '#f59e0b', bg: '#fff8e1' },
              { label: 'Broadcast', value: counts.broadcast, color: '#f97316', bg: '#fff3e0' },
              { label: 'Accepted',  value: counts.accepted,  color: '#2d7a4f', bg: '#e8f5e9' },
              { label: 'Resolved',  value: counts.resolved,  color: '#1a5cc8', bg: '#e3f2fd' },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, borderRadius: '10px', padding: '14px 20px',
                border: `1px solid ${s.color}22`, minWidth: '100px', textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter + Search */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '7px 16px', borderRadius: '20px', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: filter === f.key ? f.color : '#fff',
                    color: filter === f.key ? '#fff' : '#555',
                    border: `1px solid ${filter === f.key ? f.color : '#ddd'}`,
                    transition: '0.15s'
                  }}
                >
                  {f.label} ({counts[f.key] ?? emergencies.length})
                </button>
              ))}
            </div>

            <input
              placeholder="🔍 Search hunter name, email, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: '220px', padding: '8px 14px',
                borderRadius: '8px', border: '1px solid #ddd',
                fontSize: '13px', outline: 'none', background: '#fff'
              }}
            />

            <button
              onClick={fetchAll}
              style={{
                background: '#1a1a1a', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '9px 16px', fontSize: '13px',
                cursor: 'pointer', fontWeight: 500
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: '#888' }}>
              <div style={{ fontSize: '32px' }}>⏳</div>
              <p>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '60px',
              textAlign: 'center', border: '1px solid #eee'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p style={{ color: '#888', fontSize: '15px' }}>No emergency requests found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(em => {
                const sc = STATUS_CONFIG[em.status] || STATUS_CONFIG.pending
                return (
                  <div key={em.id} style={{
                    background: '#fff', borderRadius: '12px',
                    border: '1px solid #eee', overflow: 'hidden',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.04)'
                  }}>
                    {/* Card Header */}
                    <div style={{
                      padding: '12px 20px', borderBottom: '1px solid #f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#fafafa'
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>
                        🆔 Emergency #{em.id}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>
                          {formatTime(em.created_at)}
                        </span>
                        <span style={{
                          background: sc.bg, color: sc.color,
                          borderRadius: '20px', padding: '3px 12px',
                          fontSize: '12px', fontWeight: 700
                        }}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{
                      padding: '16px 20px',
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '16px'
                    }}>
                      {/* Hunter */}
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#aaa', textTransform: 'uppercase', fontWeight: 700 }}>Hunter</p>
                        <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>{em.hunter_name || '—'}</p>
                        <p style={{ margin: '0 0 3px', fontSize: '12px', color: '#666' }}>📧 {em.hunter_email || '—'}</p>
                        {em.hunter_phone && <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>📱 {em.hunter_phone}</p>}
                      </div>

                      {/* Location */}
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#aaa', textTransform: 'uppercase', fontWeight: 700 }}>Location</p>
                        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#1a1a1a' }}>
                          📍 {em.location_text || `${em.latitude}, ${em.longitude}`}
                        </p>
                        {em.latitude && (
                          <a
                            href={`https://www.google.com/maps?q=${em.latitude},${em.longitude}`}
                            target="_blank" rel="noreferrer"
                            style={{
                              fontSize: '12px', color: '#1a5cc8',
                              textDecoration: 'none', fontWeight: 600
                            }}
                          >
                            🗺️ View on Map
                          </a>
                        )}
                      </div>

                      {/* Guider */}
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#aaa', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Guider</p>
                        {em.guider_name ? (
                          <>
                            <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '14px', color: '#2d7a4f' }}>✅ {em.guider_name}</p>
                            <p style={{ margin: '0 0 3px', fontSize: '12px', color: '#666' }}>📧 {em.guider_email}</p>
                            {em.guider_phone && <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>📱 {em.guider_phone}</p>}
                          </>
                        ) : (
                          <p style={{ fontSize: '13px', color: '#aaa' }}>No guider assigned yet</p>
                        )}
                        {em.accepted_at && (
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>
                            Accepted: {formatTime(em.accepted_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}