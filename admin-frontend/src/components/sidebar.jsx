import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const menuItems = [
  { label: 'Dashboard',          icon: '🪪', path: '/admin' },
  { label: 'Users',              icon: '👥', path: '/admin/users' },
  { label: 'Guides',             icon: '👤', path: '/admin/guides' },
  { label: 'Specie Info',        icon: 'ℹ️', path: '/admin/species' },
  { label: 'Hunting Areas',      icon: '📍', path: '/admin/hunting-areas' },
  { label: 'Hunting Laws',       icon: '🚫', path: '/admin/huntinglaws' },
  { label: 'Weapon info',        icon: '🔫', path: '/admin/weapons' },
  { label: 'Resorts',            icon: '🏕️', path: '/admin/resorts' },
  { label: 'Feedback',           icon: '💬', path: '/admin/feedback' },
  { label: 'Success Stories',    icon: '⭐', path: '/admin/success-stories' },
  { label: 'Trip Schedules',     icon: '📅', path: '/admin/trips' },
  { label: 'Bookings',           icon: '🧳', path: '/admin/bookings' },
  { label: 'Notifications',      icon: '🔔', path: '/admin/notifications' },
  { label: 'Emergency Requests', icon: '🚨', path: '/admin/emergency-requests' },
  { label: 'Emergency Calls',    icon: '📞', path: '/admin/emergency-calls' },
  
]

export default function Sidebar({ activeLabel = '' }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  return (
    <aside style={{
      width: collapsed ? '60px' : '220px',
      background: '#ffffff',
      borderRight: '1px solid #eee',
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'width 0.25s ease',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',   // outer container clips horizontally
    }}>

      {/* ── Logo + Toggle ── */}
      <div style={{
        padding: '14px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid #f0f0f0',
        minHeight: '56px',
        flexShrink: 0,       // logo row never shrinks
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '17px' }}>
            <span>🍃</span>
            <span>Wild Aura</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'transparent',
            border: '1px solid #d0d0d0',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#bbb' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d0d0d0' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
            {[0,1,2].map(n => (
              <span key={n} style={{ width: '14px', height: '2px', backgroundColor: '#555', borderRadius: '1px', display: 'block' }} />
            ))}
          </div>
        </button>
      </div>

      {/* ── Scrollable Nav ──
           overflow-y: auto  → scroll karo jab items screen se bahar jayein
           overflow-x: hidden → horizontal scroll band
           flex: 1           → remaining height le lo
      */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: '8px',
        paddingBottom: '8px',
        // Scrollbar styling (webkit browsers: Chrome, Edge, Brave)
        scrollbarWidth: 'thin',           // Firefox
        scrollbarColor: '#e0e0e0 transparent',
      }}>
        <style>{`
          aside nav::-webkit-scrollbar { width: 4px; }
          aside nav::-webkit-scrollbar-track { background: transparent; }
          aside nav::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
          aside nav::-webkit-scrollbar-thumb:hover { background: #c8c8c8; }
        `}</style>

        {menuItems.map(item => {
          const isActive = item.label === activeLabel
          return (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              style={{
                padding: collapsed ? '11px 0' : '10px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontSize: '14px',
                transition: 'background 0.15s',
                background: isActive ? '#D4B800' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '3px solid #a88f00' : '3px solid transparent',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fff8cc' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{ marginLeft: '10px' }}>{item.label}</span>
              )}
            </div>
          )
        })}

        {/* Logout */}
        <div
          onClick={() => navigate('/')}
          title={collapsed ? 'Logout' : undefined}
          style={{
            padding: collapsed ? '11px 0' : '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            fontSize: '14px',
            color: '#d11a2a',
            marginTop: '8px',
            borderTop: '1px solid #f0f0f0',
            borderLeft: '3px solid transparent',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fff0f0'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⏻</span>
          {!collapsed && <span style={{ marginLeft: '10px' }}>Logout</span>}
        </div>
      </nav>
    </aside>
  )
}