import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../components/admin/AdminLayout'
import SectionDashboard from '../components/admin/SectionDashboard'
import SectionSeries from '../components/admin/SectionSeries'
import SectionAddContent from '../components/admin/SectionAddContent'
import SectionEpisodes from '../components/admin/SectionEpisodes'
import SectionUsers from '../components/admin/SectionUsers'
import SectionAnalytics from '../components/admin/SectionAnalytics'
import SectionSettings from '../components/admin/SectionSettings'
import { adminGetStats, adminGetSeries } from '../api/client'
import { Shield } from 'lucide-react'

const SECTION_LABELS = {
  dashboard: 'Overview',
  series: 'Series',
  add: 'Add Content',
  episodes: 'Episodes',
  users: 'Users',
  analytics: 'Analytics',
  settings: 'Settings',
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] p-4">
        <div className="glass w-full max-w-sm rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A017]/15">
            <Shield className="text-[#D4A017]" size={24} />
          </div>
          <h2 className="mb-2 text-xl font-bold">Access Denied</h2>
          <p className="mb-6 text-sm text-gray-400">You don't have permission to access the admin panel.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-shine rounded-lg bg-[#D4A017] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b8860b]"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return <AdminDashboardInner />
}

function AdminDashboardInner() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [shows, setShows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editShow, setEditShow] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const [statsData, seriesData] = await Promise.all([adminGetStats(), adminGetSeries()])
      setStats(statsData)
      setShows(Array.isArray(seriesData) ? seriesData : [])
    } catch (err) {
      setStats(null)
      setShows([])
      setError(err.message || 'Failed to load admin data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData().catch(() => {})
  }, [fetchData])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [activeSection])

  const statCards = useMemo(() => {
    if (!stats) {
      return [
        { label: 'Total Users', value: '0', change: '+0%' },
        { label: 'Content Library', value: '0', change: '+0' },
        { label: 'Premium Shows', value: '0', change: '+0' },
        { label: 'Premium Users', value: '0', change: '+0%' },
      ]
    }
    return [
      { label: 'Total Users', value: String(stats.totalUsers ?? 0), change: '+0%' },
      { label: 'Content Library', value: String(stats.totalShows ?? 0), change: '+0' },
      { label: 'Premium Shows', value: String(stats.premiumShows ?? 0), change: '+0' },
      { label: 'Premium Users', value: String(stats.plans?.Premium ?? 0), change: '+0%' },
    ]
  }, [stats])

  const handleEditSeries = (show) => {
    setEditShow(show)
    setActiveSection('add')
  }

  const handleSaved = () => {
    setEditShow(null)
    fetchData()
  }

  const handleCancel = () => {
    setEditShow(null)
    setActiveSection('series')
  }

  const handleAddSeries = () => {
    setEditShow(null)
    setActiveSection('add')
  }

  const renderSection = () => {
    if (isLoading && activeSection === 'dashboard') {
      return (
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      )
    }

    switch (activeSection) {
      case 'dashboard':
        return <SectionDashboard statCards={statCards} onAddSeries={handleAddSeries} />
      case 'series':
        return <SectionSeries shows={shows} onAdd={handleAddSeries} onEdit={handleEditSeries} onRefresh={fetchData} />
      case 'add':
        return <SectionAddContent editShow={editShow} onSaved={handleSaved} onCancel={handleCancel} />
      case 'episodes':
        return <SectionEpisodes shows={shows} />
      case 'users':
        return <SectionUsers />
      case 'analytics':
        return <SectionAnalytics />
      case 'settings':
        return <SectionSettings />
      default:
        return null
    }
  }

  return (
    <AdminLayout
      activeSection={activeSection}
      onNavigate={setActiveSection}
      sectionLabel={SECTION_LABELS[activeSection]}
      onAddSeries={handleAddSeries}
      showAddButton={activeSection !== 'add'}
      mobileSidebarOpen={mobileSidebarOpen}
      onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
      onCloseMobileSidebar={() => setMobileSidebarOpen(false)}
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
      )}
      {renderSection()}
    </AdminLayout>
  )
}
