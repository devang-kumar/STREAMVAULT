import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SeriesDetails from './pages/SeriesDetails'
import MovieDetails from './pages/MovieDetails'
import WatchPage from './pages/WatchPage'
import MovieWatchPage from './pages/MovieWatchPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import SubscriptionPage from './pages/SubscriptionPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import SearchPage from './pages/SearchPage'
import NotificationsPage from './pages/NotificationsPage'
import FooterContentPage from './pages/FooterContentPage'
import { AuthProvider } from './hooks/useAuth'
import { WatchlistProvider } from './hooks/useWatchlist'
import { MaintenanceProvider, useMaintenance } from './hooks/useMaintenance'
import ProtectedRoute from './components/ProtectedRoute'
import WatchlistPage from './pages/WatchlistPage'
import MaintenanceScreen from './components/MaintenanceScreen'

// Pages where the global Navbar is hidden
const NAVBAR_HIDDEN = ['/login', '/forgot-password', '/reset-password', '/watch', '/admin']

function AppShell() {
  const location = useLocation()
  const hideNav = NAVBAR_HIDDEN.some(p => location.pathname.startsWith(p))
  const { maintenanceMode, isAdminBypass, setAdminBypass, loading } = useMaintenance()

  // While checking maintenance status, show nothing (avoids flash)
  if (loading) return null

  // Show maintenance screen to everyone except admins who have bypassed
  if (maintenanceMode && !isAdminBypass) {
    return (
      <MaintenanceScreen onAdminLogin={() => setAdminBypass(true)} />
    )
  }

  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/"              element={<Home />} />
        <Route path="/series/:id"    element={<SeriesDetails />} />
        <Route path="/movies/:id"    element={<MovieDetails />} />
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/forgot-password"    element={<ForgotPasswordPage />} />
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
          <ProtectedRoute><WatchPage /></ProtectedRoute>
        } />
        <Route path="/watch/movie/:id" element={
          <ProtectedRoute><MovieWatchPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/watchlist" element={
          <ProtectedRoute><WatchlistPage /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><NotificationsPage /></ProtectedRoute>
        } />

        {/* ── Admin-only routes ── */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/:section" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/:section/:sub" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/:section/:sub/:param" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/:section/:sub/:param/:nested" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/:section/:sub/:param/:nested/:deep" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <WatchlistProvider>
        <MaintenanceProvider>
          <AppShell />
        </MaintenanceProvider>
      </WatchlistProvider>
    </AuthProvider>
  )
}

