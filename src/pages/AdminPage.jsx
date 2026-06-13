import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../components/admin/AdminLayout'
import Dashboard from '../pages/Dashboard'
import ContentPage from '../pages/ContentPage'
import SectionUsers from '../pages/SectionUsers'
import CategoriesPage from '../pages/CategoriesPage'
import PagesManagementPage from '../pages/PagesManagementPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import SettingsPage from '../pages/SettingsPage'
import PlansPage from '../pages/PlansPage'
import RevenuePage from '../pages/RevenuePage'
import ActivityPage from '../pages/ActivityPage'
import EngagementPage from '../pages/EngagementPage'
import AdminNotificationsPage from '../pages/AdminNotificationsPage'
import { Shield } from 'lucide-react'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user || user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex', minHeight: '100vh', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-dark)', padding: 16,
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%', maxWidth: 400, padding: '40px 32px',
          textAlign: 'center',
        }}>
          <div style={{
            margin: '0 auto 16px',
            width: 56, height: 56,
            background: 'var(--accent-subtle)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={24} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access Denied</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            You don't have permission to access the admin panel.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 28px',
              background: 'var(--accent)',
              color: '#000',
              borderRadius: 'var(--radius)',
              fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer',
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return <AdminPageInner />
}

function AdminPageInner() {
  const location = useLocation()
  const path = location.pathname

  // Determine which section to render
  const isContentRoute = path.includes('/admin/content')
  const isDashboard = path === '/admin' || path === '/admin/'
  const isUsers = path.includes('/admin/users')
  const isCategories = path.includes('/admin/categories')
  const isPlans = path.includes('/admin/plans')
  const isPages = path.includes('/admin/pages')
  const isRevenue = path.includes('/admin/revenue')
  const isActivity = path.includes('/admin/activity')
  const isEngagement = path.includes('/admin/engagement')
  const isAnalytics = path.includes('/admin/analytics')
  const isSettings = path.includes('/admin/settings')
  const isNotifications = path.includes('/admin/notifications')

  const renderContent = () => {
    if (isDashboard) return <Dashboard />
    if (isContentRoute) return <ContentPage />
    if (isUsers) return <SectionUsers />
    if (isPlans) return <PlansPage />
    if (isRevenue) return <RevenuePage />
    if (isActivity) return <ActivityPage />
    if (isEngagement) return <EngagementPage />
    if (isCategories) return <CategoriesPage />
    if (isPages) return <PagesManagementPage />
    if (isAnalytics) return <AnalyticsPage />
    if (isNotifications) return <AdminNotificationsPage />
    if (isSettings) return <SettingsPage />
    return <Dashboard />
  }

  return (
    <AdminLayout>
      {renderContent()}
    </AdminLayout>
  )
}