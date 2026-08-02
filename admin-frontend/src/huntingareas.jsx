import { useState, useEffect } from 'react'
import './user.css'

import Sidebar       from './components/sidebar.jsx'
import TopBar        from './components/topbar.jsx'
import ActionButtons from './components/actionbuttons.jsx'
import ScrapePanel   from './components/Scrapepanel.jsx'

const EMPTY_FORM = {
  name: '', image: '', province: '', region: '', season: '',
  status: 'Auto', description: '', animals: '', fees: '',
  permit_required: 1, best_time: '', contact: '',
  contact_phone: '', weather: '',
  rules_allowed: '', rules_forbidden: '', rules_warnings: '',
  hospitals: '', hotels: '', supplies: '',
}

const ALL_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const SHORT_MONTHS = {
  'January':'Jan','February':'Feb','March':'Mar','April':'Apr',
  'May':'May','June':'Jun','July':'Jul','August':'Aug',
  'September':'Sep','October':'Oct','November':'Nov','December':'Dec'
}

const SHORT_TO_INDEX = {
  'jan':0,'feb':1,'mar':2,'apr':3,'may':4,'jun':5,
  'jul':6,'aug':7,'sep':8,'oct':9,'nov':10,'dec':11,
}

const FULL_TO_INDEX = {}
ALL_MONTHS.forEach((m, i) => { FULL_TO_INDEX[m.toLowerCase()] = i })

const PAKISTAN_PROVINCES = [
  'Punjab','Sindh','Khyber Pakhtunkhwa','Balochistan','Gilgit-Baltistan'
]

const IMAGE_BASE_URL = 'http://localhost:3000/uploads/'

const getImageSrc = (image) => {
  if (!image) return null
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) return image
  return IMAGE_BASE_URL + image
}

const formatMonthsSmart = (monthsList) => {
  if (!monthsList || monthsList.length === 0) return ''
  const sorted = [...monthsList].sort((a, b) => ALL_MONTHS.indexOf(a) - ALL_MONTHS.indexOf(b))
  const groups = []
  let start = sorted[0]
  let end   = sorted[0]
  for (let i = 1; i <= sorted.length; i++) {
    const currIdx = ALL_MONTHS.indexOf(sorted[i])
    const endIdx  = ALL_MONTHS.indexOf(end)
    if (currIdx === endIdx + 1) {
      end = sorted[i]
    } else {
      groups.push(start === end
        ? SHORT_MONTHS[start]
        : `${SHORT_MONTHS[start]}-${SHORT_MONTHS[end]}`
      )
      start = end = sorted[i]
    }
  }
  return groups.join(', ')
}

const parseSeasonToIndices = (seasonStr) => {
  if (!seasonStr) return []
  const indices = new Set()
  const parts = seasonStr.split(',').map(s => s.trim())
  parts.forEach(part => {
    const rangeParts = part.split(/[-–]/).map(s => s.trim().toLowerCase())
    if (rangeParts.length === 2) {
      const startIdx = SHORT_TO_INDEX[rangeParts[0]] ?? FULL_TO_INDEX[rangeParts[0]]
      const endIdx   = SHORT_TO_INDEX[rangeParts[1]] ?? FULL_TO_INDEX[rangeParts[1]]
      if (startIdx !== undefined && endIdx !== undefined) {
        if (startIdx <= endIdx) {
          for (let i = startIdx; i <= endIdx; i++) indices.add(i)
        } else {
          for (let i = startIdx; i <= 11; i++) indices.add(i)
          for (let i = 0; i <= endIdx; i++) indices.add(i)
        }
      }
    } else {
      const key = rangeParts[0]
      const idx = SHORT_TO_INDEX[key] ?? FULL_TO_INDEX[key]
      if (idx !== undefined) indices.add(idx)
    }
  })
  return [...indices]
}

const parseSeasonToFullMonths = (seasonStr) => {
  if (!seasonStr) return []
  const indices = parseSeasonToIndices(seasonStr)
  return indices.map(i => ALL_MONTHS[i])
}

const getAutoStatus = (seasonStr, manualStatus) => {
  if (manualStatus === 'Limited') return 'Limited'
  if (!seasonStr) return manualStatus || 'Closed'
  const currentMonth = new Date().getMonth()
  const seasonIndices = parseSeasonToIndices(seasonStr)
  if (seasonIndices.length === 0) return 'Closed'
  return seasonIndices.includes(currentMonth) ? 'Open' : 'Closed'
}

