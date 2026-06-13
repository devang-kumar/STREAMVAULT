import { useEffect, useMemo, useState, useRef } from 'react'
import { Check, AlertTriangle, Plus, Loader2, ChevronDown, Search, Upload } from 'lucide-react'
import {
  adminCreateEpisode,
  adminCreateMovie,
  adminCreateSeries,
  adminDeleteMovie,
  adminGetContentIndex,
  adminUpdateMovie,
  adminUpdateSeries,
  adminUploadImage,
} from '../../api/client'
import { DropZone } from './ui'

const CATEGORIES = ['Action', 'Crime', 'Drama', 'Sci-Fi', 'Thriller', 'Horror', 'Mystery', 'Romance', 'Comedy', 'Documentary']

const emptySeriesForm = {
  title: '',
  year: '',
  description: '',
  genre: '',
  rating: '',
  tag: '',
  premium: false,
  seasons: 1,
}

const emptyMovieForm = {
  title: '',
  year: '',
  description: '',
  genre: '',
  rating: '',
  tag: 'New',
  premium: false,
}

const emptyEpisodeForm = {
  title: '',
  duration: '',
  description: '',
  videoUrl: '',
  premium: false,
  episodeNumber: 1,
  season: 1,
  thumbnailFile: null,
  videoFile: null,
}

