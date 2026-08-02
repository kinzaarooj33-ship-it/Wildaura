import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './dashboard'
import Users from './user'
import SpeciesInfo from './specieinfo'
import Guides from './guide'
import AdminLogin from './adminlogin'
import WeaponInfo from './WeaponInfo'   // ✅ ADD THIS
import HuntingLaws from './huntinglaws'
import HuntingAreas from './huntingareas'
import ResortInfo from './resortinfo'
import AdminSuccessStories from './adminSuccessStories'
import EmergencyCalls from './emergencycall'
import EmergencyRequests from './emergencyrequest'
import Notification from './notification'
import AdminBookings from './bookings'
import AdminTripSchedules from './tripschedule'
import Feedback from './feedback'
// ✅ Protected Route — agar login nahi to login page pe bhejo
function ProtectedRoute({ children }) {
  const adminId = sessionStorage.getItem('adminId')
  if (!adminId) {
    return <Navigate to="/admin-login" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      {/* Default → admin-login */}
      <Route path="/" element={<Navigate to="/admin-login" replace />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Protected routes — login ke baghair nahi khulenge */}
      <Route path="/admin"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/users"   element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/admin/species" element={<ProtectedRoute><SpeciesInfo /></ProtectedRoute>} />
      <Route path="/admin/guides"  element={<ProtectedRoute><Guides /></ProtectedRoute>} />
      <Route path="/admin/weapons" element={<ProtectedRoute><WeaponInfo /></ProtectedRoute>} />  {/* ✅ ADD THIS */}
      <Route path="/admin/huntinglaws" element={<ProtectedRoute><HuntingLaws /></ProtectedRoute>} />
     <Route path="/admin/hunting-laws" element={<ProtectedRoute><HuntingLaws /></ProtectedRoute>} />
     <Route path="/admin/hunting-areas" element={<ProtectedRoute><HuntingAreas /></ProtectedRoute>} />
     <Route path="/admin/resorts" element={<ProtectedRoute><ResortInfo /></ProtectedRoute>} />
     <Route path="/admin/success-stories" element={<ProtectedRoute><AdminSuccessStories /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute><Notification /></ProtectedRoute>} /> {/* ✅ ADD THIS */}
      <Route path="/admin/emergency-calls" element={<ProtectedRoute><EmergencyCalls /></ProtectedRoute>} />
      <Route path="/admin/trips" element={<ProtectedRoute><AdminTripSchedules /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute><AdminBookings /></ProtectedRoute>} />
     <Route path="/admin/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
     {/* Catch-all for unknown routes */}
      <Route path="*" element={<Navigate to="/admin-login" replace />} />
      <Route path="/admin/emergency-requests" element={<ProtectedRoute><EmergencyRequests /></ProtectedRoute>} />
    </Routes>
  )
}

export default App