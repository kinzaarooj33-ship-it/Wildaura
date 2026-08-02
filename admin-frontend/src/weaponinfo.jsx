import { useState, useEffect } from 'react'
import axios from 'axios'
import './weaponinfo.css'

import Sidebar        from './components/sidebar.jsx'
import TopBar         from './components/topbar.jsx'
import ActionButtons  from './components/actionbuttons.jsx'
import ScrapePanel    from './components/Scrapepanel.jsx'

function resolveImage(img) {
  if (!img) return null
  if (img.startsWith('http')) return img
  return `http://localhost:3000/uploads/${img}`
}

const BLANK = {
  name: '', image: '', short_desc: '', description: '',
  weapon_type: '', common_use: '', effective_range: '',
  average_weight: '', caliber_types: '', firing_mechanism: '',
  accuracy_level: '', noise_level: '', suitable_for: '',
  advantages: '', safety_guidelines: '', legal_regulations: '',
  additional_info: '',
}

const ALL_WEAPON_FIELDS = [
  { key: 'image',             label: 'Image'             },
  { key: 'short_desc',        label: 'Short Description' },
  { key: 'description',       label: 'Description'       },
  { key: 'weapon_type',       label: 'Weapon Type'       },
  { key: 'common_use',        label: 'Common Use'        },
  { key: 'effective_range',   label: 'Effective Range'   },
  { key: 'average_weight',    label: 'Average Weight'    },
  { key: 'caliber_types',     label: 'Caliber Types'     },
  { key: 'firing_mechanism',  label: 'Firing Mechanism'  },
  { key: 'accuracy_level',    label: 'Accuracy Level'    },
  { key: 'noise_level',       label: 'Noise Level'       },
  { key: 'suitable_for',      label: 'Suitable For'      },
  { key: 'advantages',        label: 'Advantages'        },
  { key: 'safety_guidelines', label: 'Safety Guidelines' },
  { key: 'legal_regulations', label: 'Legal Regulations' },
  { key: 'additional_info',   label: 'Additional Info'   },
]

const getEmptyWeaponFields = (w) =>
  ALL_WEAPON_FIELDS.filter(f => !w[f.key] || w[f.key].toString().trim() === '')

function badgeClass(level) {
  const map = {
    High: 'badge-high', Exceptional: 'badge-exceptional',
    Extreme: 'badge-extreme', Medium: 'badge-medium', Low: 'badge-low',
  }
  return map[level] || 'badge-medium'
}

