import { useEffect, useState } from 'react'
import Sidebar from './components/sidebar.jsx'

export default function AdminTripSchedules() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState(null)

  const fetchSchedules = () => {
    fetch('http://localhost:3000/api/tripschedules/admin/all')
      .then(r => r.json())
      .then(data => {
        setSchedules(data.schedules || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSchedules() }, [])

  const filtered = schedules.filter(s =>
    (s.hunter_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.hunter_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.guider_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.destination || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.target_species || '').toLowerCase().includes(search.toLowerCase())
  )

  const parseSchedule = (data) => {
    if (!data) return {}
    try { return typeof data === 'string' ? JSON.parse(data) : data }
    catch { return {} }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f8fa' }}>
      <Sidebar activeLabel="Trip Schedules" />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
            📅 Trip Schedules
          </h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '14px' }}>
            All planned trip schedules — hunter's intended itinerary for their hunting trip
          </p>
        </div>

        {/* Summary Card */}
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '20px 28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '32px' }}>📋</span>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#D4B800' }}>{schedules.length}</div>
            <div style={{ fontSize: '13px', color: '#888' }}>Total Trip Schedules</div>
          </div>
        </div>

        {/* Search + Refresh */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <input
            placeholder="🔍  Search hunter, guide, destination, species..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '8px',
              border: '1px solid #ddd', fontSize: '14px', outline: 'none',
            }}
          />
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>No trip schedules found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                  {['#', 'Hunter', 'Guide', 'Destination', 'Species', 'Dates', 'Duration', 'Group', 'Schedule', 'Created'].map(h => (
                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const schedData = parseSchedule(s.schedule_data)
                  const days = Object.keys(schedData)
                  const isOpen = expanded === s.id

                  return (
                    <>
                      <tr key={s.id} style={{ borderBottom: '1px solid #f2f2f2' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafff4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '13px 16px', color: '#aaa' }}>{i + 1}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#222' }}>{s.hunter_name || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>{s.hunter_email}</div>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#222' }}>{s.guider_name || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>{s.guider_email}</div>
                        </td>
                        <td style={{ padding: '13px 16px', color: '#444' }}>{s.destination || '—'}</td>
                        <td style={{ padding: '13px 16px', color: '#444' }}>{s.target_species || '—'}</td>
                        <td style={{ padding: '13px 16px', color: '#444', whiteSpace: 'nowrap' }}>
                          {s.start_date ? new Date(s.start_date).toLocaleDateString() : '—'}
                          {s.end_date ? ` → ${new Date(s.end_date).toLocaleDateString()}` : ''}
                        </td>
                        <td style={{ padding: '13px 16px', color: '#444' }}>
                          {s.duration_days ? `${s.duration_days} days` : '—'}
                        </td>
                        <td style={{ padding: '13px 16px', color: '#444' }}>{s.group_detail || '—'}</td>
                        <td style={{ padding: '13px 16px' }}>
                          {days.length > 0 ? (
                            <button
                              onClick={() => setExpanded(isOpen ? null : s.id)}
                              style={{
                                padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                                background: isOpen ? '#D4B800' : '#fff8cc',
                                color: isOpen ? '#fff' : '#a88f00',
                                border: '1px solid #D4B800', cursor: 'pointer', fontWeight: 600
                              }}
                            >
                              {isOpen ? '▲ Hide' : `▼ ${days.length} days`}
                            </button>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '13px 16px', color: '#aaa', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>

                      {/* Expanded Schedule Detail */}
                      {isOpen && (
                        <tr key={`exp-${s.id}`}>
                          <td colSpan={10} style={{ padding: '0 16px 16px 48px', background: '#fffdf0' }}>
                            <div style={{
                              borderLeft: '3px solid #D4B800', paddingLeft: '16px',
                              marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#a88f00', marginBottom: '4px' }}>
                                📋 Day-wise Schedule
                              </div>
                              {days.map(day => (
                                <div key={day} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                                  <span style={{
                                    background: '#D4B800', color: '#fff', borderRadius: '4px',
                                    padding: '2px 8px', fontWeight: 600, whiteSpace: 'nowrap', alignSelf: 'flex-start'
                                  }}>{day}</span>
                                  <span style={{ color: '#444' }}>{schedData[day]}</span>
                                </div>
                              ))}
                              {s.additional_requirements && (
                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                  <strong>Additional Requirements:</strong> {s.additional_requirements}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ marginTop: '16px', color: '#aaa', fontSize: '13px' }}>
          Showing {filtered.length} of {schedules.length} schedules — use the search and filters to narrow down the list.
        </p>
      </main>
    </div>
  )
}