import { useEffect, useState } from 'react'
import Sidebar from './components/sidebar.jsx'

const STATUS_COLORS = {
  Pending:  { bg: '#fff8e1', color: '#b8860b', border: '#f0c040' },
  Accepted: { bg: '#e8f5e9', color: '#2e7d32', border: '#81c784' },
  Rejected: { bg: '#fdecea', color: '#c62828', border: '#e57373' },
}

export default function AdminBookings() {
  const [bookings, setBookings]   = useState([])
  const [summary, setSummary]     = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 })
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilter] = useState('All')

  const fetchBookings = () => {
    setLoading(true)
    fetch('http://localhost:3000/api/bookings/admin/all')
      .then(r => r.json())
      .then(data => {
        setBookings(data.bookings || [])
        setSummary(data.summary || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    // avoid calling setState synchronously inside an effect
    const t = setTimeout(() => fetchBookings(), 0)
    return () => clearTimeout(t)
  }, [])

  const filtered = bookings.filter(b => {
    const matchSearch =
      (b.hunter_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.hunter_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.guider_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.trip_destination || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || b.status === filterStatus
    return matchSearch && matchStatus
  })

  const statCards = [
    { label: 'Total',    value: summary.total,    color: '#6c5ce7' },
    { label: 'Pending',  value: summary.pending,  color: '#b8860b' },
    { label: 'Accepted', value: summary.accepted, color: '#2e7d32' },
    { label: 'Rejected', value: summary.rejected, color: '#c62828' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f8fa' }}>
      <Sidebar activeLabel="Bookings" />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
            🧳 Bookings
          </h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '14px' }}>
            All booking requests from hunters
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(c => (
            <div key={c.label} style={{
              background: '#fff', borderRadius: '12px', padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex',
              flexDirection: 'column', gap: '4px'
            }}>
              <span style={{ fontSize: '13px', color: '#888' }}>{c.label}</span>
              <span style={{ fontSize: '30px', fontWeight: 700, color: c.color }}>{c.value ?? 0}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍  Search hunter, guide, destination..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '8px',
              border: '1px solid #ddd', fontSize: '14px', outline: 'none',
            }}
          />
          {['All', 'Pending', 'Accepted', 'Rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '9px 18px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              border: filterStatus === s ? '2px solid #D4B800' : '1px solid #ddd',
              background: filterStatus === s ? '#D4B800' : '#fff',
              color: filterStatus === s ? '#fff' : '#555',
              fontWeight: filterStatus === s ? 600 : 400,
            }}>{s}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>No bookings found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                  {['#', 'Hunter', 'Guide', 'Destination', 'Species', 'Dates', 'Duration', 'Status', 'Booked On'].map(h => (
                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const sc = STATUS_COLORS[b.status] || STATUS_COLORS.Pending
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f2f2f2' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafff4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 16px', color: '#aaa' }}>{i + 1}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#222' }}>{b.hunter_name || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{b.hunter_email}</div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#222' }}>{b.guider_name || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{b.guider_email}</div>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#444' }}>{b.trip_destination || '—'}</td>
                      <td style={{ padding: '13px 16px', color: '#444' }}>{b.trip_species || '—'}</td>
                      <td style={{ padding: '13px 16px', color: '#444', whiteSpace: 'nowrap' }}>
                        {b.trip_start_date ? new Date(b.trip_start_date).toLocaleDateString() : '—'}
                        {b.trip_end_date ? ` → ${new Date(b.trip_end_date).toLocaleDateString()}` : ''}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#444' }}>
                        {b.trip_duration ? `${b.trip_duration} days` : '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`
                        }}>{b.status}</span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#aaa', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ marginTop: '16px', color: '#aaa', fontSize: '13px' }}>
          Showing {filtered.length} of {bookings.length} bookings — use the search and filters to narrow down the list.
        </p>
      </main>
    </div>
  )
}