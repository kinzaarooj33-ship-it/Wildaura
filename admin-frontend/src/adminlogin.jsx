import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './adminlogin.css'

export default function AdminLogin() {
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [popup, setPopup]     = useState({ show: false, message: '', success: false })
  const navigate = useNavigate()

  const showPopup = (message, success) => {
    setPopup({ show: true, message, success })
    if (success) {
      setTimeout(() => {
        setPopup({ show: false, message: '', success: false })
        navigate('/admin')
      }, 2000)
    } else {
      setTimeout(() => setPopup({ show: false, message: '', success: false }), 3000)
    }
  }

  const handleLogin = async () => {
    if (!code.trim()) { setError('Please enter your admin code'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoading(false)
        showPopup(data.error || 'Invalid admin code!', false)
        return
      }
      // ✅ sessionStorage — tab band hone pe automatically clear
      sessionStorage.setItem('adminId',   data.id)
      sessionStorage.setItem('adminName', data.name)
      showPopup('Login successful! Redirecting...', true)
    } catch (err) {
      setLoading(false)
      showPopup('Server error. Please try again.', false)
    }
  }

  return (
    <div className="wrapper">
      <span className="bg-animate"></span>

      {/* Popup */}
      {popup.show && (
        <div className={`popup ${popup.success ? 'success' : 'error'}`}>
          {popup.success ? '✅ ' : '❌ '}{popup.message}
        </div>
      )}

      {/* Left — Form */}
      <div className="form-box login">
        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>

        <h2>Admin Login</h2>
        <p className="subtitle">Authorized Access Only</p>

        {/* Code Input */}
        <div className="input-box">
          <input
            type="text"
            required
            placeholder=" "
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <label>Admin Code</label>
          <i className="fa-solid fa-lock"></i>
        </div>

        {/* Error */}
        {error && (
          <p className="inline-error">⚠️ {error}</p>
        )}

        <button
          className="btn"
          onClick={handleLogin}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Verifying...' : 'Login'}
        </button>
      </div>

      {/* Right — Info */}
      <div className="info-text login">
        <div className="logo-icon">🍃</div>
        <h2>Wild Aura</h2>
        <p>Admin Portal<br />Enter your secret code<br />to access the dashboard</p>
      </div>
    </div>
  )
}