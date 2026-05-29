import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ContentTabs from '../components/cms/ContentTabs'
import ViewToggle from '../components/cms/ViewToggle'
import SearchDropdown from '../components/cms/SearchDropdown'
import SeriesListView from '../components/cms/series/SeriesListView'
import SeriesFlowView from '../components/cms/series/SeriesFlowView'
import MovieListView from '../components/cms/movies/MovieListView'
import MovieForm from '../components/cms/movies/MovieForm'

function getStoredView(tab) {
  try {
    return localStorage.getItem(`cms_view_${tab}`) || 'list'
  } catch { return 'list' }
}

function setStoredView(tab, view) {
  try { localStorage.setItem(`cms_view_${tab}`, view) } catch {}
}

export default function CmsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') || 'series'
  const viewFromUrl = searchParams.get('view')
  const [viewMode, setViewMode] = useState(viewFromUrl || getStoredView(activeTab))

  useEffect(() => {
    const v = getStoredView(activeTab)
    setViewMode(viewFromUrl || v)
  }, [activeTab, viewFromUrl])

  const handleTabChange = useCallback((tab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    params.delete('view')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const handleViewChange = useCallback((view) => {
    setViewMode(view)
    setStoredView(activeTab, view)
    const params = new URLSearchParams(searchParams)
    params.set('view', view)
    setSearchParams(params)
  }, [activeTab, searchParams, setSearchParams])

  const handleSearchSelect = (item) => {
    if (item.type === 'series' || item.type === 'Series') {
      navigate(`/admin/content/series/${item.id}?view=flow`)
    } else if (item.type === 'episode' || item.type === 'Episode') {
      navigate(`/admin/content/episodes/${item.id}?view=flow`)
    } else if (item.type === 'season' || item.type === 'Season') {
      // Navigate to series with season context
      if (item.id) navigate(`/admin/content/series/${item.id}?view=flow`)
    } else if (item.type === 'movie' || item.type === 'Movie') {
      navigate(`/admin/content/movies/${item.id}?view=flow`)
    }
  }

  const handleAddNew = () => {
    if (activeTab === 'series') {
      navigate('/admin/content/series/new')
    } else {
      navigate('/admin/content/movies/new')
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-6 py-3">
        <ContentTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex items-center gap-3">
          <SearchDropdown
            placeholder={activeTab === 'series' ? 'Search series, seasons, episodes…' : 'Search movies…'}
            onSelect={handleSearchSelect}
            type={activeTab === 'series' ? 'all' : 'movies'}
          />
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#D97706]"
          >
            <Plus size={14} />
            Add {activeTab === 'series' ? 'Series' : 'Movie'}
          </button>
        </div>
      </div>

      {/* View Toggle + Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-end">
          <ViewToggle viewMode={viewMode} onChange={handleViewChange} />
        </div>

        {activeTab === 'series' ? (
          viewMode === 'list' ? (
            <SeriesListView />
          ) : (
            <SeriesFlowView />
          )
        ) : (
          viewMode === 'list' ? (
            <MovieListView />
          ) : (
            <MovieForm />
          )
        )}
      </div>
    </div>
  )
}