import { useState } from 'react'

const IconPen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const IconClipboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="15" y2="16"/>
  </svg>
)

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

function AllFilledModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '28px 24px',
        width: '360px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
      }}>
        <div style={{
          width: '52px', height: '52px',
          background: '#f0fdf4',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          fontSize: '28px',
        }}>✅</div>
        <h3 style={{ margin: '0 0 6px', color: '#1a1a1a', fontSize: '18px', fontWeight: 700 }}>
          Record Complete!
        </h3>
        <p style={{ color: '#555', fontSize: '16px', lineHeight: 1.6, margin: '0 0 20px' }}>
          All fields are already filled.<br />No action needed.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '9px 28px', borderRadius: '8px',
            border: 'none', background: '#2d6a4f',
            color: '#fff', cursor: 'pointer',
            fontSize: '15px', fontWeight: 600,
          }}
        >OK</button>
      </div>
    </div>
  )
}

export default function ActionButtons({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  emptyFields,
  onIncompleteFieldSave,
  showFillButton = true,
}) {
  const [showModal, setShowModal]               = useState(false)
  const [showAllFilledModal, setShowAllFilledModal] = useState(false)
  const [formData, setFormData]                 = useState({})

  const openModal = () => {
    setFormData(Object.fromEntries(emptyFields.map(f => [f.key, ''])))
    setShowModal(true)
  }

  const handleSaveIncomplete = () => {
    onIncompleteFieldSave(formData)
    setShowModal(false)
  }

  const handleClipboardClick = () => {
    if (!emptyFields || emptyFields.length === 0) {
      setShowAllFilledModal(true)
      return
    }
    openModal()
  }

  const btnBase = {
    border: 'none', background: 'transparent', borderRadius: '6px',
    width: '30px', height: '30px', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s ease', flexShrink: 0, padding: '6px',
  }
  const hover = (e, color) => { e.currentTarget.style.background = color }
  const leave = e => { e.currentTarget.style.background = 'transparent' }

  return (
    <>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {isEditing ? (
          <>
            <button onClick={onSave} title="Save"
              style={{ ...btnBase, color: '#2eab5e' }}
              onMouseEnter={e => hover(e, 'rgba(46,171,94,0.12)')}
              onMouseLeave={leave}><IconCheck /></button>
            <button onClick={onCancel} title="Cancel"
              style={{ ...btnBase, color: '#8b95a1' }}
              onMouseEnter={e => hover(e, 'rgba(139,149,161,0.12)')}
              onMouseLeave={leave}><IconX /></button>
          </>
        ) : (
          <>
            <button onClick={onEdit} title="Edit"
              style={{ ...btnBase, color: '#e8b800' }}
              onMouseEnter={e => hover(e, 'rgba(232,184,0,0.12)')}
              onMouseLeave={leave}><IconPen /></button>
            <button onClick={onDelete} title="Delete"
              style={{ ...btnBase, color: '#e63535' }}
              onMouseEnter={e => hover(e, 'rgba(230,53,53,0.12)')}
              onMouseLeave={leave}><IconTrash /></button>
            {showFillButton && (
              <button onClick={handleClipboardClick} title="Fill incomplete fields"
                style={{ ...btnBase, color: '#7c3aed' }}
                onMouseEnter={e => hover(e, 'rgba(124,58,237,0.12)')}
                onMouseLeave={leave}><IconClipboard /></button>
            )}
          </>
        )}
      </div>

      {showAllFilledModal && (
        <AllFilledModal onClose={() => setShowAllFilledModal(false)} />
      )}

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px',
            padding: '28px 32px', width: '420px',
            maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#f3e8ff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#7c3aed',
                }}><IconClipboard /></div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a1a' }}>Incomplete Fields</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '1px' }}>{emptyFields.length} field(s) missing</div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                <IconX />
              </button>
            </div>

            <div style={{
              background: '#f3e8ff', border: '0.5px solid #c4b5fd',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '12px', color: '#5b21b6',
              margin: '16px 0',
            }}>
              Only empty fields are shown below.
            </div>

            {emptyFields.map(f => (
              <div key={f.key} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '5px', textAlign: 'left' }}>
                  {f.label}
                </label>
                <input
                  type="text"
                  placeholder={`Enter ${f.label}...`}
                  value={formData[f.key] || ''}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '8px 11px', border: '1px solid #e0e0e0',
                    borderRadius: '8px', fontSize: '13px',
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e  => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '9px 20px', borderRadius: '8px',
                border: '1px solid #ddd', background: '#f7f7f7',
                color: '#555', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              }}>Cancel</button>
              <button onClick={handleSaveIncomplete} style={{
                padding: '9px 20px', borderRadius: '8px',
                border: 'none', background: '#7c3aed',
                color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}