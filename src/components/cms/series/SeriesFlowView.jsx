import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Plus, X, ChevronDown, ChevronUp, Edit, Trash2, Eye, Loader2, GripVertical, Check, AlertTriangle } from 'lucide-react'
import BreadcrumbBar from '../BreadcrumbBar'
import StatusBadge from '../StatusBadge'
import FileDropzone from '../FileDropzone'
import { createSeries, updateSeries, getSeriesById, getSeasons, createSeason, updateSeason, deleteSeason, getEpisodes, createEpisode, updateEpisode, deleteEpisode, reorderEpisodes } from '../../../lib/api/cms'
import { adminUploadImage, adminUploadVideo } from '../../../api/client'

const INITIAL_SERIES_FORM = {
  title: '',
  release_year: '',
  description: '',
  genre_ids: '',
  tags: '',
  is_premium: false,
  status: 'draft',
  logo_url: '',
  trailer_url: '',
}

const INITIAL_SEASON_FORM = {
  title: '',
  release_year: '',
  description: '',
  premium: false,
}

const INITIAL_EPISODE_FORM = {
  title: '',
  episode_number: '',
  duration_minutes: '',
  description: '',
  status: 'draft',
  premium: false,
  thumbnail_url: '',
  video_url: '',
}

export default function SeriesFlowView() {
  const navigate = useNavigate()
  const { seriesId, seasonId } = useParams()
  const [searchParams] = useSearchParams()

  // State
  const [seriesForm, setSeriesForm] = useState(INITIAL_SERIES_FORM)
  const [selectedSeries, setSelectedSeries] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [seasonForm, setSeasonForm] = useState(INITIAL_SEASON_FORM)
  const [episodeForm, setEpisodeForm] = useState(INITIAL_EPISODE_FORM)
  const [editingSeasonId, setEditingSeasonId] = useState(null)
  const [editingEpisodeId, setEditingEpisodeId] = useState(null)
  const [expandedSeasons, setExpandedSeasons] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [seasonPosterUrl, setSeasonPosterUrl] = useState('')
  // Edit series modal state
  const [editingSeries, setEditingSeries] = useState(false)
  const [editSeriesBannerUrl, setEditSeriesBannerUrl] = useState('')
  const [editSeriesThumbnailUrl, setEditSeriesThumbnailUrl] = useState('')
  const [editSeriesLogoUrl, setEditSeriesLogoUrl] = useState('')
  const [editSeriesTrailerUrl, setEditSeriesTrailerUrl] = useState('')
  const [trailerUploading, setTrailerUploading] = useState(false)

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  // Load series if seriesId is in URL
  useEffect(() => {
    if (seriesId) {
      loadSeries(seriesId)
    }
  }, [seriesId])

  const loadSeries = async (id) => {
    setLoading(true)
    try {
      const res = await getSeriesById(id)
      const series = res.data
      setSelectedSeries(series)
      setSeriesForm({
        title: series.title || '',
        release_year: series.releaseYear?.toString() || '',
        description: series.description || '',
        genre_ids: Array.isArray(series.genre) ? series.genre.join(', ') : series.genre || '',
        tags: Array.isArray(series.tags) ? series.tags.join(', ') : '',
        is_premium: series.premium || false,
        status: series.status || 'draft',
        logo_url: series.logoUrl || '',
        trailer_url: series.trailerUrl || '',
      })
      loadSeasons(id)
    } catch (err) {
      showMsg('error', err.message || 'Failed to load series')
    } finally {
      setLoading(false)
    }
  }

  const loadSeasons = async (id) => {
    try {
      const res = await getSeasons(id)
      setSeasons(res.data || [])
    } catch {
      setSeasons([])
    }
  }

  const loadEpisodes = async (seasonId) => {
    if (!selectedSeries?._id) return
    try {
      const res = await getEpisodes(selectedSeries._id, seasonId)
      setEpisodes(res.data || [])
    } catch {
      setEpisodes([])
    }
  }

  // ─── Series Handlers ──────────────────────────────────────────────
  const handleSeriesChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setSeriesForm(p => ({ ...p, [field]: val }))
  }

  const handleCreateSeries = async (e) => {
    e.preventDefault()
    if (!seriesForm.title) { showMsg('error', 'Title is required'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', seriesForm.title)
      fd.append('release_year', seriesForm.release_year)
      fd.append('description', seriesForm.description)
      fd.append('genre_ids', seriesForm.genre_ids)
      fd.append('tags', seriesForm.tags)
      fd.append('is_premium', seriesForm.is_premium ? 'true' : 'false')
      fd.append('status', seriesForm.status)

      let saved
      if (selectedSeries?._id) {
        saved = await updateSeries(selectedSeries._id, fd)
        showMsg('success', 'Series updated')
      } else {
        saved = await createSeries(fd)
        showMsg('success', 'Series created')
        setSelectedSeries(saved.data)
        navigate(`/admin/content/series/${saved.data._id}?view=flow`, { replace: true })
      }
    } catch (err) {
      showMsg('error', err.message || 'Failed to save series')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Edit Series Modal Handlers ────────────────────────────────────
  const handleOpenEditSeries = () => {
    if (!selectedSeries) return
    setSeriesForm({
      title: selectedSeries.title || '',
      release_year: selectedSeries.releaseYear?.toString() || '',
      description: selectedSeries.description || '',
      genre_ids: Array.isArray(selectedSeries.genre) ? selectedSeries.genre.join(', ') : selectedSeries.genre || '',
      tags: Array.isArray(selectedSeries.tags) ? selectedSeries.tags.join(', ') : '',
      is_premium: selectedSeries.premium || false,
      status: selectedSeries.status || 'draft',
      logo_url: selectedSeries.logoUrl || '',
      trailer_url: selectedSeries.trailerUrl || '',
    })
      setEditSeriesBannerUrl(selectedSeries.banner || '')
      setEditSeriesThumbnailUrl(selectedSeries.thumbnail || '')
      setEditSeriesLogoUrl(selectedSeries.logoUrl || '')
      setEditSeriesTrailerUrl(selectedSeries.trailerUrl || '')
      setEditingSeries(true)
  }

  const handleCloseEditSeries = () => {
    setEditingSeries(false)
    setEditSeriesBannerUrl('')
    setEditSeriesThumbnailUrl('')
    setEditSeriesLogoUrl('')
    setEditSeriesTrailerUrl('')
  }

  const handleEditSeriesTrailerUpload = async (file) => {
    try {
      setTrailerUploading(true)
      const res = await adminUploadVideo(file, 'streamvault/series/trailers')
      const url = res.data?.url || ''
      setEditSeriesTrailerUrl(url)
      showMsg('success', 'Trailer uploaded')
    } catch (err) {
      showMsg('error', err.message || 'Trailer upload failed')
    } finally {
      setTrailerUploading(false)
    }
  }

  const handleEditSeriesBannerUpload = async (file) => {
    try {
      const res = await adminUploadImage(file, 'streamvault/series/banners')
      const url = res.data?.url || ''
      setEditSeriesBannerUrl(url)
      showMsg('success', 'Banner uploaded')
    } catch (err) {
      showMsg('error', err.message || 'Banner upload failed')
    }
  }

  const handleEditSeriesThumbnailUpload = async (file) => {
    try {
      const res = await adminUploadImage(file, 'streamvault/series/thumbnails')
      const url = res.data?.url || ''
      setEditSeriesThumbnailUrl(url)
      showMsg('success', 'Thumbnail uploaded')
    } catch (err) {
      showMsg('error', err.message || 'Thumbnail upload failed')
    }
  }

  const handleSaveEditSeries = async (e) => {
    e.preventDefault()
    if (!seriesForm.title) { showMsg('error', 'Title is required'); return }
    if (!selectedSeries?._id) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', seriesForm.title)
      fd.append('release_year', seriesForm.release_year)
      fd.append('description', seriesForm.description)
      fd.append('genre_ids', seriesForm.genre_ids)
      fd.append('tags', seriesForm.tags)
      fd.append('is_premium', seriesForm.is_premium ? 'true' : 'false')
      fd.append('status', seriesForm.status)
      if (editSeriesBannerUrl) fd.append('banner_url', editSeriesBannerUrl)
      if (editSeriesThumbnailUrl) fd.append('thumbnail_url', editSeriesThumbnailUrl)
      if (editSeriesLogoUrl) fd.append('logo_url', editSeriesLogoUrl)
      if (editSeriesTrailerUrl) fd.append('trailer_url', editSeriesTrailerUrl)

      await updateSeries(selectedSeries._id, fd)
      showMsg('success', 'Series updated')
      handleCloseEditSeries()
      loadSeries(selectedSeries._id)
    } catch (err) {
      showMsg('error', err.message || 'Failed to update series')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Season Handlers ──────────────────────────────────────────────
  const handleSeasonChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setSeasonForm(p => ({ ...p, [field]: val }))
  }

  const handleSeasonPosterUpload = async (file) => {
    try {
      const res = await adminUploadImage(file, 'streamvault/seasons/posters')
      const url = res.data?.url || ''
      setSeasonPosterUrl(url)
      showMsg('success', 'Poster uploaded')
    } catch (err) {
      showMsg('error', err.message || 'Poster upload failed')
    }
  }

  const handleAddSeason = async (e) => {
    e.preventDefault()
    if (!selectedSeries?._id) return
    if (!seasonForm.title) { showMsg('error', 'Season title is required'); return }
    setSubmitting(true)
    try {
      await createSeason(selectedSeries._id, {
        title: seasonForm.title,
        release_year: seasonForm.release_year || null,
        description: seasonForm.description || '',
        poster_url: seasonPosterUrl || undefined,
        is_premium: seasonForm.premium ? 'true' : 'false',
      })
      setSeasonForm(INITIAL_SEASON_FORM)
      setSeasonPosterUrl('')
      loadSeasons(selectedSeries._id)
      showMsg('success', 'Season added')
    } catch (err) {
      showMsg('error', err.message || 'Failed to add season')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSeason = async (seasonId) => {
    if (!selectedSeries?._id) return
    setSubmitting(true)
    try {
      const data = { ...seasonForm }
      if (seasonPosterUrl) data.poster_url = seasonPosterUrl
      await updateSeason(selectedSeries._id, seasonId, data)
      setEditingSeasonId(null)
      setSeasonPosterUrl('')
      loadSeasons(selectedSeries._id)
      showMsg('success', 'Season updated')
    } catch (err) {
      showMsg('error', err.message || 'Failed to update season')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSeason = async (seasonId) => {
    if (!selectedSeries?._id) return
    if (!confirm('Delete this season and all its episodes?')) return
    try {
      await deleteSeason(selectedSeries._id, seasonId)
      loadSeasons(selectedSeries._id)
      if (selectedSeason?._id === seasonId) {
        setSelectedSeason(null)
        setEpisodes([])
      }
      showMsg('success', 'Season deleted')
    } catch (err) {
      showMsg('error', err.message || 'Failed to delete season')
    }
  }

  const handleViewSeasonEpisodes = (season) => {
    setSelectedSeason(season)
    loadEpisodes(season._id)
  }

  const handleEditSeasonClick = (season) => {
    setEditingSeasonId(season._id)
    setSeasonForm({
      title: season.title || '',
      release_year: season.releaseYear?.toString() || '',
      description: season.description || '',
      premium: season.premium || false,
    })
    setSeasonPosterUrl(season.poster || '')
  }

  // ─── Episode Handlers ─────────────────────────────────────────────
  const handleEpisodeChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setEpisodeForm(p => ({ ...p, [field]: val }))
  }

  const handleEpisodeThumbnailUpload = async (file) => {
    try {
      const res = await adminUploadImage(file, 'streamvault/episodes/thumbnails')
      const url = res.data?.url || ''
      setEpisodeForm(p => ({ ...p, thumbnail_url: url }))
      showMsg('success', 'Thumbnail uploaded')
    } catch (err) {
      showMsg('error', err.message || 'Thumbnail upload failed')
    }
  }

  const handleEpisodeVideoUpload = async (file) => {
    try {
      const res = await adminUploadVideo(file, 'streamvault/episodes/videos')
      const url = res.data?.url || ''
      setEpisodeForm(p => ({ ...p, video_url: url }))
      showMsg('success', 'Video uploaded')
    } catch (err) {
      showMsg('error', err.message || 'Video upload failed')
    }
  }

  const handleAddEpisode = async (e) => {
    e.preventDefault()
    if (!selectedSeries?._id || !selectedSeason?._id) return
    if (!episodeForm.title) { showMsg('error', 'Episode title is required'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', episodeForm.title)
      fd.append('episode_number', episodeForm.episode_number)
      fd.append('duration_minutes', episodeForm.duration_minutes)
      fd.append('description', episodeForm.description || '')
      fd.append('status', episodeForm.status)
      fd.append('is_premium', episodeForm.premium ? 'true' : 'false')
      if (episodeForm.thumbnail_url) fd.append('thumbnail_url', episodeForm.thumbnail_url)
      if (episodeForm.video_url) fd.append('video_url', episodeForm.video_url)

      await createEpisode(selectedSeries._id, selectedSeason._id, fd)
      setEpisodeForm(INITIAL_EPISODE_FORM)
      loadEpisodes(selectedSeason._id)
      showMsg('success', 'Episode added')
    } catch (err) {
      showMsg('error', err.message || 'Failed to add episode')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEpisode = async (episodeId) => {
    if (!confirm('Delete this episode?')) return
    try {
      await deleteEpisode(episodeId)
      loadEpisodes(selectedSeason._id)
      showMsg('success', 'Episode deleted')
    } catch (err) {
      showMsg('error', err.message || 'Failed to delete episode')
    }
  }

  // ─── Draggable Reorder ──────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState(null)

  const handleDragStart = (index) => {
    setDragIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const newEpisodes = [...episodes]
    const [moved] = newEpisodes.splice(dragIndex, 1)
    newEpisodes.splice(index, 0, moved)
    setEpisodes(newEpisodes)
    setDragIndex(index)
  }

  const handleDragEnd = async () => {
    setDragIndex(null)
    const order = episodes.map((ep, i) => ({ episode_id: ep._id, order: i + 1 }))
    try {
      await reorderEpisodes(order)
    } catch {}
  }

  // ─── Render ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#F59E0B]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {message.text && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
          message.type === 'success'
            ? 'border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
            : 'border border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Column 1: Add Series */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#141415] p-5">
          <div className="mb-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-black">1</span>
              <h3 className="text-sm font-semibold text-white">ADD {selectedSeries?._id ? 'EDIT' : 'NEW'} SERIES</h3>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">Create and configure the main series details.</p>
          </div>

          <form onSubmit={handleCreateSeries} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Series Title *</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="e.g. Breaking Bad"
                value={seriesForm.title}
                onChange={handleSeriesChange('title')}
                maxLength={200}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Release Year *</label>
              <input
                type="number"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="e.g. 2008"
                value={seriesForm.release_year}
                onChange={handleSeriesChange('release_year')}
                min={1900}
                max={2030}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">
                Description * <span className="text-[#6B7280]">({seriesForm.description.length}/500)</span>
              </label>
              <textarea
                rows={3}
                className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="Describe the series..."
                value={seriesForm.description}
                onChange={handleSeriesChange('description')}
                maxLength={500}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Genre</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="e.g. Drama, Crime (comma-separated)"
                value={seriesForm.genre_ids}
                onChange={handleSeriesChange('genre_ids')}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Tags</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="e.g. award-winning, popular"
                value={seriesForm.tags}
                onChange={handleSeriesChange('tags')}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seriesForm.is_premium}
                  onChange={handleSeriesChange('is_premium')}
                  className="h-4 w-4 rounded border-[rgba(255,255,255,0.06)] bg-[#0F0F10] text-[#F59E0B] focus:ring-[#F59E0B]"
                />
                <span className="text-xs text-[#9CA3AF]">Only premium users can watch</span>
              </label>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Status</label>
              <select
                value={seriesForm.status}
                onChange={handleSeriesChange('status')}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Banner/Image</label>
              <FileDropzone
                accept="image/jpeg,image/png,image/webp"
                maxSize={10 * 1024 * 1024}
                label="Upload banner image"
                currentUrl={selectedSeries?.banner || ''}
                onUpload={async (file) => {
                  const fd = new FormData()
                  fd.append('banner', file)
                  if (selectedSeries?._id) {
                    await updateSeries(selectedSeries._id, fd)
                    loadSeries(selectedSeries._id)
                  }
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Thumbnail</label>
              <FileDropzone
                accept="image/jpeg,image/png,image/webp"
                maxSize={5 * 1024 * 1024}
                label="Upload thumbnail"
                currentUrl={selectedSeries?.thumbnail || ''}
                onUpload={async (file) => {
                  const fd = new FormData()
                  fd.append('thumbnail', file)
                  if (selectedSeries?._id) {
                    await updateSeries(selectedSeries._id, fd)
                    loadSeries(selectedSeries._id)
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#D97706] disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="mx-auto animate-spin" /> : selectedSeries?._id ? 'Update Series & Continue →' : 'Create Series & Continue →'}
            </button>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2">
              <p className="text-[11px] text-[#6B7280]">After creating the series, you can add seasons and episodes.</p>
            </div>
          </form>
        </div>

        {/* Column 2: Seasons */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#141415] p-5">
          <div className="mb-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-black">2</span>
              <h3 className="text-sm font-semibold text-white">ADD / MANAGE SEASONS</h3>
            </div>
            {selectedSeries && (
              <div className="flex items-center justify-between gap-2">
                <BreadcrumbBar
                  path={[{ label: selectedSeries.title }]}
                  status={selectedSeries.status}
                  onEdit={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                />
                <button
                  onClick={handleOpenEditSeries}
                  className="flex-shrink-0 rounded-lg bg-[#F59E0B]/10 px-2.5 py-1.5 text-[11px] font-medium text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors"
                >
                  Edit Series
                </button>
              </div>
            )}
          </div>

          {!selectedSeries ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-[#6B7280]">Create a series first to manage seasons.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Existing seasons list */}
              {seasons.map((season) => (
                <div key={season._id} className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] overflow-hidden">
                  {editingSeasonId === season._id ? (
                    <div className="p-3 space-y-2">
                      <input className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                        placeholder="Season title"
                        value={seasonForm.title}
                        onChange={handleSeasonChange('title')}
                      />
                      <input type="number" className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                        placeholder="Release year"
                        value={seasonForm.release_year}
                        onChange={handleSeasonChange('release_year')}
                      />
                      <textarea rows={2} className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                        placeholder="Description (optional)"
                        value={seasonForm.description}
                        onChange={handleSeasonChange('description')}
                        maxLength={300}
                      />
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Poster</label>
                        <FileDropzone
                          accept="image/jpeg,image/png,image/webp"
                          maxSize={5 * 1024 * 1024}
                          label="Upload season poster"
                          currentUrl={seasonPosterUrl}
                          onUpload={handleSeasonPosterUpload}
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seasonForm.premium || false}
                          onChange={handleSeasonChange('premium')}
                          className="h-4 w-4 rounded border-[rgba(255,255,255,0.06)] bg-[#0F0F10] text-[#F59E0B] focus:ring-[#F59E0B]"
                        />
                        <span className="text-xs text-[#9CA3AF]">Premium Season</span>
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateSeason(season._id)} className="rounded-lg bg-[#F59E0B] px-3 py-1.5 text-xs font-medium text-black">Save</button>
                        <button onClick={() => { setEditingSeasonId(null); setSeasonPosterUrl('') }} className="rounded-lg border border-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs text-[#9CA3AF]">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3">
                      {season.poster ? (
                        <img src={season.poster} alt="" className="h-12 w-12 flex-shrink-0 rounded object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-[#141415] text-[#6B7280] text-xs">S{season.order}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">{season.title}{season.premium && <span className="ml-1 inline-block rounded bg-[rgba(245,197,24,0.15)] px-1.5 py-0.5 text-[10px] font-bold text-[#F59E0B]">PRO</span>}</p>
                          <StatusBadge status={season.status || 'draft'} />
                        </div>
                        <p className="text-[11px] text-[#6B7280]">
                          {season.episodeCount || 0} episodes · {season.releaseYear || '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditSeasonClick(season)}
                          className="rounded p-1 text-[#9CA3AF] hover:text-white"><Edit size={13} /></button>
                        <button onClick={() => handleDeleteSeason(season._id)}
                          className="rounded p-1 text-[#9CA3AF] hover:text-red-400"><Trash2 size={13} /></button>
                        <button onClick={() => handleViewSeasonEpisodes(season)}
                          className="rounded-lg bg-[#F59E0B]/10 px-2.5 py-1 text-[11px] font-medium text-[#F59E0B] hover:bg-[#F59E0B]/20">
                          View Episodes →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add season form */}
              <div className="rounded-lg border border-dashed border-[rgba(255,255,255,0.06)] p-3">
                <p className="mb-2 text-xs font-medium text-[#9CA3AF]">Add New Season</p>
                <div className="space-y-2">
                  <input className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                    placeholder="Season title"
                    value={seasonForm.title}
                    onChange={handleSeasonChange('title')}
                  />
                  <input type="number" className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                    placeholder="Release year"
                    value={seasonForm.release_year}
                    onChange={handleSeasonChange('release_year')}
                  />
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Poster</label>
                    <FileDropzone
                      accept="image/jpeg,image/png,image/webp"
                      maxSize={5 * 1024 * 1024}
                      label="Upload season poster"
                      currentUrl={seasonPosterUrl}
                      onUpload={handleSeasonPosterUpload}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seasonForm.premium || false}
                      onChange={handleSeasonChange('premium')}
                      className="h-4 w-4 rounded border-[rgba(255,255,255,0.06)] bg-[#0F0F10] text-[#F59E0B] focus:ring-[#F59E0B]"
                    />
                    <span className="text-xs text-[#9CA3AF]">Premium Season</span>
                  </label>
                  <button onClick={handleAddSeason} disabled={submitting}
                    className="w-full rounded-lg bg-[#F59E0B] py-2 text-xs font-medium text-black hover:bg-[#D97706] disabled:opacity-60">
                    {submitting ? 'Adding...' : '+ Add Season'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Episodes */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#141415] p-5">
          <div className="mb-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-black">3</span>
              <h3 className="text-sm font-semibold text-white">ADD / MANAGE EPISODES</h3>
            </div>
            {selectedSeason && selectedSeries && (
              <BreadcrumbBar
                path={[
                  { label: selectedSeries.title },
                  { label: selectedSeason.title || `Season ${selectedSeason.order}` }
                ]}
                status={selectedSeason.status || 'draft'}
              />
            )}
          </div>

          {!selectedSeason ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-[#6B7280]">Select a season to manage episodes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Episodes table */}
              <div className="space-y-1">
                {episodes.map((ep, i) => (
                  <div
                    key={ep._id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 transition-colors ${dragIndex === i ? 'opacity-50' : ''}`}
                  >
                    <div className="cursor-grab text-[#6B7280]"><GripVertical size={14} /></div>
                    <span className="w-6 text-center text-[11px] text-[#6B7280]">{ep.episodeNumber || ep.order || i + 1}</span>
                    {ep.thumbnail && (
                      <img src={ep.thumbnail} alt="" className="h-8 w-12 flex-shrink-0 rounded object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{ep.title}{ep.premium && <span className="ml-1 inline-block rounded bg-[rgba(245,197,24,0.15)] px-1.5 py-0.5 text-[10px] font-bold text-[#F59E0B]">PRO</span>}</p>
                      <p className="text-[10px] text-[#6B7280]">{ep.durationMinutes || ep.video?.duration ? `${ep.durationMinutes || Math.round((ep.video?.duration || 0) / 60)}m` : '-'}</p>
                    </div>
                    <StatusBadge status={ep.status || 'draft'} />
                    <button onClick={() => handleDeleteEpisode(ep._id)} className="rounded p-1 text-[#9CA3AF] hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                ))}
                {episodes.length === 0 && (
                  <p className="py-4 text-center text-xs text-[#6B7280]">No episodes yet.</p>
                )}
              </div>

              {/* Add episode form */}
              <div className="rounded-lg border border-dashed border-[rgba(255,255,255,0.06)] p-3">
                <p className="mb-2 text-xs font-medium text-[#9CA3AF]">Add New Episode</p>
                <div className="space-y-2">
                  <div>
                    <input className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                      placeholder="Episode title *"
                      value={episodeForm.title}
                      onChange={handleEpisodeChange('title')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                      placeholder="Episode #"
                      value={episodeForm.episode_number}
                      onChange={handleEpisodeChange('episode_number')}
                    />
                    <input type="number" className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                      placeholder="Duration (min)"
                      value={episodeForm.duration_minutes}
                      onChange={handleEpisodeChange('duration_minutes')}
                    />
                  </div>
                  <textarea rows={2} className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                    placeholder="Description (optional)"
                    value={episodeForm.description}
                    onChange={handleEpisodeChange('description')}
                    maxLength={300}
                  />
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Thumbnail</label>
                    <FileDropzone
                      accept="image/jpeg,image/png,image/webp"
                      maxSize={5 * 1024 * 1024}
                      label="Upload episode thumbnail"
                      currentUrl={episodeForm.thumbnail_url}
                      onUpload={handleEpisodeThumbnailUpload}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Video File</label>
                    <FileDropzone
                      accept="video/mp4,video/webm,video/quicktime"
                      maxSize={5 * 1024 * 1024 * 1024}
                      label="Upload episode video"
                      currentUrl={episodeForm.video_url}
                      onUpload={handleEpisodeVideoUpload}
                    />
                    {episodeForm.video_url && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-[rgba(255,255,255,0.06)]">
                        <video
                          src={episodeForm.video_url}
                          controls
                          className="w-full max-h-[160px] bg-black"
                          style={{ pointerEvents: 'auto' }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={episodeForm.premium || false}
                      onChange={handleEpisodeChange('premium')}
                      className="h-4 w-4 rounded border-[rgba(255,255,255,0.06)] bg-[#0F0F10] text-[#F59E0B] focus:ring-[#F59E0B]"
                    />
                    <span className="text-xs text-[#9CA3AF]">Premium Episode</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleAddEpisode} disabled={submitting}
                      className="rounded-lg bg-[#F59E0B] py-2 text-xs font-medium text-black hover:bg-[#D97706] disabled:opacity-60">
                      {submitting ? 'Saving...' : 'Save Episode'}
                    </button>
                    <button onClick={() => setEpisodeForm(INITIAL_EPISODE_FORM)}
                      className="rounded-lg border border-[rgba(255,255,255,0.06)] py-2 text-xs text-[#9CA3AF]">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Edit Series Modal ──────────────────────────────────────── */}
      {editingSeries && selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#141415] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">EDIT SERIES</h3>
                <p className="text-[11px] text-[#9CA3AF]">Update series fields and media.</p>
              </div>
              <button onClick={handleCloseEditSeries} className="rounded p-1 text-[#9CA3AF] hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEditSeries} className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Series Title *</label>
                <input
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                  placeholder="e.g. Breaking Bad"
                  value={seriesForm.title}
                  onChange={handleSeriesChange('title')}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Release Year *</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                  placeholder="e.g. 2008"
                  value={seriesForm.release_year}
                  onChange={handleSeriesChange('release_year')}
                  min={1900}
                  max={2030}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">
                  Description <span className="text-[#6B7280]">({seriesForm.description.length}/500)</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                  placeholder="Describe the series..."
                  value={seriesForm.description}
                  onChange={handleSeriesChange('description')}
                  maxLength={500}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Genre</label>
                  <input
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                    placeholder="Drama, Crime"
                    value={seriesForm.genre_ids}
                    onChange={handleSeriesChange('genre_ids')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Tags</label>
                  <input
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                    placeholder="award-winning"
                    value={seriesForm.tags}
                    onChange={handleSeriesChange('tags')}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seriesForm.is_premium}
                    onChange={handleSeriesChange('is_premium')}
                    className="h-4 w-4 rounded border-[rgba(255,255,255,0.06)] bg-[#0F0F10] text-[#F59E0B] focus:ring-[#F59E0B]"
                  />
                  <span className="text-xs text-[#9CA3AF]">Only premium users can watch</span>
                </label>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Status</label>
                <select
                  value={seriesForm.status}
                  onChange={handleSeriesChange('status')}
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Banner</label>
                  <FileDropzone
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={10 * 1024 * 1024}
                    label="Upload banner"
                    currentUrl={editSeriesBannerUrl}
                    onUpload={handleEditSeriesBannerUpload}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Thumbnail</label>
                  <FileDropzone
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={5 * 1024 * 1024}
                    label="Upload thumbnail"
                    currentUrl={editSeriesThumbnailUrl}
                    onUpload={handleEditSeriesThumbnailUpload}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Logo</label>
                  <FileDropzone
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={5 * 1024 * 1024}
                    label="Upload logo"
                    currentUrl={editSeriesLogoUrl}
                    onUpload={async (file) => {
                      try {
                        const res = await adminUploadImage(file, 'streamvault/series/logos')
                        setEditSeriesLogoUrl(res.data?.url || '')
                        showMsg('success', 'Logo uploaded')
                      } catch (err) {
                        showMsg('error', err.message || 'Logo upload failed')
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Trailer Video</label>
                  {trailerUploading && (
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-[#F59E0B]">
                      <Loader2 size={12} className="animate-spin" /> Uploading trailer...
                    </div>
                  )}
                  <FileDropzone
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    maxSize={500 * 1024 * 1024}
                    label="Upload trailer video (MP4, WebM)"
                    currentUrl={editSeriesTrailerUrl}
                    onUpload={handleEditSeriesTrailerUpload}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#D97706] disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={14} className="mx-auto animate-spin" /> : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditSeries}
                  disabled={submitting}
                  className="rounded-lg border border-[rgba(255,255,255,0.06)] px-4 py-2 text-sm text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}