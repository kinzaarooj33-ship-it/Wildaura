import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './specieinfo.css'

import Sidebar       from './components/sidebar.jsx'
import TopBar        from './components/topbar.jsx'
import ActionButtons from './components/actionbuttons.jsx'
import ScrapePanel   from './components/ScrapePanel.jsx'

const MONTHS_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function formatHuntingSeason(selectedMonths) {
  if (!selectedMonths || selectedMonths.length === 0) return '–'
  let monthArray = Array.isArray(selectedMonths)
    ? selectedMonths
    : selectedMonths.split(',').map(m => m.trim())
  const sorted = monthArray.filter(m => MONTHS_ORDER.includes(m)).sort((a, b) => MONTHS_ORDER.indexOf(a) - MONTHS_ORDER.indexOf(b))
  if (sorted.length === 0) return selectedMonths
  if (sorted.length === 12) return "Year Round"
  let ranges = []
  let start = sorted[0]
  let prev  = sorted[0]
  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i]
    const prevIdx = MONTHS_ORDER.indexOf(prev)
    const currIdx = current ? MONTHS_ORDER.indexOf(current) : -1
    if (current && currIdx === prevIdx + 1) {
      prev = current
    } else {
      const startShort = start.substring(0, 3)
      const prevShort  = prev.substring(0, 3)
      if (start === prev) {
        ranges.push(startShort)
      } else if (MONTHS_ORDER.indexOf(prev) === MONTHS_ORDER.indexOf(start) + 1) {
        ranges.push(`${startShort}, ${prevShort}`)
      } else {
        ranges.push(`${startShort}-${prevShort}`)
      }
      start = current
      prev  = current
    }
  }
  return ranges.join(', ')
}

function SeasonDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const currentSelections = value
    ? value.split(',').map(m => m.trim()).filter(m => MONTHS_ORDER.includes(m))
    : []

  const handleCheckboxChange = (month) => {
    let updated
    if (currentSelections.includes(month)) {
      updated = currentSelections.filter(m => m !== month)
    } else {
      updated = [...currentSelections, month]
    }
    onChange(updated.join(', '))
  }

  useEffect(() => {
    if (!isOpen) return
    const closeMenu = () => setIsOpen(false)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [isOpen])

  return (
    <div className="season-dropdown-container" onClick={(e) => e.stopPropagation()}>
      <div className="season-dropdown-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{currentSelections.length > 0 ? formatHuntingSeason(currentSelections) : "Select Months..."}</span>
        <span className="arrow-icon">▼</span>
      </div>
      {isOpen && (
        <div className="season-dropdown-menu">
          {MONTHS_ORDER.map((month) => (
            <label key={month} className="season-checkbox-label">
              <input type="checkbox" checked={currentSelections.includes(month)} onChange={() => handleCheckboxChange(month)} />
              <span>{month}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function resolveImage(img) {
  if (!img) return null
  if (img.startsWith('http')) return img
  return `http://localhost:5000/uploads/${img}`
}

// ── Species Modal — alert() hataya, inline error state lagaya ──
function SpeciesModal({ species, onClose, onSave }) {
  const isEdit = !!species
  const blank = {
    name: '', subtitle: '', description: '', image: '',
    status: '', scientific_name: '', common_name: '',
    animal_type: '', lifespan: '', found_in: '',
    common_areas: '', habitat_type: '', climate: '',
    legal_status: '', hunting_season: '', permit_required: '',
    average_weight: '', hunting_methods: '', conservation_status: '',
  }
  const [form, setForm]       = useState(species ? { ...species } : blank)
  const [modalError, setModalError] = useState('')
  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (modalError) setModalError('')
  }

  const fields = [
    { key: 'name',                label: 'Name',               required: true },
    { key: 'subtitle',            label: 'Subtitle'            },
    { key: 'scientific_name',     label: 'Scientific Name'     },
    { key: 'common_name',         label: 'Common Name'         },
    { key: 'animal_type',         label: 'Animal Type'         },
    { key: 'status',              label: 'Status'              },
    { key: 'conservation_status', label: 'Conservation Status' },
    { key: 'lifespan',            label: 'Lifespan'            },
    { key: 'found_in',            label: 'Found In'            },
    { key: 'common_areas',        label: 'Common Areas'        },
    { key: 'habitat_type',        label: 'Habitat Type'        },
    { key: 'climate',             label: 'Climate'             },
    { key: 'legal_status',        label: 'Legal Status'        },
    { key: 'hunting_season',      label: 'Hunting Season',     custom: true },
    { key: 'hunting_methods',     label: 'Hunting Methods'     },
    { key: 'permit_required',     label: 'Permit Required'     },
    { key: 'average_weight',      label: 'Average Weight (kg)' },
    { key: 'image',               label: 'Image URL / Filename'},
  ]

  const handleSaveClick = () => {
    if (!form.name.trim()) {
      setModalError('Name is required!')
      return
    }
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit Species' : '➕ Add New Species'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* ── Inline error instead of alert() ── */}
          {modalError && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fc8181',
              color: '#c53030', padding: '10px 14px', borderRadius: '8px',
              marginBottom: '14px', fontSize: '13px', fontWeight: 500,
            }}>
              ⚠️ {modalError}
            </div>
          )}

          {fields.map(({ key, label, required, custom }) => (
            <div className="form-group" key={key}>
              <label>{label}{required && <span className="required"> *</span>}</label>
              {custom && key === 'hunting_season' ? (
                <SeasonDropdown
                  value={form.hunting_season}
                  onChange={(val) => setForm({ ...form, hunting_season: val })}
                />
              ) : (
                <input
                  name={key}
                  value={form[key] || ''}
                  onChange={handle}
                  placeholder={label}
                  style={key === 'name' && modalError ? { border: '1.5px solid #e53e3e' } : {}}
                />
              )}
            </div>
          ))}
          <div className="form-group full-width">
            <label>Description</label>
            <textarea name="description" rows={3} value={form.description || ''} onChange={handle} placeholder="Enter description..." />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSaveClick}>
            {isEdit ? 'Update' : 'Add Species'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Modal — custom styled (class-based remove) ──
function DeleteModal({ name, onCancel, onConfirm }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', width: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ width: '64px', height: '64px', background: '#fff0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '20px', fontWeight: 700 }}>Delete Species?</h3>
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

const allFields = [
  { key: 'subtitle',            label: 'Subtitle'            },
  { key: 'scientific_name',     label: 'Scientific Name'     },
  { key: 'common_name',         label: 'Common Name'         },
  { key: 'animal_type',         label: 'Animal Type'         },
  { key: 'status',              label: 'Status'              },
  { key: 'conservation_status', label: 'Conservation Status' },
  { key: 'lifespan',            label: 'Lifespan'            },
  { key: 'found_in',            label: 'Found In'            },
  { key: 'common_areas',        label: 'Common Areas'        },
  { key: 'habitat_type',        label: 'Habitat'             },
  { key: 'climate',             label: 'Climate'             },
  { key: 'legal_status',        label: 'Legal Status'        },
  { key: 'hunting_season',      label: 'Hunting Season'      },
  { key: 'hunting_methods',     label: 'Hunting Methods'     },
  { key: 'permit_required',     label: 'Permit Required'     },
  { key: 'average_weight',      label: 'Avg. Weight (kg)'    },
  { key: 'description',         label: 'Description'         },
  { key: 'image',               label: 'Image'               },
]

export default function SpeciesInfo() {
  const [species, setSpecies]           = useState([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [editItem, setEditItem]         = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingId, setEditingId]       = useState(null)
  const [editData, setEditData]         = useState({})
  const [saveError, setSaveError]       = useState(null)

  useEffect(() => { fetchSpecies() }, [])

  async function fetchSpecies() {
    try {
      setLoading(true)
      const res  = await fetch('http://localhost:3000/api/species')
      const data = await res.json()
      setSpecies(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      console.error('Fetch failed:', err)
      setSpecies([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form) {
    try {
      if (editItem) {
        await fetch(`http://localhost:3000/api/species/${editItem.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
      } else {
        await fetch('http://localhost:3000/api/species', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
      }
      setShowModal(false)
      setEditItem(null)
      fetchSpecies()
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  const handleEdit   = (s) => { setEditingId(s.id); setEditData({ ...s }); setSaveError(null) }
  const handleCancel = ()  => { setEditingId(null); setSaveError(null) }

  const handleInlineSave = (id) => {
    fetch(`http://localhost:3000/api/species/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData),
    })
      .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t) }); return r.json() })
      .then(() => { setEditingId(null); setEditData({}); fetchSpecies() })
      .catch(e => setSaveError('Save failed: ' + e.message))
  }

  async function handleDelete(id) {
    try {
      await fetch(`http://localhost:3000/api/species/${id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      fetchSpecies()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const filtered = species.filter((s) =>
    [s.name, s.scientific_name, s.animal_type, s.common_name, s.found_in, s.status]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  )

  const scrapeItems = species.map(s => ({ id: s.id, name: s.name }))

  const cols = [
    { key: 's_no',                label: 'S.No',            w: '50px'  },
    { key: 'image',               label: 'Image',           w: '70px'  },
    { key: 'name',                label: 'Name',            w: '120px' },
    { key: 'subtitle',            label: 'Subtitle',        w: '140px' },
    { key: 'scientific_name',     label: 'Scientific Name', w: '150px' },
    { key: 'common_name',         label: 'Common Name',     w: '140px' },
    { key: 'animal_type',         label: 'Type',            w: '90px' },
    { key: 'status',              label: 'Status',          w: '130px' },
    { key: 'conservation_status', label: 'Conservation',    w: '130px' },
    { key: 'lifespan',            label: 'Lifespan',        w: '100px' },
    { key: 'found_in',            label: 'Found In',        w: '170px' },
    { key: 'common_areas',        label: 'Common Areas',    w: '170px' },
    { key: 'habitat_type',        label: 'Habitat',         w: '150px' },
    { key: 'climate',             label: 'Climate',         w: '130px' },
    { key: 'legal_status',        label: 'Legal Status',    w: '130px' },
    { key: 'hunting_season',      label: 'Hunting Season',  w: '170px' },
    { key: 'hunting_methods',     label: 'Hunting Methods', w: '150px' },
    { key: 'permit_required',     label: 'Permit',          w: '120px'  },
    { key: 'average_weight',      label: 'Avg. Wt (kg)',    w: '100px' },
    { key: 'scraped_at',          label: 'Scraped At',      w: '90px' },
    { key: 'actions',             label: 'Actions',         w: '130px' },
  ]

  const tdBase = {
    fontSize: '11px', lineHeight: '1.4', verticalAlign: 'top',
    padding: '8px 10px', overflow: 'hidden',
    wordBreak: 'break-word', whiteSpace: 'normal',
  }
  const tdEllipsisStyle = { ...tdBase, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
  const tdActionsStyle  = { ...tdBase, overflow: 'visible', position: 'relative', textAlign: 'center', whiteSpace: 'nowrap' }

  function formatDate(dateStr) {
    if (!dateStr) return '–'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="admin-wrapper">
      <TopBar />
      <div className="admin-body">
        <Sidebar activeLabel="Specie Info" />
        <main className="main-content">

          <div className="page-header" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input className="search-input"
              placeholder="🔍 Search by name, scientific name, type, location, status..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <ScrapePanel entity="species" items={scrapeItems} />
            <button
              onClick={() => { setEditItem(null); setShowModal(true) }}
              style={{ padding: '10px 20px', background: '#8a9e3a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px' }}
            >+ Add New Specie</button>
          </div>

          <div className="table-header">
            <h2 className="page-title">
              Species Info <span className="user-count">({filtered.length} species)</span>
            </h2>
          </div>

          {saveError && <div className="save-error">⚠️ {saveError}</div>}

          {loading ? (
            <div className="sp-loading">⏳ Loading species data...</div>
          ) : filtered.length === 0 && search ? (
            <div className="sp-loading">🔍 No results for "{search}"</div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="data-table sp-table" style={{ tableLayout: 'fixed', minWidth: '2600px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th key={c.key} style={{ width: c.w, minWidth: c.w, padding: '8px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={cols.length} className="no-data">No species found.</td></tr>
                  ) : (
                    filtered.map((s, index) => {
                      const imgSrc    = resolveImage(s.image)
                      const isEditing = editingId === s.id
                      const emptyFields = allFields.filter(
                        f => !s[f.key] || s[f.key].toString().trim() === ''
                      )

                      return (
                        <tr key={s.id}>
                          <td style={{ ...tdBase, textAlign: 'center' }}>{index + 1}</td>

                          <td style={tdBase}>
                            {imgSrc ? (
                              <img src={imgSrc} alt={s.name} className="sp-thumb"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                            ) : null}
                            <div className="sp-thumb-placeholder" style={{ display: imgSrc ? 'none' : 'flex' }}>🐾</div>
                          </td>

                          <td style={tdEllipsisStyle} title={s.name}>
                            {isEditing
                              ? <input className="edit-input" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                              : <strong>{s.name}</strong>}
                          </td>

                          <td style={tdEllipsisStyle} title={s.subtitle}>
                            {isEditing
                              ? <input className="edit-input" value={editData.subtitle || ''} onChange={e => setEditData({ ...editData, subtitle: e.target.value })} />
                              : <span className="sp-muted">{s.subtitle || '–'}</span>}
                          </td>

                          <td style={tdEllipsisStyle} title={s.scientific_name}>
                            {isEditing
                              ? <input className="edit-input" value={editData.scientific_name || ''} onChange={e => setEditData({ ...editData, scientific_name: e.target.value })} />
                              : <span className="sp-italic">{s.scientific_name || '–'}</span>}
                          </td>

                          <td style={tdEllipsisStyle} title={s.common_name}>
                            {isEditing
                              ? <input className="edit-input" value={editData.common_name || ''} onChange={e => setEditData({ ...editData, common_name: e.target.value })} />
                              : s.common_name || '–'}
                          </td>

                          <td style={tdEllipsisStyle}>
                            {isEditing
                              ? <input className="edit-input" value={editData.animal_type || ''} onChange={e => setEditData({ ...editData, animal_type: e.target.value })} />
                              : s.animal_type || '–'}
                          </td>

                          <td style={tdBase}>
                            {isEditing
                              ? <input className="edit-input" value={editData.status || ''} onChange={e => setEditData({ ...editData, status: e.target.value })} />
                              : s.status ? <span className="sp-badge">{s.status}</span> : '–'}
                          </td>

                          <td style={tdBase}>
                            {isEditing
                              ? <input className="edit-input" value={editData.conservation_status || ''} onChange={e => setEditData({ ...editData, conservation_status: e.target.value })} />
                              : s.conservation_status
                                ? <span className={`sp-conservation ${s.conservation_status.toLowerCase().replace(/ /g, '-')}`}>{s.conservation_status}</span>
                                : '–'}
                          </td>

                          <td style={tdBase}>
                            {isEditing
                              ? <input className="edit-input" value={editData.lifespan || ''} onChange={e => setEditData({ ...editData, lifespan: e.target.value })} />
                              : s.lifespan || '–'}
                          </td>

                          <td style={tdEllipsisStyle} title={s.found_in}>
                            {isEditing
                              ? <input className="edit-input" value={editData.found_in || ''} onChange={e => setEditData({ ...editData, found_in: e.target.value })} />
                              : s.found_in || '–'}
                          </td>

                          <td style={tdEllipsisStyle} title={s.common_areas}>
                            {isEditing
                              ? <input className="edit-input" value={editData.common_areas || ''} onChange={e => setEditData({ ...editData, common_areas: e.target.value })} />
                              : s.common_areas || '–'}
                          </td>

                          <td style={tdEllipsisStyle}>
                            {isEditing
                              ? <input className="edit-input" value={editData.habitat_type || ''} onChange={e => setEditData({ ...editData, habitat_type: e.target.value })} />
                              : s.habitat_type || '–'}
                          </td>

                          <td style={tdEllipsisStyle}>
                            {isEditing
                              ? <input className="edit-input" value={editData.climate || ''} onChange={e => setEditData({ ...editData, climate: e.target.value })} />
                              : s.climate || '–'}
                          </td>

                          <td style={tdEllipsisStyle}>
                            {isEditing
                              ? <input className="edit-input" value={editData.legal_status || ''} onChange={e => setEditData({ ...editData, legal_status: e.target.value })} />
                              : s.legal_status || '–'}
                          </td>

                          <td style={tdBase}>
                            {isEditing ? (
                              <SeasonDropdown
                                value={editData.hunting_season || ''}
                                onChange={val => setEditData({ ...editData, hunting_season: val })}
                              />
                            ) : (
                              <span>{formatHuntingSeason(s.hunting_season)}</span>
                            )}
                          </td>

                          <td style={tdEllipsisStyle}>
                            {isEditing
                              ? <input className="edit-input" value={editData.hunting_methods || ''} onChange={e => setEditData({ ...editData, hunting_methods: e.target.value })} />
                              : s.hunting_methods || '–'}
                          </td>

                          <td style={tdBase}>
                            {isEditing
                              ? <input className="edit-input" value={editData.permit_required || ''} onChange={e => setEditData({ ...editData, permit_required: e.target.value })} />
                              : <span className={`sp-permit ${s.permit_required === 'Yes' ? 'yes' : 'no'}`}>{s.permit_required || '–'}</span>}
                          </td>

                          <td style={tdBase}>
                            {isEditing
                              ? <input className="edit-input" value={editData.average_weight || ''} onChange={e => setEditData({ ...editData, average_weight: e.target.value })} />
                              : s.average_weight ? `${s.average_weight} kg` : '–'}
                          </td>

                          <td style={{ ...tdBase, color: '#888' }}>{formatDate(s.scraped_at)}</td>

                          <td style={tdActionsStyle}>
                            <ActionButtons
                              isEditing={isEditing}
                              onEdit={   () => handleEdit(s)}
                              onSave={   () => handleInlineSave(s.id)}
                              onCancel={handleCancel}
                              onDelete={ () => setDeleteTarget(s)}
                              showFillButton={true}
                              emptyFields={emptyFields}
                              onIncompleteFieldSave={(filledData) => {
                                fetch(`http://localhost:3000/api/species/${s.id}`, {
                                  method:  'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body:    JSON.stringify({ ...s, ...filledData }),
                                }).then(() => fetchSpecies())
                              }}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <SpeciesModal
          species={editItem}
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