const readOnlyStyle = {
  fontSize: '11px', color: '#333', lineHeight: '1.35',
  wordBreak: 'break-word', whiteSpace: 'normal',
}

const TruncatedCell = ({ text }) => {
  if (!text) return <span style={readOnlyStyle}>–</span>
  return (
    <div title={text} style={{
      ...readOnlyStyle,
      display: '-webkit-box', WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical', overflow: 'hidden', cursor: 'default',
    }}>{text}</div>
  )
}

const MonthPicker = ({ selectedMonthsList, toggleMonthFunc, placeholder = 'Select months...' }) => (
  <div style={{ width: '100%' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {ALL_MONTHS.map(month => {
        const selected = selectedMonthsList.includes(month)
        return (
          <div key={month} onClick={() => toggleMonthFunc(month)} style={{
            padding: '3px 7px', borderRadius: '5px',
            border: `1.5px solid ${selected ? '#b6b14a' : '#ddd'}`,
            fontSize: '11px', fontWeight: selected ? 600 : 400,
            cursor: 'pointer',
            background: selected ? '#b6b14a' : '#fff',
            color: selected ? '#fff' : '#666',
            transition: 'all 0.15s ease', userSelect: 'none', lineHeight: '1.4',
          }}>{SHORT_MONTHS[month]}</div>
        )
      })}
    </div>
    {selectedMonthsList.length === 0 && (
      <span style={{ fontSize: '11px', color: '#bbb', marginTop: '4px', display: 'block' }}>
        {placeholder}
      </span>
    )}
  </div>
)

// ── All hunting area fields for empty check ──────────────
const ALL_AREA_FIELDS = [
  { key: 'name',            label: 'Name'            },
  { key: 'image',           label: 'Image'           },
  { key: 'province',        label: 'Province'        },
  { key: 'region',          label: 'Region'          },
  { key: 'season',          label: 'Season'          },
  { key: 'description',     label: 'Description'     },
  { key: 'animals',         label: 'Animals'         },
  { key: 'fees',            label: 'Fees'            },
  { key: 'best_time',       label: 'Best Time'       },
  { key: 'contact',         label: 'Contact'         },
  { key: 'contact_phone',   label: 'Phone'           },
  { key: 'weather',         label: 'Weather'         },
  { key: 'rules_allowed',   label: 'Rules Allowed'   },
  { key: 'rules_forbidden', label: 'Rules Forbidden' },
  { key: 'rules_warnings',  label: 'Warnings'        },
  { key: 'hospitals',       label: 'Hospitals'       },
  { key: 'hotels',          label: 'Hotels'          },
  { key: 'supplies',        label: 'Supplies'        },
]

const getEmptyFields = (area) =>
  ALL_AREA_FIELDS.filter(f => !area[f.key] || area[f.key].toString().trim() === '')

export default function HuntingAreas() {
  const [areas, setAreas]                 = useState([])
  const [editingId, setEditingId]         = useState(null)
  const [editData, setEditData]           = useState({})
  const [saveError, setSaveError]         = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery]     = useState('')
  const [loading, setLoading]             = useState(true)
  const [fetchError, setFetchError]       = useState(null)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [addData, setAddData]             = useState(EMPTY_FORM)
  const [addError, setAddError]           = useState(null)
  const [addLoading, setAddLoading]       = useState(false)

  const [selectedMonths, setSelectedMonths]                 = useState([])
  const [selectedBestTimeMonths, setSelectedBestTimeMonths] = useState([])

  const fetchAreas = () => {
    setLoading(true)
    setFetchError(null)
    fetch('http://localhost:3000/api/admin/hunting-areas')
      .then(res => { if (!res.ok) throw new Error(`Server error: ${res.status}`); return res.json() })
      .then(data => { if (Array.isArray(data)) setAreas(data); else setAreas([]) })
      .catch(err => { setFetchError(err.message); setAreas([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAreas() }, [])

  const validateName = (v) => /^[a-zA-Z\s]*$/.test(v)
  const validateFees = (v) => /^\d*$/.test(v)
  const parseFees    = (v) => { if (!v) return ''; return v.replace(/[^\d]/g, '') }

  const toggleMonth = (month) =>
    setSelectedMonths(prev => prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month])

  const getSeasonString = () => formatMonthsSmart(selectedMonths)

  const toggleBestTimeMonth = (month) =>
    setSelectedBestTimeMonths(prev => prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month])

  const getBestTimeString = () => formatMonthsSmart(selectedBestTimeMonths)

  const resetDropdowns = () => { setSelectedMonths([]); setSelectedBestTimeMonths([]) }

  const handleEdit = (area) => {
    setEditingId(area.id)
    setSelectedMonths(parseSeasonToFullMonths(area.season))
    setSelectedBestTimeMonths(parseSeasonToFullMonths(area.best_time))
    setEditData({
      name:             area.name             || '',
      image:            area.image            || '',
      province:         area.province         || '',
      region:           area.region           || '',
      season:           area.season           || '',
      status:           area.status           || 'Auto',
      description:      area.description      || '',
      animals:          area.animals          || '',
      fees:             area.fees             || '',
      permit_required:  area.permit_required  ?? 1,
      best_time:        area.best_time        || '',
      contact:          area.contact          || '',
      contact_phone:    area.contact_phone    || '',
      weather:          area.weather          || '',
      rules_allowed:    area.rules_allowed    || '',
      rules_forbidden:  area.rules_forbidden  || '',
      rules_warnings:   area.rules_warnings   || '',
      hospitals:        area.hospitals        || '',
      hotels:           area.hotels           || '',
      supplies:         area.supplies         || '',
    })
    setSaveError(null)
  }

  const handleSave = (id) => {
    if (!validateName(editData.name))            { setSaveError('Name: sirf letters allowed'); return }
    if (!validateFees(parseFees(editData.fees))) { setSaveError('Fees: sirf numbers allowed'); return }

    const seasonStr   = getSeasonString()
    const finalStatus = editData.status === 'Limited'
      ? 'Limited'
      : getAutoStatus(seasonStr, editData.status)

    const dataToSave = {
      ...editData,
      season:    seasonStr,
      best_time: getBestTimeString(),
      fees:      parseFees(editData.fees),
      status:    finalStatus,
    }

    fetch(`http://localhost:3000/api/admin/hunting-areas/${Number(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave),
    })
      .then(res => { if (!res.ok) return res.text().then(t => { throw new Error(t) }); return res.json() })
      .then(() => { setEditingId(null); setEditData({}); resetDropdowns(); setSaveError(null); fetchAreas() })
      .catch(err => setSaveError('Save failed: ' + err.message))
  }

  const confirmDelete = () => {
    fetch(`http://localhost:3000/api/admin/hunting-areas/${Number(deleteConfirm)}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error('Delete failed'); return res.json() })
      .then(() => { fetchAreas(); setDeleteConfirm(null) })
      .catch(err => { console.error('Delete error:', err); setDeleteConfirm(null) })
  }

  const handleAdd = () => {
    if (!addData.name.trim())        { setAddError('Area Name required'); return }
    if (!validateName(addData.name)) { setAddError('Name: sirf letters allowed'); return }
    if (!addData.province.trim())    { setAddError('Province required'); return }
    if (!addData.region.trim())      { setAddError('Region required'); return }
    if (selectedMonths.length === 0) { setAddError('Kam az kam ek month select karo'); return }
    if (!addData.animals.trim())     { setAddError('Animals required'); return }
    if (!addData.fees.trim())        { setAddError('Fees required'); return }
    if (!validateFees(addData.fees)) { setAddError('Fees: sirf numbers'); return }

    const seasonStr  = getSeasonString()
    const autoStatus = addData.status === 'Limited'
      ? 'Limited'
      : getAutoStatus(seasonStr, 'Auto')

    const dataToSend = {
      ...addData,
      season:    seasonStr,
      best_time: getBestTimeString(),
      fees:      `Rs. ${addData.fees}`,
      status:    autoStatus,
    }

    setAddLoading(true)
    setAddError(null)
    fetch('http://localhost:3000/api/admin/hunting-areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
    })
      .then(res => { if (!res.ok) return res.text().then(t => { throw new Error(t) }); return res.json() })
      .then(() => { setShowAddModal(false); setAddData(EMPTY_FORM); resetDropdowns(); fetchAreas() })
      .catch(err => setAddError('Add failed: ' + err.message))
      .finally(() => setAddLoading(false))
  }

  const openAddModal  = () => { setShowAddModal(true); setAddError(null); setAddData(EMPTY_FORM); resetDropdowns() }
  const closeAddModal = () => { setShowAddModal(false); setAddError(null); resetDropdowns() }

  const filtered = areas
    .filter(a => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        String(a.name     || '').toLowerCase().includes(q) ||
        String(a.province || '').toLowerCase().includes(q) ||
        String(a.region   || '').toLowerCase().includes(q) ||
        String(a.animals  || '').toLowerCase().includes(q) ||
        String(a.status   || '').toLowerCase().includes(q) ||
        String(a.season   || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))

  const cols = [
    { key: 's_no',            label: '#',               w: '40px'  },
    { key: 'name',            label: 'Name',            w: '120px' },
    { key: 'image',           label: 'Image',           w: '100px' },
    { key: 'province',        label: 'Province',        w: '120px' },
    { key: 'region',          label: 'Region',          w: '100px' },
    { key: 'season',          label: 'Season',          w: '170px' },
    { key: 'status',          label: 'Status',          w: '80px'  },
    { key: 'animals',         label: 'Animals',         w: '140px' },
    { key: 'fees',            label: 'Fees',            w: '100px' },
    { key: 'best_time',       label: 'Best Time',       w: '170px' },
    { key: 'contact',         label: 'Contact',         w: '110px' },
    { key: 'contact_phone',   label: 'Phone',           w: '110px' },
    { key: 'weather',         label: 'Weather',         w: '170px' },
    { key: 'description',     label: 'Description',     w: '130px' },
    { key: 'rules_allowed',   label: 'Rules Allowed',   w: '120px' },
    { key: 'rules_forbidden', label: 'Rules Forbidden', w: '120px' },
    { key: 'rules_warnings',  label: 'Warnings',        w: '110px' },
    { key: 'hospitals',       label: 'Hospitals',       w: '110px' },
    { key: 'hotels',          label: 'Hotels',          w: '110px' },
    { key: 'supplies',        label: 'Supplies',        w: '110px' },
    { key: 'actions',         label: 'Actions',         w: '120px'  },
  ]

  const ef = (field, placeholder = '') => (
    <input className="edit-input" value={editData[field]} placeholder={placeholder}
      onChange={e => setEditData({ ...editData, [field]: e.target.value })}
      style={{ width: '100%', fontSize: '11px', padding: '4px 6px' }} />
  )

  const ta = (field, placeholder = '') => (
    <textarea className="edit-input" value={editData[field]} placeholder={placeholder} rows={2}
      onChange={e => setEditData({ ...editData, [field]: e.target.value })}
      style={{ width: '100%', fontSize: '11px', padding: '4px 6px', resize: 'vertical' }} />
  )

  const StatusBadge = ({ area }) => {
    const displayStatus = getAutoStatus(area.season, area.status)
    const cfg = {
      Open:    { bg: '#c6f6d5', color: '#276749' },
      Closed:  { bg: '#fed7d7', color: '#c53030' },
      Limited: { bg: '#fefcbf', color: '#744210' },
    }
    const style = cfg[displayStatus] || cfg.Closed
    return (
      <span style={{
        padding: '2px 7px', borderRadius: '10px', fontSize: '10px',
        fontWeight: 600, display: 'inline-block',
        background: style.bg, color: style.color,
      }}>{displayStatus}</span>
    )
  }

  const WeatherDisplay = ({ weatherStr }) => {
    if (!weatherStr) return <span style={{ fontSize: '11px', color: '#888' }}>–</span>
    try {
      const arr = JSON.parse(weatherStr)
      if (!Array.isArray(arr)) return <span style={{ fontSize: '11px' }}>{weatherStr}</span>
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {arr.map((w, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', lineHeight: 1.3 }}>
              <span style={{ fontWeight: 600, color: '#555', minWidth: '28px' }}>{w.month}:</span>
              <span style={{ color: '#333' }}>{w.temp}°C</span>
              {w.icon && <span>{w.icon}</span>}
              {w.note && <span style={{ color: '#888', fontSize: '9px' }}>({w.note})</span>}
            </div>
          ))}
        </div>
      )
    } catch {
      return <span style={{ fontSize: '11px' }}>{weatherStr}</span>
    }
  }

  const ProvinceDropdown = ({ value, onChange }) => (
    <select className="edit-input" value={value} onChange={onChange}
      style={{ width: '100%', cursor: 'pointer', fontSize: '11px', padding: '4px 6px' }}>
      <option value="">Select...</option>
      {PAKISTAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
    </select>
  )

  const NameInput = ({ value, onChange, placeholder = '' }) => {
    const [err, setErr] = useState('')
    const handleChange = (e) => {
      const v = e.target.value
      if (validateName(v) || v === '') { onChange(e); setErr('') }
      else setErr('Sirf letters')
    }
    return (
      <div style={{ width: '100%' }}>
        <input className="edit-input" value={value} placeholder={placeholder}
          onChange={handleChange}
          style={{ width: '100%', fontSize: '11px', padding: '4px 6px', border: err ? '1.5px solid #e53e3e' : '' }} />
        {err && <span style={{ color: '#e53e3e', fontSize: '9px', display: 'block', marginTop: '1px' }}>{err}</span>}
      </div>
    )
  }

  const FeesInput = ({ value, onChange, placeholder = '' }) => {
    const [display, setDisplay] = useState(value ? `Rs. ${value}` : '')
    const handleChange = (e) => {
      const num = e.target.value.replace(/[^\d]/g, '')
      if (validateFees(num) || num === '') {
        setDisplay(num ? `Rs. ${num}` : '')
        onChange({ target: { value: num } })
      }
    }
    return (
      <input className="edit-input" value={display} placeholder={placeholder || 'Rs. 0'}
        onChange={handleChange}
        style={{ width: '100%', fontSize: '11px', padding: '4px 6px' }} />
    )
  }

  const cs = {
    fontSize: '11px', lineHeight: '1.35', wordBreak: 'break-word',
    whiteSpace: 'normal', verticalAlign: 'top', padding: '8px 10px',
  }

  const labelStyle = { fontSize: '12px', color: '#555', marginBottom: '4px', fontWeight: 600 }
  const fieldWrap  = (col = '1') => ({ display: 'flex', flexDirection: 'column', gridColumn: col === 'full' ? '1 / -1' : undefined })

  return (
    <div className="admin-wrapper">
      <TopBar />
      <div className="admin-body">
        <Sidebar activeLabel="Designated Hunting Areas" />
        <main className="main-content">

          <div className="page-header" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input className="search-input" placeholder="🔍 Search designated hunting areas..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <button onClick={openAddModal} style={{
              padding: '10px 20px', borderRadius: '8px', background: '#8a9e3a',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap',
            }}>+ Add Area</button>
            <ScrapePanel areas={areas} />
          </div>

          <div className="table-header">
            <h2 className="page-title">
              Designated Hunting Areas <span className="user-count">({filtered.length})</span>
            </h2>
          </div>

          {saveError  && <div className="save-error">⚠️ {saveError}</div>}
          {fetchError && (
            <div className="save-error">
              ⚠️ Could not load: {fetchError} &nbsp;
              <button onClick={fetchAreas} style={{ marginLeft: 8, cursor: 'pointer', padding: '2px 10px', borderRadius: 6, border: '1px solid #e53e3e', background: '#fff', color: '#e53e3e', fontWeight: 600 }}>Retry</button>
            </div>
          )}

          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ tableLayout: 'fixed', minWidth: '2200px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {cols.map(c => (
                    <th key={c.key} style={{ width: c.w, minWidth: c.w, fontSize: '11px', padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={cols.length} className="no-data">⏳ Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={cols.length} className="no-data">No hunting areas found</td></tr>
                ) : (
                  filtered.map((area, i) => (
                    <tr key={area.id}>

                      <td style={{ ...cs, textAlign: 'center' }}>{i + 1}</td>

                      <td style={cs}>
                        {editingId === area.id
                          ? <NameInput value={editData.name} placeholder="Area name"
                              onChange={e => setEditData({ ...editData, name: e.target.value })} />
                          : <span style={readOnlyStyle}>{area.name || '–'}</span>}
                      </td>

                      <td style={cs}>
                        {editingId === area.id
                          ? ef('image', 'Image filename')
                          : (() => {
                              const src = getImageSrc(area.image)
                              return src ? (
                                <img src={src} alt={area.name}
                                  style={{ maxWidth: '80px', maxHeight: '60px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline' }} />
                              ) : <span style={{ fontSize: '10px', color: '#888' }}>No image</span>
                            })()
                        }
                        {editingId !== area.id && area.image ? (
                          <span style={{ fontSize: '10px', color: '#888', display: 'none' }}>No image</span>
                        ) : null}
                      </td>

                      <td style={cs}>
                        {editingId === area.id
                          ? <ProvinceDropdown value={editData.province}
                              onChange={e => setEditData({ ...editData, province: e.target.value })} />
                          : <span style={readOnlyStyle}>{area.province || '–'}</span>}
                      </td>

                      <td style={cs}>
                        {editingId === area.id
                          ? ef('region')
                          : <span style={readOnlyStyle}>{area.region || '–'}</span>}
                      </td>

                      <td style={cs}>
                        {editingId === area.id ? (
                          <MonthPicker selectedMonthsList={selectedMonths} toggleMonthFunc={toggleMonth}
                            placeholder="Months select karein..." />
                        ) : <span style={readOnlyStyle}>{area.season || '–'}</span>}
                      </td>

                      <td style={{ ...cs, textAlign: 'center' }}>
                        {editingId === area.id ? (
                          <div>
                            <select className="edit-input" value={editData.status}
                              onChange={e => setEditData({ ...editData, status: e.target.value })}
                              style={{ fontSize: '10px', padding: '3px 4px', width: '100%' }}>
                              <option value="Auto">Auto (season)</option>
                              <option value="Limited">Limited</option>
                            </select>
                            <span style={{ fontSize: '9px', color: '#888', display: 'block', marginTop: '2px' }}>
                              → {editData.status === 'Limited' ? 'Limited' : getAutoStatus(getSeasonString(), 'Auto')}
                            </span>
                          </div>
                        ) : (
                          <StatusBadge area={area} />
                        )}
                      </td>

                      <td style={cs}>
                        {editingId === area.id ? ef('animals') : <span style={readOnlyStyle}>{area.animals || '–'}</span>}
                      </td>

                      <td style={cs}>
                        {editingId === area.id ? (
                          <FeesInput value={parseFees(editData.fees)} placeholder="Rs. 0"
                            onChange={e => setEditData({ ...editData, fees: e.target.value })} />
                        ) : <span style={readOnlyStyle}>{area.fees || '–'}</span>}
                      </td>

                      <td style={cs}>
                        {editingId === area.id ? (
                          <MonthPicker selectedMonthsList={selectedBestTimeMonths} toggleMonthFunc={toggleBestTimeMonth}
                            placeholder="Months select karein..." />
                        ) : <span style={readOnlyStyle}>{area.best_time || '–'}</span>}
                      </td>

                      <td style={cs}><span style={readOnlyStyle}>{area.contact || '–'}</span></td>
                      <td style={cs}><span style={readOnlyStyle}>{area.contact_phone || '–'}</span></td>
                      <td style={cs}><WeatherDisplay weatherStr={area.weather} /></td>

                      <td style={cs}>
                        {editingId === area.id ? ta('description') : <TruncatedCell text={area.description} />}
                      </td>

                      <td style={cs}><TruncatedCell text={area.rules_allowed} /></td>
                      <td style={cs}><TruncatedCell text={area.rules_forbidden} /></td>
                      <td style={cs}><TruncatedCell text={area.rules_warnings} /></td>

                      <td style={cs}>
                        {editingId === area.id ? ef('hospitals') : <TruncatedCell text={area.hospitals} />}
                      </td>
                      <td style={cs}>
                        {editingId === area.id ? ef('hotels') : <TruncatedCell text={area.hotels} />}
                      </td>
                      <td style={cs}>
                        {editingId === area.id ? ef('supplies') : <TruncatedCell text={area.supplies} />}
                      </td>

                      {/* ── FIXED: emptyFields + onIncompleteFieldSave properly passed ── */}
                      <td style={{ ...cs, textAlign: 'center', overflow: 'visible', position: 'relative' }}>
                        <ActionButtons
                          isEditing={editingId === area.id}
                          onEdit={   () => handleEdit(area)}
                          onSave={   () => handleSave(area.id)}
                          onCancel={ () => { setEditingId(null); setSaveError(null); resetDropdowns() }}
                          onDelete={ () => setDeleteConfirm(area.id)}
                          showFillButton={true}
                          emptyFields={getEmptyFields(area)}
                          onIncompleteFieldSave={(filledData) => {
                            fetch(`http://localhost:3000/api/admin/hunting-areas/${Number(area.id)}`, {
                              method:  'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body:    JSON.stringify({ ...area, ...filledData }),
                            }).then(() => fetchAreas())
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

      {/* Delete Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', width: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ width: '64px', height: '64px', background: '#fff0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '20px', fontWeight: 700 }}>Delete Hunting Area?</h3>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.5, margin: '0 0 28px' }}>
              Are you sure? <strong style={{ color: '#e53e3e' }}>This cannot be undone.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: '1.5px solid #ddd', background: '#f7f7f7', color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Cancel</button>
              <button onClick={confirmDelete}                style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: 'none', background: '#e53e3e', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '560px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 700 }}>📍 Add New Hunting Area</h3>

            {addError && (
              <div style={{ background: '#fff5f5', border: '1px solid #fc8181', color: '#c53030', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                ⚠️ {addError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Area Name <span style={{ color: '#e53e3e' }}>*</span></label>
                <NameInput value={addData.name} placeholder="Area name"
                  onChange={e => setAddData({ ...addData, name: e.target.value })} />
              </div>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Province <span style={{ color: '#e53e3e' }}>*</span></label>
                <ProvinceDropdown value={addData.province}
                  onChange={e => setAddData({ ...addData, province: e.target.value })} />
              </div>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Region <span style={{ color: '#e53e3e' }}>*</span></label>
                <input className="edit-input" value={addData.region}
                  onChange={e => setAddData({ ...addData, region: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Status Override</label>
                <select className="edit-input" value={addData.status}
                  onChange={e => setAddData({ ...addData, status: e.target.value })} style={{ width: '100%' }}>
                  <option value="Auto">Auto (from season)</option>
                  <option value="Limited">Limited</option>
                </select>
              </div>
              <div style={fieldWrap('full')}>
                <label style={labelStyle}>Hunting Season <span style={{ color: '#e53e3e' }}>*</span></label>
                <MonthPicker selectedMonthsList={selectedMonths} toggleMonthFunc={toggleMonth}
                  placeholder="Select hunting months ..." />
                {selectedMonths.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#2d6a4f', marginTop: '5px' }}>
                    → Status: <strong>{addData.status === 'Limited' ? 'Limited' : getAutoStatus(getSeasonString(), 'Auto')}</strong>
                    &nbsp;|&nbsp; Season: <strong>{getSeasonString()}</strong>
                  </span>
                )}
              </div>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Animals <span style={{ color: '#e53e3e' }}>*</span></label>
                <input className="edit-input" value={addData.animals}
                  onChange={e => setAddData({ ...addData, animals: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Fees (PKR) <span style={{ color: '#e53e3e' }}>*</span></label>
                <FeesInput value={addData.fees} placeholder="Rs. 0"
                  onChange={e => setAddData({ ...addData, fees: e.target.value })} />
              </div>
              <div style={fieldWrap('full')}>
                <label style={labelStyle}>Best Time (Months)</label>
                <MonthPicker selectedMonthsList={selectedBestTimeMonths} toggleMonthFunc={toggleBestTimeMonth}
                  placeholder="Select best time months ..." />
                {selectedBestTimeMonths.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#555', marginTop: '5px' }}>
                    → Best Time: <strong>{getBestTimeString()}</strong>
                  </span>
                )}
              </div>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Image filename</label>
                <input className="edit-input" value={addData.image} placeholder="e.g. ayubia.jpg"
                  onChange={e => setAddData({ ...addData, image: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={fieldWrap('full')}>
                <label style={labelStyle}>Description</label>
                <textarea className="edit-input" rows={3} value={addData.description}
                  onChange={e => setAddData({ ...addData, description: e.target.value })}
                  style={{ width: '100%', resize: 'vertical' }} />
              </div>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Hospitals</label>
                <input className="edit-input" value={addData.hospitals}
                  onChange={e => setAddData({ ...addData, hospitals: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={fieldWrap()}>
                <label style={labelStyle}>Hotels</label>
                <input className="edit-input" value={addData.hotels}
                  onChange={e => setAddData({ ...addData, hotels: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={fieldWrap('full')}>
                <label style={labelStyle}>Supplies</label>
                <input className="edit-input" value={addData.supplies}
                  onChange={e => setAddData({ ...addData, supplies: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={closeAddModal} style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: '1.5px solid #ddd', background: '#f7f7f7', color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleAdd} disabled={addLoading} style={{ flex: 1, padding: '11px 0', borderRadius: '8px', border: 'none', background: addLoading ? '#9ae6b4' : '#2d6a4f', color: '#fff', cursor: addLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}>
                {addLoading ? '⏳ Adding...' : '✅ Add Area'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}