import { useState, useEffect } from 'react'
import './user.css'

import Sidebar       from './components/sidebar.jsx'
import TopBar        from './components/topbar.jsx'
import ActionButtons from './components/actionbuttons.jsx'

export default function Users() {
  const [users, setUsers]                 = useState([])
  const [editingId, setEditingId]         = useState(null)
  const [editData, setEditData]           = useState({})
  const [saveError, setSaveError]         = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery]     = useState('')
  const [loading, setLoading]             = useState(true)
  const [fetchError, setFetchError]       = useState(null)

  const fetchUsers = () => {
    setLoading(true)
    setFetchError(null)
    fetch('http://localhost:3000/api/admin/users')
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data)
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users)
        } else if (data && Array.isArray(data.data)) {
          setUsers(data.data)
        } else {
          console.warn('Unexpected response shape:', data)
          setUsers([])
        }
      })
      .catch(err => {
        console.error('Fetch error:', err)
        setFetchError(err.message)
        setUsers([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleEdit = (user) => {
    setEditingId(user.id)
    setEditData({
      email:              user.email              || '',
      name:               user.name               || '',
      hunting_experience: user.hunting_experience || '',
      address:            user.address            || '',
      phone_number:       user.phone_number        || '',
      cnic_number:        user.cnic_number         || '',
      license_number:     user.license_number      || '',
      preferred_area:     user.preferred_area      || '',
    })
    setSaveError(null)
  }

  const handleSave = (id) => {
    fetch(`http://localhost:3000/api/admin/users/${Number(id)}`, {
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
        fetchUsers()
      })
      .catch(err => setSaveError('Save failed: ' + err.message))
  }

  const confirmDelete = () => {
    fetch(`http://localhost:3000/api/admin/users/${Number(deleteConfirm)}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error('Delete failed'); return res.json() })
      .then(() => { fetchUsers(); setDeleteConfirm(null) })
      .catch(err => { console.error('Delete error:', err); setDeleteConfirm(null) })
  }

  const getEmptyFields = (user) => {
    const fieldMap = [
      { key: 'email',              label: 'Email'          },
      { key: 'name',               label: 'Name'           },
      { key: 'phone_number',       label: 'Phone'          },
      { key: 'cnic_number',        label: 'CNIC'           },
      { key: 'license_number',     label: 'License No'     },
      { key: 'hunting_experience', label: 'Experience'     },
      { key: 'preferred_area',     label: 'Preferred Area' },
      { key: 'address',            label: 'Address'        },
    ]
    return fieldMap.filter(f => !user[f.key] || user[f.key] === '')
  }

  const filtered = Array.isArray(users)
    ? users.filter(u => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase().trim()
        return (
          String(u.email              || '').toLowerCase().includes(q) ||
          String(u.name               || '').toLowerCase().includes(q) ||
          String(u.phone_number       || '').toLowerCase().includes(q) ||
          String(u.cnic_number        || '').toLowerCase().includes(q) ||
          String(u.license_number     || '').toLowerCase().includes(q) ||
          String(u.hunting_experience || '').toLowerCase().includes(q) ||
          String(u.preferred_area     || '').toLowerCase().includes(q) ||
          String(u.address            || '').toLowerCase().includes(q)
        )
      })
    : []

  const cols = [
    { key: 's_no',               label: 'S.No',           w: '55px'  },
    { key: 'email',              label: 'Email',          w: '180px' },
    { key: 'name',               label: 'Name',           w: '120px' },
    { key: 'phone_number',       label: 'Phone',          w: '120px' },
    { key: 'cnic_number',        label: 'CNIC',           w: '140px' },
    { key: 'license_number',     label: 'License No',     w: '130px' },
    { key: 'hunting_experience', label: 'Experience',     w: '100px' },
    { key: 'preferred_area',     label: 'Preferred Area', w: '130px' },
    { key: 'address',            label: 'Address',        w: '140px' },
    { key: 'actions',            label: 'Actions',        w: '160px' },
  ]

  return (
    <div className="admin-wrapper">

      <TopBar />

      <div className="admin-body">

        <Sidebar activeLabel="Users" />

        <main className="main-content">

          {/* Search */}
          <div className="page-header">
            <input
              className="search-input"
              placeholder="🔍 Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Title */}
          <div className="table-header">
            <h2 className="page-title">
              Users
              <span className="user-count"> ({filtered.length})</span>
            </h2>
          </div>

          {saveError && (
            <div className="save-error">⚠️ {saveError}</div>
          )}

          {fetchError && (
            <div className="save-error">
              ⚠️ Could not load users: {fetchError} &nbsp;
              <button
                onClick={fetchUsers}
                style={{ marginLeft: 8, cursor: 'pointer', padding: '2px 10px', borderRadius: 6, border: '1px solid #e53e3e', background: '#fff', color: '#e53e3e', fontWeight: 600 }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table */}
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
                {loading ? (
                  <tr>
                    <td colSpan={cols.length} className="no-data">⏳ Loading users...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length} className="no-data">No users found</td>
                  </tr>
                ) : (
                  filtered.map((user, i) => (
                    <tr key={user.id}>

                      <td className="sno-cell">{i + 1}</td>

                      {/* Email */}
                      <td>
                        {editingId === user.id
                          ? <input className="edit-input" value={editData.email}
                              onChange={e => setEditData({ ...editData, email: e.target.value })} />
                          : <span className="email-text">{user.email || '–'}</span>
                        }
                      </td>

                      {/* Name */}
                      <td>
                        {editingId === user.id
                          ? <input className="edit-input" value={editData.name}
                              onChange={e => setEditData({ ...editData, name: e.target.value })} />
                          : user.name || '–'
                        }
                      </td>

                      {/* Phone */}
                      <td>
                        {editingId === user.id
                          ? <input className="edit-input" value={editData.phone_number}
                              onChange={e => setEditData({ ...editData, phone_number: e.target.value })} />
                          : user.phone_number || '–'
                        }
                      </td>

                      {/* CNIC */}
                      <td>
                        {editingId === user.id
                          ? <input className="edit-input" value={editData.cnic_number}
                              onChange={e => setEditData({ ...editData, cnic_number: e.target.value })} />
                          : user.cnic_number || '–'
                        }
                      </td>

                      {/* License */}
                      <td>
                        {editingId === user.id
                          ? <input className="edit-input" value={editData.license_number}
                              onChange={e => setEditData({ ...editData, license_number: e.target.value })} />
                          : user.license_number || '–'
                        }
                      </td>

                      {/* Experience */}
                      <td>
                        {editingId === user.id
                          ? <input className="edit-input" value={editData.hunting_experience}
                              onChange={e => setEditData({ ...editData, hunting_experience: e.target.value })} />
                          : user.hunting_experience || '–'
                        }
                      </td>

                      {/* Preferred Area */}
                      <td>
                        {editingId === user.id
                          ? <input className="edit-input" value={editData.preferred_area}
                              onChange={e => setEditData({ ...editData, preferred_area: e.target.value })} />
                          : user.preferred_area || '–'
                        }
                      </td>

                      {/* Address */}
                      <td>
                        {editingId === user.id
                          ? <input className="edit-input" value={editData.address}
                              onChange={e => setEditData({ ...editData, address: e.target.value })} />
                          : user.address || '–'
                        }
                      </td>

                      {/* Action Buttons */}
                      <td>
                        <ActionButtons
                          isEditing={editingId === user.id}
                          onEdit={   () => handleEdit(user)}
                          onSave={   () => handleSave(user.id)}
                          onCancel={ () => { setEditingId(null); setSaveError(null) }}
                          onDelete={ () => setDeleteConfirm(user.id)}
                          emptyFields={getEmptyFields(user)}
                          showFillButton={false} 
                          onIncompleteFieldSave={(filledData) => {
                            fetch(`http://localhost:3000/api/admin/users/${Number(user.id)}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...user, ...filledData }),
                            })
                              .then(res => { if (!res.ok) throw new Error('Save failed'); return res.json() })
                              .then(() => fetchUsers())
                              .catch(err => alert('Save failed: ' + err.message))
                          }}
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

      {/* Delete Confirmation Popup */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '36px 32px',
            width: '380px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{
              width: '64px', height: '64px',
              background: '#fff0f0',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
            }}>
              🗑️
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '20px', fontWeight: '700' }}>
              Delete User?
            </h3>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', margin: '0 0 28px' }}>
              Are you sure you want to delete this user?<br />
              <strong style={{ color: '#e53e3e' }}>This action cannot be undone.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: '8px',
                  border: '1.5px solid #ddd', background: '#f7f7f7',
                  color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: '8px',
                  border: 'none', background: '#e53e3e',
                  color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}