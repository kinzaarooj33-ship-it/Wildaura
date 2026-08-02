import { useState, useEffect } from 'react'
import axios from 'axios'
import './weaponinfo.css'

import ActionButtons from './components/actionbuttons.jsx'
import Sidebar from './components/sidebar.jsx'
import TopBar from './components/topbar.jsx'
import ScrapePanel from './components/Scrapepanel.jsx'

function resolveImage(img) {
  if (!img) return null
  if (img.startsWith('http')) return img
  return `http://localhost:3000/uploads/${img}`
}

const BLANK = {
  name: '', image: '', type: '', stars: '', price_per_night: '',
  phone: '', email: '', website: '', address: '', description: '',
  features: '', amenities: '', packages: '', nearby_areas: '',
  total_rooms: '', checkin_time: '', checkout_time: '',
  distance_from_city: '', nearest_airport: '', payment_methods: '',
  cancellation_policy: '',
}

const resortFields = [
  { key: 'type',                label: 'Type'                },
  { key: 'stars',               label: 'Stars'               },
  { key: 'price_per_night',     label: 'Price Per Night'     },
  { key: 'phone',               label: 'Phone'               },
  { key: 'email',               label: 'Email'               },
  { key: 'website',             label: 'Website'             },
  { key: 'address',             label: 'Address'             },
  { key: 'description',         label: 'Description'         },
  { key: 'features',            label: 'Features'            },
  { key: 'amenities',           label: 'Amenities'           },
  { key: 'packages',            label: 'Packages'            },
  { key: 'nearby_areas',        label: 'Nearby Areas'        },
  { key: 'total_rooms',         label: 'Total Rooms'         },
  { key: 'checkin_time',        label: 'Check-in Time'       },
  { key: 'checkout_time',       label: 'Check-out Time'      },
  { key: 'distance_from_city',  label: 'Distance from City'  },
  { key: 'nearest_airport',     label: 'Nearest Airport'     },
  { key: 'payment_methods',     label: 'Payment Methods'     },
  { key: 'cancellation_policy', label: 'Cancellation Policy' },
  { key: 'image',               label: 'Image'               },
]

function StarsBadge({ stars }) {
  if (!stars) return '–'
  return <span className="stars-badge">{'⭐'.repeat(Number(stars))}</span>
}

