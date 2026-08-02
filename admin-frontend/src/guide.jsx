import { useState, useEffect } from 'react'
import './user.css'

import Sidebar       from './components/sidebar.jsx'
import TopBar        from './components/topbar.jsx'
import ActionButtons from './components/actionbuttons.jsx'

export default function Guides() {
  const [guides, setGuides]               = useState([])
  const [editingId, setEditingId]         = useState(null)
  const [editData, setEditData]           = useState({})
  const [saveError, setSaveError]         = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery]     = useState('')

  const fetchGuides = () => {
    fetch('http://localhost:3000/api/admin/guides')
      .then(res => res.json())
      .then(data => setGuides(data))
      .catch(err => console.log('Fetch error:', err))
  }

  useEffect(() => { fetchGuides() }, [])

  const handleEdit = (guide) => {
    setEditingId(guide.id)
    setEditData({
      name:               guide.name               || '',
      cnic_number:        guide.cnic_number        || '',
      license_number:     guide.license_number     || '',
      guiding_experience: guide.guiding_experience || '',
      phone_number:       guide.phone_number       || '',
      email:              guide.email              || '',
      province:           guide.province           || '',
      city:               guide.city               || '',
      specialization:     guide.specialization     || '',
      price_per_trip:     guide.price_per_trip     || '',
    })
    setSaveError(null)
  }

  const handleSave = (id) => {
    fetch(`http://localhost:3000/api/admin/guides/${Number(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t) })
        return res.json()
      })
      .then(() => {
        setEditingId(null)
        setEditData({})
        setSaveError(null)
        fetchGuides()
      })
      .catch(err => setSaveError('Save failed: ' + err.message))
  }

  const confirmDelete = () => {
    fetch(`http://localhost:3000/api/admin/guides/${Number(deleteConfirm)}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error('Delete failed'); return res.json() })
      .then(() => { fetchGuides(); setDeleteConfirm(null) })
      .catch(err => { console.error('Delete error:', err); setDeleteConfirm(null) })
  }

  const filtered = guides.filter(g => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      String(g.name               || '').toLowerCase().includes(q) ||
      String(g.email              || '').toLowerCase().includes(q) ||
      String(g.phone_number       || '').toLowerCase().includes(q) ||
      String(g.cnic_number        || '').toLowerCase().includes(q) ||
      String(g.license_number     || '').toLowerCase().includes(q) ||
      String(g.guiding_experience || '').toLowerCase().includes(q) ||
      String(g.province           || '').toLowerCase().includes(q) ||
      String(g.city               || '').toLowerCase().includes(q) ||
      String(g.specialization     || '').toLowerCase().includes(q)
    )
  })

  const cols = [
    { key: 's_no',               label: 'S.No',         w: '55px'  },
    { key: 'name',               label: 'Name',         w: '120px' },
    { key: 'email',              label: 'Email',        w: '180px' },
    { key: 'phone_number',       label: 'Phone',        w: '130px' },
    { key: 'cnic_number',        label: 'CNIC',         w: '150px' },
    { key: 'license_number',     label: 'License No',   w: '140px' },
    { key: 'guiding_experience', label: 'Experience',   w: '100px' },
    { key: 'province',           label: 'Province',     w: '110px' },
    { key: 'city',               label: 'City',         w: '100px' },
    { key: 'specialization',     label: 'Specialization', w: '140px' },
    { key: 'price_per_trip',     label: 'Price/Trip',   w: '110px' },
    { key: 'actions',            label: 'Actions',      w: '90px'  },
  ]

  return (
    <div className="admin-wrapper">

      <TopBar />

      <div className="admin-body">

        <Sidebar activeLabel="Guides" />

        <main className="main-content">

          <div className="page-header">
            <input
              className="search-input"
              placeholder="🔍 Search guides..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="table-header">
            <h2 className="page-title">
              Guides <span className="user-count">({filtered.length})</span>
            </h2>
          </div>

          {saveError && <div className="save-error">⚠️ {saveError}</div>}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {cols.map(c => (
                    <th key={c.key} style={{ minWidth: c.w }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={cols.length} className="no-data">No guides found</td></tr>
                ) : (
                  filtered.map((guide, i) => (
                    <tr key={guide.id}>

                      {/* S.No */}
                      <td className="sno-cell">{i + 1}</td>

                      {/* Name */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                        : guide.name || '–'}</td>

                      {/* Email */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                        : <span className="email-text">{guide.email || '–'}</span>}</td>

                      {/* Phone */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.phone_number} onChange={e => setEditData({ ...editData, phone_number: e.target.value })} />
                        : guide.phone_number || '–'}</td>

                      {/* CNIC */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.cnic_number} onChange={e => setEditData({ ...editData, cnic_number: e.target.value })} />
                        : guide.cnic_number || '–'}</td>

                      {/* License */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.license_number} onChange={e => setEditData({ ...editData, license_number: e.target.value })} />
                        : guide.license_number || '–'}</td>

                      {/* Guiding Experience */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.guiding_experience} onChange={e => setEditData({ ...editData, guiding_experience: e.target.value })} />
                        : guide.guiding_experience || '–'}</td>

                      {/* Province */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.province} onChange={e => setEditData({ ...editData, province: e.target.value })} />
                        : guide.province || '–'}</td>

                      {/* City */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.city} onChange={e => setEditData({ ...editData, city: e.target.value })} />
                        : guide.city || '–'}</td>

                      {/* Specialization */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.specialization} onChange={e => setEditData({ ...editData, specialization: e.target.value })} />
                        : guide.specialization || '–'}</td>

                      {/* Price Per Trip */}
                      <td>{editingId === guide.id
                        ? <input className="edit-input" value={editData.price_per_trip} onChange={e => setEditData({ ...editData, price_per_trip: e.target.value })} />
                        : guide.price_per_trip ? `${guide.price_per_trip}` : '–'}</td>

                      {/* Actions */}
                      <td>
                        <ActionButtons
                          isEditing={editingId === guide.id}
                          onEdit={() => handleEdit(guide)}
                          onSave={() => handleSave(guide.id)}
                          onCancel={() => { setEditingId(null); setEditData({}); setSaveError(null) }}
                          onDelete={() => setDeleteConfirm(guide.id)}
                          showFillButton={false}
                        />
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '36px 32px',
            width: '380px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{
              width: '64px', height: '64px', background: '#fff0f0', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '28px',
            }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '20px', fontWeight: 700 }}>Delete Guide?</h3>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.5, margin: '0 0 28px' }}>
              Are you sure you want to delete this guide?<br />
              <strong style={{ color: '#e53e3e' }}>This action cannot be undone.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                flex: 1, padding: '11px 0', borderRadius: '8px',
                border: '1.5px solid #ddd', background: '#f7f7f7',
                color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              }}>Cancel</button>
              <button onClick={confirmDelete} style={{
                flex: 1, padding: '11px 0', borderRadius: '8px',
                border: 'none', background: '#e53e3e',
                color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}