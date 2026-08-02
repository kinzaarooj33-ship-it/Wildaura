import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'

const STARS = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating)

const RATING_COLOR = (r) => {
  if (r >= 4) return { color: '#2e7d32', bg: '#e8f5e9' }
  if (r === 3) return { color: '#b8860b', bg: '#fff8e1' }
  return { color: '#c62828', bg: '#fdecea' }
}

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [summary, setSummary]     = useState({ total: 0, seen: 0, unseen: 0, avg_rating: 0 })
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterRating, setRating] = useState('All')
  const [expanded, setExpanded]   = useState(null)

  const fetchFeedback = () => {
    setLoading(true)
    fetch('http://localhost:3000/api/feedback/admin/all')
      .then(r => r.json())
      .then(data => {
        setFeedbacks(data.feedbacks || [])
        setSummary(data.summary || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchFeedback() }, [])

  const filtered = feedbacks.filter(f => {
    const matchSearch =
      (f.from_name  || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.from_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.to_email   || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.comment    || '').toLowerCase().includes(search.toLowerCase())
    const matchRating = filterRating === 'All' || String(f.rating) === filterRating
    return matchSearch && matchRating
  })

  const statCards = [
    { label: 'Total Feedback', value: summary.total,      color: '#6c5ce7', icon: '💬' },
    { label: 'Avg Rating',     value: summary.avg_rating, color: '#D4B800', icon: '⭐' },
    { label: 'Seen',           value: summary.seen,       color: '#2e7d32', icon: '👁️' },
    { label: 'Unseen',         value: summary.unseen,     color: '#c62828', icon: '🔴' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f8fa' }}>
      <Sidebar activeLabel="Feedback" />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
            💬 Feedback
          </h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '14px' }}>
            All hunter feedback for guides — sorted A→Z by hunter name
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(c => (
            <div key={c.label} style={{
              background: '#fff', borderRadius: '12px', padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <span style={{ fontSize: '28px' }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: c.color }}>{c.value ?? 0}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍  Search hunter, guide, comment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '8px',
              border: '1px solid #ddd', fontSize: '14px', outline: 'none',
            }}
          />
          {/* Rating Filter */}
          {['All', '5', '4', '3', '2', '1'].map(r => (
            <button key={r} onClick={() => setRating(r)} style={{
              padding: '9px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              border: filterRating === r ? '2px solid #D4B800' : '1px solid #ddd',
              background: filterRating === r ? '#D4B800' : '#fff',
              color: filterRating === r ? '#fff' : '#555',
              fontWeight: filterRating === r ? 600 : 400,
            }}>
              {r === 'All' ? 'All' : `${'★'.repeat(Number(r))}`}
            </button>
          ))}
          <button onClick={fetchFeedback} style={{
            padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
            background: '#f0f0f0', border: '1px solid #ddd', cursor: 'pointer', color: '#555'
          }}>↻ Refresh</button>
        </div>

        {/* Feedback Cards */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#aaa', background: '#fff', borderRadius: '12px' }}>
            No feedback found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map((f, i) => {
              const rc = RATING_COLOR(f.rating)
              const isOpen = expanded === f.id
              return (
                <div key={f.id} style={{
                  background: '#fff', borderRadius: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  border: '1px solid #f0f0f0', overflow: 'hidden'
                }}>
                  {/* Main Row */}
                  <div style={{ padding: '18px 24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                    {/* Number */}
                    <div style={{ color: '#ccc', fontSize: '13px', minWidth: '24px', paddingTop: '2px' }}>{i + 1}</div>

                    {/* Avatar */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: '#D4B800', color: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px'
                    }}>
                      {(f.from_name || f.from_email || '?')[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: '#1a1a2e' }}>
                            {f.from_name || '—'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888' }}>{f.from_email}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Seen badge */}
                          <span style={{
                            fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                            background: f.is_seen ? '#e8f5e9' : '#fdecea',
                            color: f.is_seen ? '#2e7d32' : '#c62828',
                            border: `1px solid ${f.is_seen ? '#81c784' : '#e57373'}`
                          }}>
                            {f.is_seen ? '👁️ Seen' : '🔴 Unseen'}
                          </span>
                          {/* Rating */}
                          <span style={{
                            fontSize: '13px', padding: '4px 12px', borderRadius: '20px',
                            background: rc.bg, color: rc.color, fontWeight: 600
                          }}>
                            {STARS(f.rating)} {f.rating}/5
                          </span>
                        </div>
                      </div>

                      {/* Guide info */}
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                        <span style={{ color: '#aaa' }}>To Guide: </span>
                        <span style={{ fontWeight: 500 }}>{f.to_email}</span>
                      </div>

                      {/* Comment */}
                      <div style={{
                        marginTop: '10px', padding: '12px 14px', background: '#f9f9f9',
                        borderRadius: '8px', fontSize: '14px', color: '#333',
                        borderLeft: '3px solid #D4B800'
                      }}>
                        {f.comment}
                      </div>

                      {/* Date + Replies toggle */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#bbb' }}>
                          {f.created_at ? new Date(f.created_at).toLocaleString() : '—'}
                        </span>
                        {f.replies && f.replies.length > 0 && (
                          <button
                            onClick={() => setExpanded(isOpen ? null : f.id)}
                            style={{
                              padding: '5px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                              background: isOpen ? '#D4B800' : '#fff8cc',
                              color: isOpen ? '#fff' : '#a88f00',
                              border: '1px solid #D4B800', fontWeight: 600
                            }}
                          >
                            {isOpen ? '▲ Hide Replies' : `▼ ${f.replies.length} Repl${f.replies.length > 1 ? 'ies' : 'y'}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies Section */}
                  {isOpen && f.replies && f.replies.length > 0 && (
                    <div style={{ borderTop: '1px solid #f0f0f0', background: '#fffdf0', padding: '14px 24px 14px 88px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#a88f00', marginBottom: '10px' }}>
                        Guide Replies:
                      </div>
                      {f.replies.map(r => (
                        <div key={r.id} style={{
                          display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start'
                        }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            background: '#6c5ce7', color: '#fff', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px'
                          }}>G</div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>{r.guider_email}</div>
                            <div style={{
                              fontSize: '13px', color: '#333', background: '#fff',
                              padding: '8px 12px', borderRadius: '8px', border: '1px solid #eee'
                            }}>{r.reply}</div>
                            <div style={{ fontSize: '11px', color: '#ccc', marginTop: '4px' }}>
                              {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p style={{ marginTop: '16px', color: '#aaa', fontSize: '13px' }}>
          Showing {filtered.length} of {feedbacks.length} feedback • Sorted A→Z by hunter name
        </p>
      </main>
    </div>
  )
}