// ── Delete Modal — custom styled ─────────────────────────
function DeleteModal({ name, onCancel, onConfirm }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', width: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ width: '64px', height: '64px', background: '#fff0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '20px', fontWeight: 700 }}>Delete Resort?</h3>
        <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.5, margin: '0 0 28px' }}>
          Delete <strong>{name}</strong>?{' '}
          <strong style={{ color: '#e53e3e' }}>This cannot be undone.</strong>
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel}  style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: '1.5px solid #ddd', background: '#f7f7f7', color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: 'none', background: '#e53e3e', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Resort Modal ─────────────────────────────────────────
function ResortModal({ resort, onClose, onSave }) {
  const isEdit = !!resort
  const [form, setForm]     = useState(resort ? { ...resort } : { ...BLANK })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  // ── alert() hataya — inline error state ──
  const [saveError, setSaveError] = useState('')

  const handle = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }))
    if (saveError) setSaveError('')
  }

  const validate = () => {
    const e = {}
    if (!form.name?.trim())    e.name    = 'Name is required'
    if (!form.type?.trim())    e.type    = 'Type is required'
    if (!form.address?.trim()) e.address = 'Address is required'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    setSaveError('')
    try {
      await onSave(form)
    } catch {
      setSaveError('Failed to save resort. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit Resort' : '➕ Add New Resort'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* ── Inline save error instead of alert() ── */}
          {saveError && (
            <div style={{ background: '#fff5f5', border: '1px solid #fc8181', color: '#c53030', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 500 }}>
              ⚠️ {saveError}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input name="name" value={form.name || ''} onChange={handle} placeholder="e.g. Serena Hotel" />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label>Type <span className="required">*</span></label>
              <select name="type" value={form.type || ''} onChange={handle}>
                <option value="">— Select —</option>
                <option>Luxury Hotel</option>
                <option>Mountain Resort</option>
                <option>Lake Resort</option>
                <option>Tourist Motel</option>
                <option>Eco Lodge</option>
                <option>Guest House</option>
                <option>Other</option>
              </select>
              {errors.type && <span className="field-error">{errors.type}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stars</label>
              <select name="stars" value={form.stars || ''} onChange={handle}>
                <option value="">— Select —</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price Per Night</label>
              <input name="price_per_night" value={form.price_per_night || ''} onChange={handle} placeholder="e.g. PKR 18,000" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone || ''} onChange={handle} placeholder="e.g. 051-2877000" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" value={form.email || ''} onChange={handle} placeholder="e.g. info@resort.com" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Website</label>
              <input name="website" value={form.website || ''} onChange={handle} placeholder="e.g. www.resort.com" />
            </div>
            <div className="form-group">
              <label>Image URL / Filename</label>
              <input name="image" value={form.image || ''} onChange={handle} placeholder="resort.jpg or https://..." />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Address <span className="required">*</span></label>
            <input name="address" value={form.address || ''} onChange={handle} placeholder="Full address..." />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea name="description" rows={3} value={form.description || ''} onChange={handle} placeholder="Resort description..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Features</label>
              <input name="features" value={form.features || ''} onChange={handle} placeholder="e.g. Pool, Gym..." />
            </div>
            <div className="form-group">
              <label>Amenities</label>
              <input name="amenities" value={form.amenities || ''} onChange={handle} placeholder="e.g. WiFi, Parking..." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Rooms</label>
              <input name="total_rooms" value={form.total_rooms || ''} onChange={handle} placeholder="e.g. 120" />
            </div>
            <div className="form-group">
              <label>Nearby Areas</label>
              <input name="nearby_areas" value={form.nearby_areas || ''} onChange={handle} placeholder="e.g. Nathia Gali, Ayubia" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Check-in Time</label>
              <input name="checkin_time" value={form.checkin_time || ''} onChange={handle} placeholder="e.g. 2:00 PM" />
            </div>
            <div className="form-group">
              <label>Check-out Time</label>
              <input name="checkout_time" value={form.checkout_time || ''} onChange={handle} placeholder="e.g. 12:00 PM" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Distance from City</label>
              <input name="distance_from_city" value={form.distance_from_city || ''} onChange={handle} placeholder="e.g. 45 km from Islamabad" />
            </div>
            <div className="form-group">
              <label>Nearest Airport</label>
              <input name="nearest_airport" value={form.nearest_airport || ''} onChange={handle} placeholder="e.g. Benazir Airport (45 km)" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Payment Methods</label>
              <input name="payment_methods" value={form.payment_methods || ''} onChange={handle} placeholder="e.g. Cash, Card, Online" />
            </div>
            <div className="form-group">
              <label>Packages</label>
              <input name="packages" value={form.packages || ''} onChange={handle} placeholder="e.g. Honeymoon, Family..." />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Cancellation Policy</label>
            <textarea name="cancellation_policy" rows={2} value={form.cancellation_policy || ''} onChange={handle} placeholder="e.g. Free cancellation up to 24 hours before check-in..." />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Resort' : 'Add Resort'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────
export default function ResortInfo() {
  const [resorts, setResorts]           = useState([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [editItem, setEditItem]         = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saveError, setSaveError]       = useState(null)
  // ── alert() hataya — delete error ke liye state ──
  const [deleteError, setDeleteError]   = useState(null)

  useEffect(() => { fetchResorts() }, [])

  const fetchResorts = async () => {
    try {
      setLoading(true)
      const res  = await axios.get('http://localhost:3000/api/resorts')
      const data = res.data
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)    ? data.data
        : Array.isArray(data?.resorts) ? data.resorts
        : []
      setResorts(list)
    } catch (err) {
      console.error('Resort fetch error:', err)
      setResorts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (form) => {
    setSaveError(null)
    if (editItem) {
      await axios.put(`http://localhost:3000/api/resorts/${editItem.id}`, form)
    } else {
      await axios.post('http://localhost:3000/api/resorts', form)
    }
    setShowModal(false)
    setEditItem(null)
    fetchResorts()
  }

  const handleDelete = async (id) => {
    try {
      setDeleteError(null)
      await axios.delete(`http://localhost:3000/api/resorts/${id}`)
      setDeleteTarget(null)
      fetchResorts()
    } catch (err) {
      console.error('Delete failed:', err)
      setDeleteError('Failed to delete resort. Please try again.')
      setDeleteTarget(null)
    }
  }

  const filtered = resorts.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.name?.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="admin-wrapper">
      <TopBar />
      <div className="admin-body">
        <Sidebar activeLabel="Resorts" />
        <main className="main-content">

          <div className="weapon-search-box">
            <input type="text" placeholder="Search resorts..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2>Resorts <span>({filtered.length} resorts)</span></h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <ScrapePanel entity="resorts" items={resorts} />
              <button className="add-btn" onClick={() => { setEditItem(null); setShowModal(true) }}>
                + Add New Resort
              </button>
            </div>
          </div>

          {saveError   && <div className="save-error">⚠️ {saveError}</div>}
          {deleteError && <div className="save-error">⚠️ {deleteError}</div>}

          {loading ? (
            <div className="table-empty">⏳ Loading resorts...</div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">No resorts found.</div>
          ) : (
            <div className="weapon-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Stars</th>
                    <th>Price</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const emptyFields = resortFields.filter(
                      f => !r[f.key] || r[f.key].toString().trim() === ''
                    )
                    return (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
                        <td>
                          {resolveImage(r.image)
                            ? <img src={resolveImage(r.image)} alt={r.name} className="weapon-img" />
                            : '🏨'}
                        </td>
                        <td>{r.name}</td>
                        <td>{r.type || '–'}</td>
                        <td><StarsBadge stars={r.stars} /></td>
                        <td>{r.price_per_night || '–'}</td>
                        <td>{r.phone || '–'}</td>
                        <td>{r.address || '–'}</td>
                        <td style={{ overflow: 'visible', position: 'relative' }}>
                          <ActionButtons
                            isEditing={false}
                            onEdit={   () => { setEditItem(r); setShowModal(true) }}
                            onDelete={ () => setDeleteTarget(r)}
                            onSave={   () => {}}
                            onCancel={ () => {}}
                            showFillButton={true}
                            emptyFields={emptyFields}
                            onIncompleteFieldSave={(filledData) => {
                              axios.put(`http://localhost:3000/api/resorts/${r.id}`, { ...r, ...filledData })
                                .then(() => fetchResorts())
                                .catch(err => {
                                  console.error('Fill save failed:', err)
                                  setSaveError('Failed to save filled data')
                                })
                            }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>

      {showModal && (
        <ResortModal
          resort={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
    </div>
  )
}