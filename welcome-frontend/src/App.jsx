import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Welcome from "./welcome";
import Login from "./modern";
import SignUp from "./registrationm";
import HunterProfile from "./hunter-profile";
import MyProfile from "./userprofile";
import ForgotPassword from "./forgotPassword";
import VerifyOtp from "./verifyOtp";
import ResetPassword from "./resetPassword";
import Home from "./home";
import SpeciesInfo from "./specieinfo";
import SpeciesDetail from "./Speciesdetail";
import WeaponInfo from "./weaponinfo";
import WeaponDetail from "./weapondetail";
import HuntingAreas from "./hunting-areas";
import HuntingAreaDetail from "./Huntingareadetail";
import Resort from "./resort";
import ResortDetail from "./resortdetail";
import HuntingLaws from "./huntinglaws.jsx";
import ActDetail from "./actsdetail.jsx";
import GuiderProfile from "./guider-profile";
import GuiderBooking from "./guider-booking";
import SavedSpecies from "./savedspecies.jsx";
import SuccessStories from "./successstories.jsx";
import GuiderLayout from "./GuiderLayout";
import GuideDashboardPage from "./guider-dashboard";
import GuiderExplore from "./GuiderExplore";

import GuiderList from "./GuiderList";
import GuiderDetail from "./GuiderDetail";
import FeedbackForm from "./feedback";
import FeedbackView from "./FeedbackView";

import GuiderSuccessStories from "./guidersuccessstories";
import GuiderFeedback from "./guider-feedback";
import GuiderNotifications from "./guider-notification";

import TripScheduleView from "./TripScheduleView";
import GuiderEmergency from "./guider-emergency";

function App() {
  return (
    <Routes>
      {/* ── Public Routes ── */}
      <Route path="/"               element={<Welcome />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/registrationm"  element={<SignUp />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/verify-otp"     element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />
 
      {/* ── Hunter Protected Routes ── */}
      <Route path="/hunter-profile" element={
        <ProtectedRoute allowedRole="hunter"><HunterProfile /></ProtectedRoute>
      } />

      {/* ✅ Guest allowed */}
      <Route path="/home" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><Home /></ProtectedRoute>
      } />

      <Route path="/my-profile" element={
        <ProtectedRoute allowedRole="hunter"><MyProfile /></ProtectedRoute>
      } />

      {/* ✅ Guest allowed */}
      <Route path="/species-info" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><SpeciesInfo /></ProtectedRoute>
      } />
      <Route path="/species/:species" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><SpeciesDetail /></ProtectedRoute>
      } />

      {/* ✅ Guest allowed */}
      <Route path="/weapon-info" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><WeaponInfo /></ProtectedRoute>
      } />
      <Route path="/weapon/:name" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><WeaponDetail /></ProtectedRoute>
      } />

      {/* ✅ Guest allowed */}
      <Route path="/hunting-areas" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><HuntingAreas /></ProtectedRoute>
      } />
      <Route path="/hunting-areas/:id" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><HuntingAreaDetail /></ProtectedRoute>
      } />

      {/* ✅ Guest allowed */}
      <Route path="/hunting-laws" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><HuntingLaws /></ProtectedRoute>
      } />
      <Route path="/act/:id" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><ActDetail /></ProtectedRoute>
      } />

      {/* ✅ Guest allowed */}
      <Route path="/resort" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><Resort /></ProtectedRoute>
      } />
      <Route path="/resort-detail/:id" element={
        <ProtectedRoute allowedRole="hunter" allowGuest><ResortDetail /></ProtectedRoute>
      } />

      <Route path="/saved-species" element={
        <ProtectedRoute allowedRole="hunter"><SavedSpecies /></ProtectedRoute>
      } />
      <Route path="/guiders" element={
        <ProtectedRoute allowedRole="hunter"><GuiderList /></ProtectedRoute>
      } />
      <Route path="/guiderlist" element={
        <ProtectedRoute allowedRole="hunter"><GuiderList /></ProtectedRoute>
      } />
      <Route path="/guider/:id" element={
        <ProtectedRoute allowedRole="hunter"><GuiderDetail /></ProtectedRoute>
      } />
      <Route path="/guider-detail/:id" element={
        <ProtectedRoute allowedRole="hunter"><GuiderDetail /></ProtectedRoute>
      } />
      <Route path="/guider-detail" element={
        <ProtectedRoute allowedRole="hunter"><GuiderList /></ProtectedRoute>
      } />
      <Route path="/feedback" element={
        <ProtectedRoute allowedRole="hunter"><FeedbackForm /></ProtectedRoute>
      } />
      <Route path="/feedbackview" element={
        <ProtectedRoute allowedRole="hunter"><FeedbackView /></ProtectedRoute>
      } />
      <Route path="/trip-schedule" element={
        <ProtectedRoute allowedRole="hunter">
          <TripScheduleView onClose={() => window.history.back()} />
        </ProtectedRoute>
      } />

      {/* ── Guider Profile (before dashboard) ── */}
      <Route path="/guider-profile" element={
        <ProtectedRoute allowedRole="guider"><GuiderProfile /></ProtectedRoute>
      } />

      {/* ── Guider Protected Routes — GuiderLayout ke andar ── */}
      <Route element={
        <ProtectedRoute allowedRole="guider"><GuiderLayout /></ProtectedRoute>
      }>
        <Route path="/guider-dashboard"     element={<GuideDashboardPage />} />
        <Route path="/guider-explore"       element={<GuiderExplore />} />
        <Route path="/guider-booking"       element={<GuiderBooking />} />
        <Route path="/guider-success"       element={<GuiderSuccessStories />} />
        <Route path="/guider-feedback"      element={<GuiderFeedback />} />
        <Route path="/guider-notifications" element={<GuiderNotifications />} />
        <Route path="/guider-emergency"     element={<GuiderEmergency />} />

        {/* ── Guider Explore List Pages ── */}
        <Route path="/guider/species-info"  element={<SpeciesInfo />} />
        <Route path="/guider/weapon-info"   element={<WeaponInfo />} />
        <Route path="/guider/hunting-laws"  element={<HuntingLaws />} />
        <Route path="/guider/hunting-areas" element={<HuntingAreas />} />
        <Route path="/guider/resort"        element={<Resort />} />

        {/* ── Guider Explore Detail Pages ── */}
        <Route path="/guider/species/:species"   element={<SpeciesDetail />} />
        <Route path="/guider/weapon/:name"       element={<WeaponDetail />} />
        <Route path="/guider/hunting-areas/:id"  element={<HuntingAreaDetail />} />
        <Route path="/guider/act/:id"            element={<ActDetail />} />
        <Route path="/guider/resort-detail/:id"  element={<ResortDetail />} />
      </Route>
      <Route path="/success-stories" element={<SuccessStories />} />
    </Routes>
  );
}

export default App;