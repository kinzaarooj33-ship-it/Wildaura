import { useState, useEffect } from 'react'
import './user.css'

import Sidebar       from './components/sidebar.jsx'
import TopBar        from './components/topbar.jsx'
import ActionButtons from './components/actionbuttons.jsx'
import ScrapePanel   from './components/ScrapePanel.jsx'

const CATEGORY_OPTIONS   = ['Prohibited', 'License', 'Seasonal', 'Special Permit']
const PAKISTAN_PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan']

const emptyLaw = { title: '', category: 'License', description: '', action_type: '', action_detail: '', reference: '' }
const emptyAct = { name: '', province: '', year: '', description: '', key_points: '' }

const validateYear = (year) =>
  /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= 2026

const tdStyle = { whiteSpace: 'normal', wordBreak: 'break-word' }

// ── Laws fields for empty check ──────────────────────────
const ALL_LAW_FIELDS = [
  { key: 'title',         label: 'Title'         },
  { key: 'category',      label: 'Category'      },
  { key: 'description',   label: 'Description'   },
  { key: 'action_type',   label: 'Action Type'   },
  { key: 'action_detail', label: 'Action Detail' },
  { key: 'reference',     label: 'Reference'     },
]

// ── Acts fields for empty check ──────────────────────────
const ALL_ACT_FIELDS = [
  { key: 'name',        label: 'Name'        },
  { key: 'province',    label: 'Province'    },
  { key: 'year',        label: 'Year'        },
  { key: 'description', label: 'Description' },
  { key: 'key_points',  label: 'Key Points'  },
]

const getEmptyLawFields = (law) =>
  ALL_LAW_FIELDS.filter(f => !law[f.key] || law[f.key].toString().trim() === '')

const getEmptyActFields = (act) =>
  ALL_ACT_FIELDS.filter(f => !act[f.key] || act[f.key].toString().trim() === '')

