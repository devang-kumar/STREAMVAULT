import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SeriesDetails from './pages/SeriesDetails'
import WatchPage from './pages/WatchPage'
import LoginPage from './pages/LoginPage'
import SubscriptionPage from './pages/SubscriptionPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import SearchPage from './pages/SearchPage'
import FooterContentPage from './pages/FooterContentPage'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'

// Pages where the global Navbar is hidden
const NAVBAR_HIDDEN = ['/login', '/watch', '/admin']

export default function App() {
  const location = useLocation()
  const hideNav = NAVBAR_HIDDEN.some(p => location.pathname.startsWith(p))

  return (
    <AuthProvider>
      {!hideNav && <Navbar />}
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/"              element={<Home />} />
        <Route path="/series/:id"    element={<SeriesDetails />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/subscription"  element={<SubscriptionPage />} />
        <Route path="/search"        element={<SearchPage />} />

        {/* ── Footer pages ── */}
        <Route path="/about-us"         element={<FooterContentPage slug="about-us" />} />
        <Route path="/careers"          element={<FooterContentPage slug="careers" />} />
        <Route path="/terms-of-service" element={<FooterContentPage slug="terms-of-service" />} />
        <Route path="/privacy-policy"   element={<FooterContentPage slug="privacy-policy" />} />
        <Route path="/cookie-policy"    element={<FooterContentPage slug="cookie-policy" />} />
        <Route path="/help-center"      element={<FooterContentPage slug="help-center" />} />
        <Route path="/contact-us"       element={<FooterContentPage slug="contact-us" />} />

        {/* ── Auth-required routes ── */}
        <Route path="/watch/:id/:epId" element={
          <ProtectedRoute>
            <WatchPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* ── Admin-only routes ──
             All admin paths are handled by the AdminPage component,
             which reads the URL to determine which section to render.
             CMS routes (/admin/content/*) are handled by CmsPage internally. */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/:section" element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/:section/:sub" element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/:section/:sub/:param" element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/:section/:sub/:param/:nested" element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/:section/:sub/:param/:nested/:deep" element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}