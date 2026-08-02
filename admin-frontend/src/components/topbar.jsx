export default function TopBar() {
  const adminId   = sessionStorage.getItem('adminId')   || '?'
  const adminName = sessionStorage.getItem('adminName') || 'Admin'

  return (
    <div style={{
      width: '100%',
      height: '48px',
      background: '#D4B800',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 24px',
      boxSizing: 'border-box',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255,255,255,0.2)',
        padding: '6px 16px',
        borderRadius: '20px',
        color: '#1a1a1a',
        fontSize: '14px',
        fontWeight: 600,
      }}>
        {/* Green dot */}
        <span style={{
          width: '8px',
          height: '8px',
          background: '#2ecc71',
          borderRadius: '50%',
          display: 'inline-block',
        }} />
        Admin {adminId} &nbsp;|&nbsp; {adminName}
      </div>
    </div>
  )
}