export default function HuntingLaws() {
  const [activeTab, setActiveTab] = useState('laws')

  // ── LAWS STATE ──
  const [laws, setLaws]                         = useState([])
  const [lawsLoading, setLawsLoading]           = useState(true)
  const [lawsError, setLawsError]               = useState(null)
  const [lawSearch, setLawSearch]               = useState('')
  const [editingLawId, setEditingLawId]         = useState(null)
  const [editLawData, setEditLawData]           = useState({})
  const [deleteLawConfirm, setDeleteLawConfirm] = useState(null)
  const [showAddLaw, setShowAddLaw]             = useState(false)
  const [newLaw, setNewLaw]                     = useState(emptyLaw)
  const [lawSaveError, setLawSaveError]         = useState(null)

  // ── ACTS STATE ──
  const [acts, setActs]                         = useState([])
  const [actsLoading, setActsLoading]           = useState(true)
  const [actsError, setActsError]               = useState(null)
  const [actSearch, setActSearch]               = useState('')
  const [editingActId, setEditingActId]         = useState(null)
  const [editActData, setEditActData]           = useState({})
  const [deleteActConfirm, setDeleteActConfirm] = useState(null)
  const [showAddAct, setShowAddAct]             = useState(false)
  const [newAct, setNewAct]                     = useState(emptyAct)
  const [actSaveError, setActSaveError]         = useState(null)

  // ── FETCH ──
  const fetchLaws = () => {
    setLawsLoading(true); setLawsError(null)
    fetch('http://localhost:3000/api/admin/laws')
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json() })
      .then(d => {
        const sorted = Array.isArray(d)
          ? d.sort((a, b) =>
              String(a.title || '').toLowerCase().localeCompare(String(b.title || '').toLowerCase())
            )
          : []
        setLaws(sorted)
      })
      .catch(e => setLawsError(e.message))
      .finally(() => setLawsLoading(false))
  }

  const fetchActs = () => {
    setActsLoading(true); setActsError(null)
    fetch('http://localhost:3000/api/admin/acts')
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json() })
      .then(d => {
        const sorted = Array.isArray(d)
          ? d.sort((a, b) =>
              String(a.name || '').toLowerCase().localeCompare(String(b.name || '').toLowerCase())
            )
          : []
        setActs(sorted)
      })
      .catch(e => setActsError(e.message))
      .finally(() => setActsLoading(false))
  }

  useEffect(() => { fetchLaws(); fetchActs() }, [])

  // ── LAWS HANDLERS ──
  const handleEditLaw = (law) => {
    setEditingLawId(law.id)
    setEditLawData({ ...law })
    setLawSaveError(null)
  }

  const handleSaveLaw = (id) => {
    if (!editLawData.title.trim())         { setLawSaveError('❌ Title is required'); return }
    if (!editLawData.description.trim())   { setLawSaveError('❌ Description is required'); return }
    if (!editLawData.reference.trim())     { setLawSaveError('❌ Reference is required'); return }
    if (!editLawData.action_type.trim())   { setLawSaveError('❌ Action Type is required'); return }
    if (!editLawData.action_detail.trim()) { setLawSaveError('❌ Action Detail is required'); return }

    fetch(`http://localhost:3000/api/admin/laws/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editLawData),
    })
      .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t) }); return r.json() })
      .then(() => { setEditingLawId(null); setEditLawData({}); setLawSaveError(null); fetchLaws() })
      .catch(e => setLawSaveError('Save failed: ' + e.message))
  }

  const handleAddLaw = () => {
    if (!newLaw.title.trim())         { setLawSaveError('❌ Title is required'); return }
    if (!newLaw.description.trim())   { setLawSaveError('❌ Description is required'); return }
    if (!newLaw.reference.trim())     { setLawSaveError('❌ Reference is required'); return }
    if (!newLaw.action_type.trim())   { setLawSaveError('❌ Action Type is required'); return }
    if (!newLaw.action_detail.trim()) { setLawSaveError('❌ Action Detail is required'); return }

    fetch('http://localhost:3000/api/admin/laws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLaw),
    })
      .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t) }); return r.json() })
      .then(() => { setShowAddLaw(false); setNewLaw(emptyLaw); setLawSaveError(null); fetchLaws() })
      .catch(e => setLawSaveError('Add failed: ' + e.message))
  }

  const confirmDeleteLaw = () => {
    fetch(`http://localhost:3000/api/admin/laws/${deleteLawConfirm}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw new Error('Delete failed'); return r.json() })
      .then(() => { fetchLaws(); setDeleteLawConfirm(null) })
      .catch(e => { console.error(e); setDeleteLawConfirm(null) })
  }

  // ── ACTS HANDLERS ──
  const handleEditAct = (act) => {
    setEditingActId(act.id)
    setEditActData({ ...act })
    setActSaveError(null)
  }

  const handleSaveAct = (id) => {
    if (!editActData.name.trim())         { setActSaveError('❌ Name is required'); return }
    if (!editActData.province.trim())     { setActSaveError('❌ Province is required'); return }
    if (!String(editActData.year).trim()) { setActSaveError('❌ Year is required'); return }
    if (!validateYear(editActData.year))  { setActSaveError('❌ Year must be 4 digits (1900-2026)'); return }
    if (!editActData.description.trim())  { setActSaveError('❌ Description is required'); return }
    if (!editActData.key_points.trim())   { setActSaveError('❌ Key Points are required'); return }

    fetch(`http://localhost:3000/api/admin/acts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editActData),
    })
      .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t) }); return r.json() })
      .then(() => { setEditingActId(null); setEditActData({}); setActSaveError(null); fetchActs() })
      .catch(e => setActSaveError('Save failed: ' + e.message))
  }

  const handleAddAct = () => {
    if (!newAct.name.trim())         { setActSaveError('❌ Name is required'); return }
    if (!newAct.province.trim())     { setActSaveError('❌ Province is required'); return }
    if (!String(newAct.year).trim()) { setActSaveError('❌ Year is required'); return }
    if (!validateYear(newAct.year))  { setActSaveError('❌ Year must be 4 digits (1900-2026)'); return }
    if (!newAct.description.trim())  { setActSaveError('❌ Description is required'); return }
    if (!newAct.key_points.trim())   { setActSaveError('❌ Key Points are required'); return }

    fetch('http://localhost:3000/api/admin/acts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAct),
    })
      .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t) }); return r.json() })
      .then(() => { setShowAddAct(false); setNewAct(emptyAct); setActSaveError(null); fetchActs() })
      .catch(e => setActSaveError('Add failed: ' + e.message))
  }

  const confirmDeleteAct = () => {
    fetch(`http://localhost:3000/api/admin/acts/${deleteActConfirm}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw new Error('Delete failed'); return r.json() })
      .then(() => { fetchActs(); setDeleteActConfirm(null) })
      .catch(e => { console.error(e); setDeleteActConfirm(null) })
  }

  // ── FILTER ──
  const filteredLaws = laws.filter(l => {
    if (!lawSearch.trim()) return true
    const q = lawSearch.toLowerCase()
    return (
      String(l.title    || '').toLowerCase().includes(q) ||
      String(l.category || '').toLowerCase().includes(q) ||
      String(l.reference|| '').toLowerCase().includes(q)
    )
  })

  const filteredActs = acts.filter(a => {
    if (!actSearch.trim()) return true
    const q = actSearch.toLowerCase()
    return (
      String(a.name    || '').toLowerCase().includes(q) ||
      String(a.province|| '').toLowerCase().includes(q) ||
      String(a.year    || '').toLowerCase().includes(q)
    )
  })

  // ── Category Badge ──
  const categoryBadge = (cat) => {
    const colors = {
      Prohibited:       { bg: '#ffe0e0', color: '#c0392b' },
      License:          { bg: '#e0f0ff', color: '#2980b9' },
      Seasonal:         { bg: '#fff8e0', color: '#d68910' },
      'Special Permit': { bg: '#f0ffe0', color: '#27ae60' },
    }
    const c = colors[cat] || { bg: '#f0f0f0', color: '#555' }
    return (
      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: c.bg, color: c.color }}>
        {cat}
      </span>
    )
  }

  // ── Year Input ──
  const YearInput = ({ value, onChange }) => {
    const [error, setError] = useState('')
    const handleChange = (e) => {
      const v = e.target.value
      if (v === '' || /^\d{0,4}$/.test(v)) { onChange(e); setError('') }
      else setError('4 digits only')
    }
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <input className="edit-input" value={value} placeholder="e.g. 2024"
          onChange={handleChange} style={{ width: '100%' }} maxLength={4} />
        {error && (
          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#e53e3e', fontSize: '10px', pointerEvents: 'none' }}>
            {error}
          </span>
        )}
      </div>
    )
  }

  // ── Province Dropdown ──
  const ProvinceDropdown = ({ value, onChange }) => (
    <select className="edit-input" value={value} onChange={onChange} style={{ width: '100%', cursor: 'pointer' }}>
      <option value="">Select Province...</option>
      {PAKISTAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
    </select>
  )

  return (
    <div className="admin-wrapper">
      <TopBar />
      <div className="admin-body">
        <Sidebar activeLabel="Hunting Laws" />
        <main className="main-content">

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button onClick={() => setActiveTab('laws')} style={{
              padding: '10px 28px', borderRadius: '8px', fontWeight: '700', fontSize: '14px',
              cursor: 'pointer', border: 'none',
              background: activeTab === 'laws' ? '#8a9e3a' : '#f0f0f0',
              color: activeTab === 'laws' ? '#fff' : '#555',
            }}>🚫 Laws ({laws.length})</button>
            <button onClick={() => setActiveTab('acts')} style={{
              padding: '10px 28px', borderRadius: '8px', fontWeight: '700', fontSize: '14px',
              cursor: 'pointer', border: 'none',
              background: activeTab === 'acts' ? '#8a9e3a' : '#f0f0f0',
              color: activeTab === 'acts' ? '#fff' : '#555',
            }}>⚖️ Acts ({acts.length})</button>
          </div>

          {/* ══════════════════════════════
               LAWS TAB
          ══════════════════════════════ */}
          {activeTab === 'laws' && (
            <>
              {/* ✅ Search + Scrape Button + Add Law Button */}
              <div className="page-header" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input className="search-input" placeholder="🔍 Search laws..."
                  value={lawSearch} onChange={e => setLawSearch(e.target.value)} />

                {/* ✅ Scrape Button — same style jaise Species page pe hai */}
                <ScrapePanel entity="laws" items={laws} />

                <button
                  onClick={() => { setShowAddLaw(true); setLawSaveError(null) }}
                  style={{ padding: '10px 20px', background: '#8a9e3a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px' }}
                >+ Add Law</button>
              </div>

              <div className="table-header">
                <h2 className="page-title">Laws <span className="user-count">({filteredLaws.length})</span></h2>
              </div>

              {lawSaveError && <div className="save-error">⚠️ {lawSaveError}</div>}
              {lawsError && (
                <div className="save-error">
                  ⚠️ Could not load laws: {lawsError}
                  <button onClick={fetchLaws} style={{ marginLeft: 8, cursor: 'pointer', padding: '2px 10px', borderRadius: 6, border: '1px solid #e53e3e', background: '#fff', color: '#e53e3e', fontWeight: 600 }}>Retry</button>
                </div>
              )}

              <div className="table-wrapper">
                <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <colgroup>
                    <col style={{ width: '50px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '90px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '100px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Action Type</th>
                      <th>Action Detail</th>
                      <th>Reference</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lawsLoading ? (
                      <tr><td colSpan={8} className="no-data">⏳ Loading laws...</td></tr>
                    ) : filteredLaws.length === 0 ? (
                      <tr><td colSpan={8} className="no-data">No laws found</td></tr>
                    ) : filteredLaws.map((law, i) => (
                      <tr key={law.id}>

                        <td className="sno-cell">{i + 1}</td>

                        <td style={tdStyle}>
                          {editingLawId === law.id
                            ? <input className="edit-input" value={editLawData.title}
                                placeholder="Law title"
                                onChange={e => setEditLawData({ ...editLawData, title: e.target.value })}
                                style={{ width: '100%' }} />
                            : law.title || '–'}
                        </td>

                        <td>
                          {editingLawId === law.id
                            ? <select className="edit-input" value={editLawData.category}
                                onChange={e => setEditLawData({ ...editLawData, category: e.target.value })}>
                                {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                              </select>
                            : categoryBadge(law.category)}
                        </td>

                        <td style={tdStyle}>
                          {editingLawId === law.id
                            ? <textarea className="edit-input" rows={2} value={editLawData.description}
                                onChange={e => setEditLawData({ ...editLawData, description: e.target.value })}
                                style={{ resize: 'vertical', minHeight: '60px' }} />
                            : law.description || '–'}
                        </td>

                        <td style={tdStyle}>
                          {editingLawId === law.id
                            ? <input className="edit-input" value={editLawData.action_type}
                                onChange={e => setEditLawData({ ...editLawData, action_type: e.target.value })}
                                style={{ width: '100%' }} />
                            : law.action_type || '–'}
                        </td>

                        <td style={tdStyle}>
                          {editingLawId === law.id
                            ? <input className="edit-input" value={editLawData.action_detail}
                                onChange={e => setEditLawData({ ...editLawData, action_detail: e.target.value })}
                                style={{ width: '100%' }} />
                            : law.action_detail || '–'}
                        </td>

                        <td style={tdStyle}>
                          {editingLawId === law.id
                            ? <input className="edit-input" value={editLawData.reference}
                                onChange={e => setEditLawData({ ...editLawData, reference: e.target.value })}
                                style={{ width: '100%' }} />
                            : law.reference || '–'}
                        </td>

                        <td style={{ overflow: 'visible', position: 'relative' }}>
                          <ActionButtons
                            isEditing={editingLawId === law.id}
                            onEdit={   () => handleEditLaw(law)}
                            onSave={   () => handleSaveLaw(law.id)}
                            onCancel={ () => { setEditingLawId(null); setLawSaveError(null) }}
                            onDelete={ () => setDeleteLawConfirm(law.id)}
                            showFillButton={true}
                            emptyFields={getEmptyLawFields(law)}
                            onIncompleteFieldSave={(filledData) => {
                              fetch(`http://localhost:3000/api/admin/laws/${law.id}`, {
                                method:  'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body:    JSON.stringify({ ...law, ...filledData }),
                              }).then(() => fetchLaws())
                            }}
                          />
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══════════════════════════════
               ACTS TAB
          ══════════════════════════════ */}
          {activeTab === 'acts' && (
            <>
              <div className="page-header" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input className="search-input" placeholder="🔍 Search acts..."
                  value={actSearch} onChange={e => setActSearch(e.target.value)} />
                <button
                  onClick={() => { setShowAddAct(true); setActSaveError(null) }}
                  style={{ padding: '10px 20px', background: '#8a9e3a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px' }}
                >+ Add Act</button>
              </div>

              <div className="table-header">
                <h2 className="page-title">Acts <span className="user-count">({filteredActs.length})</span></h2>
              </div>

              {actSaveError && <div className="save-error">⚠️ {actSaveError}</div>}
              {actsError && (
                <div className="save-error">
                  ⚠️ Could not load acts: {actsError}
                  <button onClick={fetchActs} style={{ marginLeft: 8, cursor: 'pointer', padding: '2px 10px', borderRadius: 6, border: '1px solid #e53e3e', background: '#fff', color: '#e53e3e', fontWeight: 600 }}>Retry</button>
                </div>
              )}

              <div className="table-wrapper">
                <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <colgroup>
                    <col style={{ width: '50px' }} />
                    <col style={{ width: '180px' }} />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '70px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '130px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Name</th>
                      <th>Province</th>
                      <th>Year</th>
                      <th>Description</th>
                      <th>Key Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actsLoading ? (
                      <tr><td colSpan={7} className="no-data">⏳ Loading acts...</td></tr>
                    ) : filteredActs.length === 0 ? (
                      <tr><td colSpan={7} className="no-data">No acts found</td></tr>
                    ) : filteredActs.map((act, i) => (
                      <tr key={act.id}>

                        <td className="sno-cell">{i + 1}</td>

                        <td style={tdStyle}>
                          {editingActId === act.id
                            ? <input className="edit-input" value={editActData.name}
                                placeholder="Act name"
                                onChange={e => setEditActData({ ...editActData, name: e.target.value })}
                                style={{ width: '100%' }} />
                            : act.name || '–'}
                        </td>

                        <td style={tdStyle}>
                          {editingActId === act.id
                            ? <ProvinceDropdown value={editActData.province}
                                onChange={e => setEditActData({ ...editActData, province: e.target.value })} />
                            : act.province || '–'}
                        </td>

                        <td style={tdStyle}>
                          {editingActId === act.id
                            ? <YearInput value={editActData.year}
                                onChange={e => setEditActData({ ...editActData, year: e.target.value })} />
                            : act.year || '–'}
                        </td>

                        <td style={tdStyle}>
                          {editingActId === act.id
                            ? <textarea className="edit-input" rows={2} value={editActData.description}
                                onChange={e => setEditActData({ ...editActData, description: e.target.value })}
                                style={{ resize: 'vertical', minHeight: '60px' }} />
                            : act.description || '–'}
                        </td>

                        <td style={tdStyle}>
                          {editingActId === act.id
                            ? <textarea className="edit-input" rows={2} value={editActData.key_points}
                                onChange={e => setEditActData({ ...editActData, key_points: e.target.value })}
                                style={{ resize: 'vertical', minHeight: '60px' }}
                                placeholder="Point1|Point2|Point3" />
                            : act.key_points || '–'}
                        </td>

                        <td style={{ overflow: 'visible', position: 'relative' }}>
                          <ActionButtons
                            isEditing={editingActId === act.id}
                            onEdit={   () => handleEditAct(act)}
                            onSave={   () => handleSaveAct(act.id)}
                            onCancel={ () => { setEditingActId(null); setActSaveError(null) }}
                            onDelete={ () => setDeleteActConfirm(act.id)}
                            showFillButton={true}
                            emptyFields={getEmptyActFields(act)}
                            onIncompleteFieldSave={(filledData) => {
                              fetch(`http://localhost:3000/api/admin/acts/${act.id}`, {
                                method:  'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body:    JSON.stringify({ ...act, ...filledData }),
                              }).then(() => fetchActs())
                            }}
                          />
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ══ ADD LAW MODAL ══ */}
      {showAddLaw && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', color: '#1a1a1a', fontSize: '20px', fontWeight: '700' }}>➕ Add New Law</h3>
            {lawSaveError && <div className="save-error" style={{ marginBottom: '12px' }}>⚠️ {lawSaveError}</div>}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Title <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <input className="edit-input" style={{ width: '100%', boxSizing: 'border-box' }}
                value={newLaw.title} placeholder="Law title"
                onChange={e => setNewLaw({ ...newLaw, title: e.target.value })} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>Category</label>
              <select className="edit-input" style={{ width: '100%' }} value={newLaw.category}
                onChange={e => setNewLaw({ ...newLaw, category: e.target.value })}>
                {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Description <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <textarea className="edit-input" rows={3} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                value={newLaw.description}
                onChange={e => setNewLaw({ ...newLaw, description: e.target.value })} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Action Type <span style={{ color: '#e53e3e' }}>*</span>{' '}
                <span style={{ fontWeight: '400', color: '#999' }}>(e.g. Penalty, Season, License)</span>
              </label>
              <input className="edit-input" style={{ width: '100%', boxSizing: 'border-box' }}
                value={newLaw.action_type}
                onChange={e => setNewLaw({ ...newLaw, action_type: e.target.value })} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Action Detail <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <input className="edit-input" style={{ width: '100%', boxSizing: 'border-box' }}
                value={newLaw.action_detail}
                onChange={e => setNewLaw({ ...newLaw, action_detail: e.target.value })} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Reference <span style={{ color: '#e53e3e' }}>*</span>{' '}
                <span style={{ fontWeight: '400', color: '#999' }}>(e.g. Punjab Wildlife Act 1974)</span>
              </label>
              <input className="edit-input" style={{ width: '100%', boxSizing: 'border-box' }}
                value={newLaw.reference}
                onChange={e => setNewLaw({ ...newLaw, reference: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => { setShowAddLaw(false); setLawSaveError(null) }}
                style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: '1.5px solid #ddd', background: '#f7f7f7', color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Cancel
              </button>
              <button onClick={handleAddLaw}
                style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: 'none', background: '#8a9e3a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Add Law
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD ACT MODAL ══ */}
      {showAddAct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', color: '#1a1a1a', fontSize: '20px', fontWeight: '700' }}>➕ Add New Act</h3>
            {actSaveError && <div className="save-error" style={{ marginBottom: '12px' }}>⚠️ {actSaveError}</div>}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Name <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <input className="edit-input" style={{ width: '100%', boxSizing: 'border-box' }}
                value={newAct.name} placeholder="Act name"
                onChange={e => setNewAct({ ...newAct, name: e.target.value })} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Province <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <ProvinceDropdown value={newAct.province}
                onChange={e => setNewAct({ ...newAct, province: e.target.value })} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Year <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <YearInput value={newAct.year}
                onChange={e => setNewAct({ ...newAct, year: e.target.value })} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Description <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <textarea className="edit-input" rows={3} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                value={newAct.description}
                onChange={e => setNewAct({ ...newAct, description: e.target.value })} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Key Points <span style={{ color: '#e53e3e' }}>*</span>{' '}
                <span style={{ fontWeight: '400', color: '#999' }}>(pipe | separated)</span>
              </label>
              <textarea className="edit-input" rows={3} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                placeholder="Point 1|Point 2|Point 3"
                value={newAct.key_points}
                onChange={e => setNewAct({ ...newAct, key_points: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => { setShowAddAct(false); setActSaveError(null) }}
                style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: '1.5px solid #ddd', background: '#f7f7f7', color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Cancel
              </button>
              <button onClick={handleAddAct}
                style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: 'none', background: '#8a9e3a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Add Act
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRMS ══ */}
      {deleteLawConfirm && (
        <DeleteConfirmPopup
          title="Delete Law?"
          onCancel={() => setDeleteLawConfirm(null)}
          onConfirm={confirmDeleteLaw}
        />
      )}
      {deleteActConfirm && (
        <DeleteConfirmPopup
          title="Delete Act?"
          onCancel={() => setDeleteActConfirm(null)}
          onConfirm={confirmDeleteAct}
        />
      )}
    </div>
  )
}

// ── Delete Confirm Popup ──────────────────────────────────
function DeleteConfirmPopup({ title, onCancel, onConfirm }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '36px 32px', width: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ width: '64px', height: '64px', background: '#fff0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '20px', fontWeight: '700' }}>{title}</h3>
        <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', margin: '0 0 28px' }}>
          Are you sure you want to delete this?<br />
          <strong style={{ color: '#e53e3e' }}>This action cannot be undone.</strong>
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: '1.5px solid #ddd', background: '#f7f7f7', color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: 'none', background: '#e53e3e', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}