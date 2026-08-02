import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/sidebar.jsx'
import TopBar from './components/topbar.jsx'

export default function EmergencyCalls() {
  const [emergencies, setEmergencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [resolving, setResolving] = useState({})
  const [copied, setCopied] = useState({})

  const fetchPendingCalls = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/emergency/pending-calls')
      const data = await res.json()
      if (data.success) {
        // Group by emergency id
        const grouped = {}
        data.emergencies.forEach(row => {
          if (!grouped[row.id]) {
            grouped[row.id] = {
              id: row.id,
              hunter_name: row.hunter_name,
              hunter_email: row.hunter_email,
              hunter_phone: row.hunter_phone,
              location_text: row.location_text,
              latitude: row.latitude,
              longitude: row.longitude,
              created_at: row.created_at,
              status: row.status,
              guiders: []
            }
          }
          if (row.guider_name) {
            grouped[row.id].guiders.push({
              name: row.guider_name,
              email: row.guider_email,
              phone: row.guider_phone
            })
          }
        })
        setEmergencies(Object.values(grouped))
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingCalls()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingCalls, 30000)
    return () => clearInterval(interval)
  }, [fetchPendingCalls])

  const copyNumber = (phone, key) => {
    navigator.clipboard.writeText(phone)
    setCopied(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }

  const markResolved = async (id) => {
    setResolving(prev => ({ ...prev, [id]: true }))
    try {
      await fetch(`http://localhost:3000/api/emergency/resolve/${id}`, { method: 'PUT' })
      setEmergencies(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error('Resolve error:', err)
    } finally {
      setResolving(prev => ({ ...prev, [id]: false }))
    }
  }

  const getMinutesAgo = (created_at) => {
    const diff = Math.floor((new Date() - new Date(created_at)) / 60000)
    return diff
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f7f7f5' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeLabel="Emergency Calls" />

        <main style={{ flex: 1, padding: '32px 28px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>📞</span>
                Emergency Calls
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                Emergencies with no guider response after 5 minutes
                {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            <button
              onClick={fetchPendingCalls}
              style={{
                background: '#1a1a1a', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '9px 18px', fontSize: '13px',
                cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p>Loading emergencies...</p>
            </div>
          ) : emergencies.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '70px 40px',
              textAlign: 'center', border: '1px solid #eee'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>✅</div>
              <h3 style={{ margin: 0, color: '#2d7a4f', fontSize: '18px' }}>No Pending Calls</h3>
              <p style={{ color: '#888', marginTop: '6px', fontSize: '14px' }}>
                All emergencies have been responded to. Auto-refreshes every 30 seconds.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {emergencies.map(em => (
                <div key={em.id} style={{
                  background: '#fff',
                  border: '1.5px solid #ff4444',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(255,68,68,0.08)'
                }}>
                  {/* Red top bar */}
                  <div style={{
                    background: 'linear-gradient(90deg, #d11a2a, #ff4444)',
                    padding: '10px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🚨 EMERGENCY #{em.id} — No Response for {getMinutesAgo(em.created_at)} minutes
                    </span>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)', color: '#fff',
                      borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 600
                    }}>
                      {em.status?.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                    {/* Hunter Info */}
                    <div style={{ background: '#fdf5f5', borderRadius: '10px', padding: '16px' }}>
                      <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '13px', color: '#d11a2a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🧑‍🦯 Hunter in Distress
                      </p>
                      <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>
                        {em.hunter_name || 'Unknown'}
                      </p>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#555' }}>
                        📧 {em.hunter_email || '—'}
                      </p>
                      {em.hunter_phone && (
                        <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#555' }}>
                          📱 {em.hunter_phone}
                        </p>
                      )}
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#555' }}>
                        📍 {em.location_text || `${em.latitude}, ${em.longitude}`}
                      </p>
                      {em.latitude && (
                        <a
                          href={`https://www.google.com/maps?q=${em.latitude},${em.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-block', marginTop: '10px',
                            background: '#1a73e8', color: '#fff', borderRadius: '6px',
                            padding: '5px 12px', fontSize: '12px', textDecoration: 'none', fontWeight: 500
                          }}
                        >
                          🗺️ View on Map
                        </a>
                      )}
                    </div>

                    {/* Guiders to Call */}
                    <div style={{ background: '#f5f9ff', borderRadius: '10px', padding: '16px' }}>
                      <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '13px', color: '#1a5cc8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📞 Call These Guiders
                      </p>
                      {em.guiders.length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#888' }}>No guiders assigned yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {em.guiders.map((g, i) => (
                            <div key={i} style={{
                              background: '#fff', borderRadius: '8px', padding: '10px 14px',
                              border: '1px solid #dde8ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>{g.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>{g.email}</p>
                              </div>
                              {g.phone ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>📞 {g.phone}</span>
                                  <button
                                    onClick={() => copyNumber(g.phone, `${em.id}-${i}`)}
                                    style={{
                                      background: copied[`${em.id}-${i}`] ? '#2d7a4f' : '#1a5cc8',
                                      color: '#fff', border: 'none', borderRadius: '6px',
                                      padding: '5px 12px', fontSize: '12px', fontWeight: 600,
                                      cursor: 'pointer', transition: '0.2s'
                                    }}
                                  >
                                    {copied[`${em.id}-${i}`] ? '✅ Copied!' : '📋 Copy Number'}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#aaa' }}>No phone</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div style={{
                    borderTop: '1px solid #f0f0f0', padding: '14px 20px',
                    display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#fafafa'
                  }}>
                    <button
                      onClick={() => markResolved(em.id)}
                      disabled={resolving[em.id]}
                      style={{
                        background: resolving[em.id] ? '#ccc' : '#2d7a4f',
                        color: '#fff', border: 'none', borderRadius: '8px',
                        padding: '9px 20px', fontSize: '13px', fontWeight: 600,
                        cursor: resolving[em.id] ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {resolving[em.id] ? 'Marking...' : '✅ Mark as Resolved'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}