export default function SectionAddContent({ onSaved = () => {} }) {
  const [mode, setMode] = useState('series') // series | movie
  const [search, setSearch] = useState('')
  const [indexLoading, setIndexLoading] = useState(false)
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  const [seriesForm, setSeriesForm] = useState(emptySeriesForm)
  const [seriesFiles, setSeriesFiles] = useState({ thumbnail: null, banner: null })
  const [seriesPreviews, setSeriesPreviews] = useState({ thumbnail: '', banner: '' })
  const [movieForm, setMovieForm] = useState(emptyMovieForm)
  const [episodes, setEpisodes] = useState([])
  const [openSeasons, setOpenSeasons] = useState({})
  const [episodeForm, setEpisodeForm] = useState(emptyEpisodeForm)
  const [seasonPosters, setSeasonPosters] = useState({})
  const [seasonPosterPreviews, setSeasonPosterPreviews] = useState({})

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Refs for file inputs
  const seriesThumbnailRef = useRef(null)
  const seriesBannerRef = useRef(null)
  const episodeThumbnailRef = useRef(null)
  const episodeVideoRef = useRef(null)

  const episodesBySeason = useMemo(() => {
    return episodes.reduce((acc, ep) => {
      const season = Number(ep.season || 1)
      if (!acc[season]) acc[season] = []
      acc[season].push(ep)
      acc[season].sort((a, b) => Number(a.episodeNumber || 0) - Number(b.episodeNumber || 0))
      return acc
    }, {})
  }, [episodes])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const fetchIndex = async (nextSearch = search, nextMode = mode) => {
    try {
      setIndexLoading(true)
      const data = await adminGetContentIndex({ q: nextSearch, type: nextMode })
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setItems([])
      showMessage('error', err.message || 'Failed to load content index')
    } finally {
      setIndexLoading(false)
    }
  }

  useEffect(() => {
    fetchIndex('', mode)
    setSelectedItem(null)
  }, [mode])

  useEffect(() => {
    const t = setTimeout(() => fetchIndex(search, mode), 250)
    return () => clearTimeout(t)
  }, [search])

  // Cleanup preview object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(seriesPreviews).forEach(url => { if (url) URL.revokeObjectURL(url) })
      Object.values(seasonPosterPreviews).forEach(url => { if (url) URL.revokeObjectURL(url) })
    }
  }, [])

  const selectItem = (item) => {
    setSelectedItem(item)
    if (mode === 'series') {
      setSeriesForm({
        title: item.title || '',
        year: item.year?.toString() || '',
        description: item.description || '',
        genre: Array.isArray(item.genre) ? item.genre[0] || '' : item.genre || '',
        rating: item.rating?.toString() || '',
        tag: item.tag || 'New',
        premium: Boolean(item.premium),
        seasons: item.seasons || 1,
      })
      setSeriesFiles({ thumbnail: null, banner: null })
      setSeriesPreviews({ thumbnail: '', banner: '' })
      setEpisodes([])
      setOpenSeasons({})
      setSeasonPosters({})
      setSeasonPosterPreviews({})
    } else {
      setMovieForm({
        title: item.title || '',
        year: item.year?.toString() || '',
        description: item.description || '',
        genre: Array.isArray(item.genre) ? item.genre[0] || '' : item.genre || '',
        rating: item.rating?.toString() || '',
        tag: item.tag || 'New',
        premium: Boolean(item.premium),
      })
    }
  }

  const handleSeriesFile = (field) => (file) => {
    // Revoke old preview
    if (seriesPreviews[field]) URL.revokeObjectURL(seriesPreviews[field])
    setSeriesFiles(p => ({ ...p, [field]: file }))
    setSeriesPreviews(p => ({ ...p, [field]: file ? URL.createObjectURL(file) : '' }))
  }

  const clearSeriesFile = (field) => () => {
    if (seriesPreviews[field]) URL.revokeObjectURL(seriesPreviews[field])
    setSeriesFiles(p => ({ ...p, [field]: null }))
    setSeriesPreviews(p => ({ ...p, [field]: '' }))
  }

  const handleSeasonPosterFile = (seasonNo) => (file) => {
    const key = String(seasonNo)
    if (seasonPosterPreviews[key]) URL.revokeObjectURL(seasonPosterPreviews[key])
    setSeasonPosters(p => ({ ...p, [key]: file }))
    setSeasonPosterPreviews(p => ({ ...p, [key]: file ? URL.createObjectURL(file) : '' }))
  }

  const clearSeasonPoster = (seasonNo) => () => {
    const key = String(seasonNo)
    if (seasonPosterPreviews[key]) URL.revokeObjectURL(seasonPosterPreviews[key])
    setSeasonPosters(p => ({ ...p, [key]: null }))
    setSeasonPosterPreviews(p => ({ ...p, [key]: '' }))
  }

  const setSeries = (field) => (e) => setSeriesForm((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setMovie = (field) => (e) => setMovieForm((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setEp = (field) => (e) => setEpisodeForm((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleEpisodeThumbnail = (file) => {
    setEpisodeForm(p => ({ ...p, thumbnailFile: file }))
  }
  const clearEpisodeThumbnail = () => setEpisodeForm(p => ({ ...p, thumbnailFile: null }))

  const handleEpisodeVideo = (file) => {
    setEpisodeForm(p => ({ ...p, videoFile: file }))
  }
  const clearEpisodeVideo = () => setEpisodeForm(p => ({ ...p, videoFile: null }))

  const addEpisode = () => {
    if (!episodeForm.title) {
      showMessage('error', 'Episode title is required')
      return
    }
    const seasonNo = Number(episodeForm.season || 1)
    const next = { ...episodeForm, id: Date.now(), season: seasonNo }
    setEpisodes((prev) => [...prev, next])
    setOpenSeasons((prev) => ({ ...prev, [seasonNo]: true }))
    setEpisodeForm({ ...emptyEpisodeForm, season: seasonNo })
  }

  const removeEpisode = (id) => setEpisodes((prev) => prev.filter((e) => e.id !== id))

  const createSeriesPayload = () => {
    const fd = new FormData()
    fd.append('title', seriesForm.title)
    fd.append('description', seriesForm.description || '')
    fd.append('genre', seriesForm.genre || 'Action')
    fd.append('releaseYear', seriesForm.year)
    fd.append('seasons', String(seriesForm.seasons || 1))
    fd.append('rating', String(seriesForm.rating || 0))
    fd.append('tag', seriesForm.tag || 'New')
    fd.append('premium', seriesForm.premium ? 'true' : 'false')
    fd.append('contentType', 'series')
    if (seriesFiles.thumbnail) fd.append('thumbnail', seriesFiles.thumbnail)
    if (seriesFiles.banner) fd.append('banner', seriesFiles.banner)
    return fd
  }

  const createMoviePayload = () => {
    const fd = new FormData()
    fd.append('title', movieForm.title)
    fd.append('description', movieForm.description || '')
    fd.append('genre', movieForm.genre || 'Action')
    fd.append('releaseYear', movieForm.year)
    fd.append('rating', String(movieForm.rating || 0))
    fd.append('tag', movieForm.tag || 'New')
    fd.append('premium', movieForm.premium ? 'true' : 'false')
    return fd
  }

  const handleSaveSeries = async (e) => {
    e.preventDefault()
    if (!seriesForm.title || !seriesForm.year) {
      showMessage('error', 'Title and year are required')
      return
    }

    setSubmitting(true)
    try {
      const payload = createSeriesPayload()
      let saved
      if (selectedItem?.id) {
        saved = await adminUpdateSeries(selectedItem.id, payload)
        showMessage('success', 'Series updated successfully')
      } else {
        saved = await adminCreateSeries(payload)
        showMessage('success', 'Series created successfully')
      }

      const seriesId = selectedItem?.id || saved?.id
      if (!selectedItem?.id && seriesId && episodes.length > 0) {
        for (const ep of episodes) {
          const epData = new FormData()
          epData.append('seriesId', seriesId)
          epData.append('title', ep.title)
          epData.append('description', ep.description || '')
          epData.append('episodeNumber', String(ep.episodeNumber || 1))
          epData.append('season', String(ep.season || 1))
          epData.append('premium', ep.premium ? 'true' : 'false')
          epData.append('duration', ep.duration || '0')
          if (ep.videoUrl) epData.append('videoUrl', ep.videoUrl)
          if (ep.thumbnailFile) epData.append('thumbnail', ep.thumbnailFile)
          if (ep.videoFile) epData.append('video', ep.videoFile)
          await adminCreateEpisode(epData)
        }
      }

      // Upload season posters for existing series
      const posterSeasonIds = Object.keys(seasonPosters).filter(k => seasonPosters[k])
      for (const seasonKey of posterSeasonIds) {
        // Try to find the season from the saved series data
        const seasonNo = parseInt(seasonKey, 10)
        try {
          // Use dedicated image upload for season poster, then patch the season
          const uploadRes = await adminUploadImage(seasonPosters[seasonKey], 'streamvault/seasons/posters')
          const posterUrl = uploadRes.data?.url || ''
          if (posterUrl && seriesId) {
            await fetch(`/api/admin/seasons/${seriesId}/${seasonNo}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ poster_url: posterUrl }),
            }).catch(() => {})
          }
        } catch (_) {}
      }

      setSeriesForm(emptySeriesForm)
      setSeriesFiles({ thumbnail: null, banner: null })
      setSeriesPreviews({ thumbnail: '', banner: '' })
      setEpisodes([])
      setSelectedItem(null)
      setSeasonPosters({})
      setSeasonPosterPreviews({})
      fetchIndex('', 'series')
      onSaved()
    } catch (err) {
      showMessage('error', err.message || 'Failed to save series')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveMovie = async (e) => {
    e.preventDefault()
    if (!movieForm.title || !movieForm.year) {
      showMessage('error', 'Title and year are required')
      return
    }
    setSubmitting(true)
    try {
      const payload = createMoviePayload()
      if (selectedItem?.id) {
        await adminUpdateMovie(selectedItem.id, payload)
        showMessage('success', 'Movie updated successfully')
      } else {
        await adminCreateMovie(payload)
        showMessage('success', 'Movie created successfully')
      }
      setMovieForm(emptyMovieForm)
      setSelectedItem(null)
      fetchIndex('', 'movie')
      onSaved()
    } catch (err) {
      showMessage('error', err.message || 'Failed to save movie')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMovie = async () => {
    if (!selectedItem?.id) return
    setSubmitting(true)
    try {
      await adminDeleteMovie(selectedItem.id)
      showMessage('success', 'Movie deleted successfully')
      setMovieForm(emptyMovieForm)
      setSelectedItem(null)
      fetchIndex('', 'movie')
      onSaved()
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete movie')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-white sm:text-3xl">Content Management</h2>
          <p className="text-xs text-gray-500">Single connected flow for series, seasons, episodes and movies</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-dark input-dark--icon-left text-xs" placeholder={`Search ${mode}, season, episode...`} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {['series', 'movie'].map((t) => (
          <button
            key={t}
            onClick={() => setMode(t)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              mode === t ? 'border-[#D4A017]/60 bg-[#D4A017]/15 text-[#D4A017]' : 'border-[#2a2a3d] text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {message.text && (
        <div className={`rounded-lg px-4 py-2 text-sm ${message.type === 'success' ? 'border border-green-500/30 bg-green-500/10 text-green-300' : 'border border-red-500/30 bg-red-500/10 text-red-300'}`}>
          <div className="flex items-center gap-2">{message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}{message.text}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="glass rounded-xl p-4 xl:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-white">{mode === 'series' ? 'Series List' : 'Movies List'}</h3>
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {indexLoading ? (
              <p className="text-xs text-gray-500">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-gray-500">No items found.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectItem(item)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${selectedItem?.id === item.id ? 'border-[#D4A017]/60 bg-[#D4A017]/10' : 'border-[#1E1E2E] hover:border-[#2a2a3d]'}`}
                >
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  <p className="text-[11px] text-gray-500">
                    {mode === 'series' ? `${item.seasons || 1} seasons · ${item.totalEpisodes || 0} episodes` : `${item.year || '-'} · ${item.genre?.[0] || '-'}`}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-4 xl:col-span-2">
          {mode === 'series' ? (
            <form onSubmit={handleSaveSeries} className="space-y-4">
              <h3 className="text-sm font-semibold text-white">{selectedItem ? 'Edit Series' : 'Add New Series'}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input className="input-dark" placeholder="Series title" value={seriesForm.title} onChange={setSeries('title')} />
                <input className="input-dark" placeholder="Release year" value={seriesForm.year} onChange={setSeries('year')} />
              </div>
              <textarea rows={3} className="input-dark resize-none" placeholder="Description" value={seriesForm.description} onChange={setSeries('description')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <select className="input-dark" value={seriesForm.genre} onChange={setSeries('genre')}>
                  <option value="">Select genre</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input className="input-dark" placeholder="Rating" value={seriesForm.rating} onChange={setSeries('rating')} />
                <input className="input-dark" placeholder="Tag" value={seriesForm.tag} onChange={setSeries('tag')} />
              </div>

              {/* ─── Series Media ─────────────────────────────── */}
              <div className="rounded-lg border border-[#1E1E2E] p-3">
                <p className="mb-3 text-xs font-semibold text-white">Media</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[11px] text-gray-400">Series Thumbnail</p>
                    <div onClick={() => seriesThumbnailRef.current?.click()} className="relative cursor-pointer">
                      <DropZone
                        label="thumbnail"
                        accept="image/*"
                        height={120}
                        preview={seriesPreviews.thumbnail}
                        onClear={clearSeriesFile('thumbnail')}
                      />
                      <input
                        ref={seriesThumbnailRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleSeriesFile('thumbnail')(e.target.files[0])
                          e.target.value = ''
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] text-gray-400">Series Banner</p>
                    <div onClick={() => seriesBannerRef.current?.click()} className="relative cursor-pointer">
                      <DropZone
                        label="banner"
                        accept="image/*"
                        height={160}
                        preview={seriesPreviews.banner}
                        onClear={clearSeriesFile('banner')}
                      />
                      <input
                        ref={seriesBannerRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleSeriesFile('banner')(e.target.files[0])
                          e.target.value = ''
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#1E1E2E] p-3">
                <p className="mb-2 text-xs font-semibold text-white">Add / Manage Episodes</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input className="input-dark text-xs" placeholder="Episode title" value={episodeForm.title} onChange={setEp('title')} />
                  <input className="input-dark text-xs" placeholder="Duration" value={episodeForm.duration} onChange={setEp('duration')} />
                  <input className="input-dark text-xs" placeholder="Episode #" value={episodeForm.episodeNumber} onChange={setEp('episodeNumber')} />
                  <input className="input-dark text-xs" placeholder="Season #" value={episodeForm.season} onChange={setEp('season')} />
                </div>
                <textarea rows={2} className="input-dark mt-3 resize-none text-xs" placeholder="Episode description" value={episodeForm.description} onChange={setEp('description')} />

                {/* ─── Episode Media ──────────────────────── */}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[11px] text-gray-400">Episode Thumbnail</p>
                    <div onClick={() => episodeThumbnailRef.current?.click()} className="relative cursor-pointer">
                      <DropZone
                        label="thumbnail"
                        accept="image/*"
                        height={100}
                        preview={episodeForm.thumbnailFile ? URL.createObjectURL(episodeForm.thumbnailFile) : ''}
                        onClear={clearEpisodeThumbnail}
                      />
                      <input
                        ref={episodeThumbnailRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleEpisodeThumbnail(e.target.files[0])
                          e.target.value = ''
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] text-gray-400">Episode Video</p>
                    <div onClick={() => episodeVideoRef.current?.click()} className="relative cursor-pointer">
                      <DropZone
                        label="video"
                        accept="video/*"
                        height={100}
                        preview={episodeForm.videoFile ? episodeForm.videoFile.name : ''}
                        onClear={clearEpisodeVideo}
                      />
                      <input
                        ref={episodeVideoRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleEpisodeVideo(e.target.files[0])
                          e.target.value = ''
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={addEpisode} className="inline-flex items-center gap-1 rounded-lg bg-[#D4A017] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b8860b]"><Plus size={12} /> Add Episode</button>
                </div>

                {Object.keys(episodesBySeason).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(episodesBySeason).map(([seasonNo, eps]) => (
                      <div key={seasonNo} className="rounded-lg border border-[#1E1E2E]">
                        <button type="button" onClick={() => setOpenSeasons((p) => ({ ...p, [seasonNo]: !p[seasonNo] }))} className="flex w-full items-center justify-between px-3 py-2 text-xs text-gray-300">
                          <span>Season {seasonNo} · {eps.length} episodes</span>
                          <ChevronDown size={14} className={`${openSeasons[seasonNo] !== false ? 'rotate-180' : ''} transition-transform`} />
                        </button>
                        {openSeasons[seasonNo] !== false && (
                          <div className="space-y-1 border-t border-[#1E1E2E] p-2">
                            {eps.map((ep) => (
                              <div key={ep.id} className="flex items-center justify-between rounded bg-white/[0.02] px-2 py-1.5 text-xs">
                                <span className="truncate text-gray-300">E{ep.episodeNumber} · {ep.title}</span>
                                <button type="button" onClick={() => removeEpisode(ep.id)} className="text-red-400">Remove</button>
                              </div>
                            ))}
                            {/* ─── Season Poster ──────────────── */}
                            <div className="mt-2 border-t border-[#1E1E2E]/50 pt-2">
                              <p className="mb-1.5 text-[11px] text-gray-400">Season {seasonNo} Poster</p>
                              <div className="w-1/2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`season-poster-${seasonNo}`}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) handleSeasonPosterFile(seasonNo)(e.target.files[0])
                                    e.target.value = ''
                                  }}
                                />
                                <label htmlFor={`season-poster-${seasonNo}`} className="block cursor-pointer">
                                  <DropZone
                                    label="poster"
                                    accept="image/*"
                                    height={90}
                                    small
                                    preview={seasonPosterPreviews[String(seasonNo)] || ''}
                                    onClear={clearSeasonPoster(seasonNo)}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button disabled={submitting} className="btn-shine inline-flex items-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8860b] disabled:opacity-60">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {selectedItem ? 'Update Series' : 'Create Series'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSaveMovie} className="space-y-4">
              <h3 className="text-sm font-semibold text-white">{selectedItem ? 'Edit Movie' : 'Add New Movie'}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input className="input-dark" placeholder="Movie title" value={movieForm.title} onChange={setMovie('title')} />
                <input className="input-dark" placeholder="Release year" value={movieForm.year} onChange={setMovie('year')} />
              </div>
              <textarea rows={3} className="input-dark resize-none" placeholder="Description" value={movieForm.description} onChange={setMovie('description')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <select className="input-dark" value={movieForm.genre} onChange={setMovie('genre')}>
                  <option value="">Select genre</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input className="input-dark" placeholder="Rating" value={movieForm.rating} onChange={setMovie('rating')} />
                <input className="input-dark" placeholder="Tag" value={movieForm.tag} onChange={setMovie('tag')} />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button disabled={submitting} className="btn-shine inline-flex items-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8860b] disabled:opacity-60">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {selectedItem ? 'Update Movie' : 'Create Movie'}
                </button>
                {selectedItem && (
                  <button type="button" onClick={handleDeleteMovie} className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10">
                    Delete Movie
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}