// ── Weapon Modal (Add / Edit) ─────────────────────────────
function WeaponModal({ weapon, onClose, onSave }) {
  const isEdit = !!weapon
  const [form, setForm]     = useState(weapon ? { ...weapon } : { ...BLANK })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handle = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name        = 'Name is required'
    if (!form.weapon_type.trim()) e.weapon_type = 'Type is required'
    if (!form.description.trim()) e.description = 'Description is required'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit Weapon' : '➕ Add New Weapon'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input name="name" value={form.name} onChange={handle} placeholder="e.g. Bolt-action Rifle" />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label>Weapon Type <span className="required">*</span></label>
              <select name="weapon_type" value={form.weapon_type} onChange={handle}>
                <option value="">— Select —</option>
                <option>Firearm</option>
                <option>Air Weapon</option>
                <option>Archery Weapon</option>
                <option>Blade / Knife</option>
                <option>Other</option>
              </select>
              {errors.weapon_type && <span className="field-error">{errors.weapon_type}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Image URL / Filename</label>
              <input name="image" value={form.image} onChange={handle} placeholder="rifle.jpg or https://..." />
            </div>
            <div className="form-group">
              <label>Common Use</label>
              <input name="common_use" value={form.common_use} onChange={handle} placeholder="e.g. Big Game Hunting" />
            </div>
          </div>
          <div className="form-group full-width">
            <label>Short Description</label>
            <input name="short_desc" value={form.short_desc} onChange={handle} placeholder="One-line summary..." />
          </div>
          <div className="form-group full-width">
            <label>Full Description <span className="required">*</span></label>
            <textarea name="description" rows={3} value={form.description} onChange={handle} placeholder="Detailed description..." />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Effective Range</label>
              <input name="effective_range" value={form.effective_range} onChange={handle} placeholder="e.g. 200–800 meters" />
            </div>
            <div className="form-group">
              <label>Average Weight</label>
              <input name="average_weight" value={form.average_weight} onChange={handle} placeholder="e.g. 3–5 kg" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Caliber / Types</label>
              <input name="caliber_types" value={form.caliber_types} onChange={handle} placeholder="e.g. .308, .30-06" />
            </div>
            <div className="form-group">
              <label>Firing Mechanism</label>
              <input name="firing_mechanism" value={form.firing_mechanism} onChange={handle} placeholder="e.g. Bolt Action" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Accuracy Level</label>
              <select name="accuracy_level" value={form.accuracy_level} onChange={handle}>
                <option value="">— Select —</option>
                <option>Low</option><option>Medium</option>
                <option>High</option><option>Exceptional</option><option>Extreme</option>
              </select>
            </div>
            <div className="form-group">
              <label>Noise Level</label>
              <select name="noise_level" value={form.noise_level} onChange={handle}>
                <option value="">— Select —</option>
                <option>Very Low</option><option>Low</option>
                <option>Medium</option><option>High</option><option>Very High</option>
              </select>
            </div>
          </div>
          <div className="form-group full-width">
            <label>Suitable For</label>
            <input name="suitable_for" value={form.suitable_for} onChange={handle} placeholder="e.g. Deer, Wild Boar, Mountain Goat" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Advantages</label>
              <textarea name="advantages" rows={2} value={form.advantages} onChange={handle} placeholder="Key benefits..." />
            </div>
            <div className="form-group">
              <label>Safety Guidelines</label>
              <textarea name="safety_guidelines" rows={2} value={form.safety_guidelines} onChange={handle} placeholder="Safety notes..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Legal Regulations</label>
              <textarea name="legal_regulations" rows={2} value={form.legal_regulations} onChange={handle} placeholder="Licensing requirements..." />
            </div>
            <div className="form-group">
              <label>Additional Info</label>
              <textarea name="additional_info" rows={2} value={form.additional_info} onChange={handle} placeholder="Any extra notes..." />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Weapon' : 'Add Weapon'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── View Detail Modal ────────────────────────────────────
function ViewModal({ weapon: w, onClose, onEdit }) {
  const imgSrc = resolveImage(w.image)
  const rows = [
    { label: 'Weapon Type',       value: w.weapon_type       },
    { label: 'Common Use',        value: w.common_use        },
    { label: 'Effective Range',   value: w.effective_range   },
    { label: 'Average Weight',    value: w.average_weight    },
    { label: 'Caliber / Types',   value: w.caliber_types     },
    { label: 'Firing Mechanism',  value: w.firing_mechanism  },
    { label: 'Accuracy Level',    value: w.accuracy_level    },
    { label: 'Noise Level',       value: w.noise_level       },
    { label: 'Suitable For',      value: w.suitable_for      },
    { label: 'Advantages',        value: w.advantages        },
    { label: 'Safety Guidelines', value: w.safety_guidelines },
    { label: 'Legal Regulations', value: w.legal_regulations },
    { label: 'Additional Info',   value: w.additional_info   },
  ]
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box view-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔫 {w.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="view-top">
            {imgSrc
              ? <img src={imgSrc} alt={w.name} className="view-img" onError={(e) => e.target.style.display='none'} />
              : <div className="view-img-placeholder">🔫</div>}
            <div>
              <div className="view-name">{w.name}</div>
              {w.short_desc  && <div className="view-short">{w.short_desc}</div>}
              {w.description && <p className="view-desc">{w.description}</p>}
            </div>
          </div>
          <div className="view-grid">
            {rows.map(({ label, value }) =>
              value ? (
                <div className="view-row" key={label}>
                  <span className="view-label">{label}</span>
                  <span className="view-value">{value}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Close</button>
          <button className="btn-save"   onClick={onEdit}>✏️ Edit</button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Modal ─────────────────────────────────────────
function DeleteModal({ name, onCancel, onConfirm }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', width: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ width: '64px', height: '64px', background: '#fff0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '20px', fontWeight: 700 }}>Delete Weapon?</h3>
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

// ── Main Page ────────────────────────────────────────────
export default function WeaponInfo() {
  const [weapons, setWeapons]           = useState([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [editItem, setEditItem]         = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewItem, setViewItem]         = useState(null)

  useEffect(() => { fetchWeapons() }, [])

  const fetchWeapons = async () => {
    try {
      setLoading(true)
      const res  = await axios.get('http://localhost:3000/api/weapons')
      const data = res.data
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.weapons) ? data.weapons
        : Array.isArray(data?.data)    ? data.data
        : []
      setWeapons(list)
    } catch (err) {
      console.error('Weapons fetch error:', err)
      setWeapons([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (form) => {
    try {
      if (editItem) {
        await axios.put(`http://localhost:3000/api/weapons/${editItem.id}`, form)
      } else {
        await axios.post('http://localhost:3000/api/weapons', form)
      }
      setShowModal(false)
      setEditItem(null)
      fetchWeapons()
    } catch (err) {
      console.error('Save error:', err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/weapons/${id}`)
      setDeleteTarget(null)
      fetchWeapons()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const q = search.toLowerCase()
  const filtered = weapons
    .filter(w =>
      w.name?.toLowerCase().includes(q)            ||
      w.weapon_type?.toLowerCase().includes(q)     ||
      w.common_use?.toLowerCase().includes(q)      ||
      w.accuracy_level?.toLowerCase().includes(q)  ||
      w.firing_mechanism?.toLowerCase().includes(q)
    )
    .sort((a, b) => a.id - b.id)

  const scrapeItems = weapons.map(w => ({ id: w.id, name: w.name }))

  return (
    <div className="admin-wrapper">
      <TopBar />
      <div className="admin-body">
        <Sidebar activeLabel="Weapon info" />
        <main className="main-content">

          {/* ── TOP ACTION ROW — Species page jaisa layout ── */}
          <div className="weapon-top-bar">
            <div className="weapon-search-box">
              <svg width="18" height="18" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, type, use, accuracy level..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="weapon-top-buttons">
              <ScrapePanel entity="weapons" items={scrapeItems} />
              <button className="add-btn" onClick={() => { setEditItem(null); setShowModal(true) }}>
                + Add New Weapon
              </button>
            </div>
          </div>

          {/* ── PAGE HEADING ── */}
          <div className="table-header">
            <h2>Weapon Info <span>({filtered.length} weapons)</span></h2>
          </div>

          {loading ? (
            <div className="table-empty">⏳ Loading weapons...</div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">No weapons found.</div>
          ) : (
            <div className="weapon-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {['S.No','Image','Name','Short Desc','Type','Common Use',
                      'Caliber','Range','Weight','Mechanism','Accuracy','Noise',
                      'Suitable For','Advantages','Safety','Legal','Additional Info','Actions'
                    ].map(col => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w, i) => (
                    <tr key={w.id} onClick={() => setViewItem(w)} style={{ cursor: 'pointer' }}>
                      <td style={{ textAlign:'center', color:'#888' }}>{i + 1}</td>
                      <td>
                        {resolveImage(w.image)
                          ? <img src={resolveImage(w.image)} alt={w.name} className="weapon-img"
                              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                          : null}
                        <div className="weapon-img-placeholder" style={{ display: resolveImage(w.image) ? 'none' : 'flex' }}>🔫</div>
                      </td>
                      <td style={{ fontWeight:'600', color:'#333' }}>{w.name}</td>
                      <td><div className="cell-clamp-2">{w.short_desc || '–'}</div></td>
                      <td>{w.weapon_type || '–'}</td>
                      <td><div className="cell-clamp-2">{w.common_use || '–'}</div></td>
                      <td><div className="cell-clamp-2">{w.caliber_types || '–'}</div></td>
                      <td>{w.effective_range || '–'}</td>
                      <td>{w.average_weight || '–'}</td>
                      <td><div className="cell-clamp-2">{w.firing_mechanism || '–'}</div></td>
                      <td>
                        {w.accuracy_level
                          ? <span className={`accuracy-badge ${badgeClass(w.accuracy_level)}`}>{w.accuracy_level}</span>
                          : '–'}
                      </td>
                      <td>{w.noise_level || '–'}</td>
                      <td><div className="cell-clamp">{w.suitable_for || '–'}</div></td>
                      <td><div className="cell-clamp">{w.advantages || '–'}</div></td>
                      <td><div className="cell-clamp">{w.safety_guidelines || '–'}</div></td>
                      <td><div className="cell-clamp">{w.legal_regulations || '–'}</div></td>
                      <td><div className="cell-clamp">{w.additional_info || '–'}</div></td>
                      <td>
                        <div className="sp-actions" onClick={(e) => e.stopPropagation()}>
                          <ActionButtons
                            isEditing={false}
                            onEdit={   () => { setEditItem(w); setShowModal(true) }}
                            onDelete={ () => setDeleteTarget(w)}
                            onSave={   () => {}}
                            onCancel={ () => {}}
                            showFillButton={true}
                            emptyFields={getEmptyWeaponFields(w)}
                            onIncompleteFieldSave={(filledData) => {
                              axios.put(`http://localhost:3000/api/weapons/${w.id}`, { ...w, ...filledData })
                                .then(() => fetchWeapons())
                                .catch(err => console.error('Fill save error:', err))
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {viewItem && !showModal && (
        <ViewModal
          weapon={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => { setEditItem(viewItem); setViewItem(null); setShowModal(true) }}
        />
      )}
      {showModal && (
        <WeaponModal
          weapon={editItem}
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