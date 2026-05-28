import { useState, useEffect } from 'react'
import { Edit, Trash2, Lock, Play, Plus, X, Loader2, AlertTriangle, Check } from 'lucide-react'
import { adminGetEpisodes, adminCreateEpisode, adminUpdateEpisode, adminDeleteEpisode } from '../../api/client'

export default function SectionEpisodes({ shows = [] }) {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedShow, setSelectedShow] = useState('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editEp, setEditEp] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [epForm, setEpForm] = useState({
    seriesId: '',
    title: '',
    description: '',
    episodeNumber: 1,
    season: 1,
    duration: '',
    videoUrl: '',
    premium: false,
  })
  const [epThumbFile, setEpThumbFile] = useState(null)
  const [epVideoFile, setEpVideoFile] = useState(null)

  const fetchEpisodes = async () => {
    try {
      setLoading(true)
      const data = await adminGetEpisodes()
      setEpisodes(Array.isArray(data) ? data : [])
    } catch (err) {
      setEpisodes([])
      showMessage('error', err.message || 'Failed to fetch episodes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEpisodes()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const filtered = episodes.filter((ep) => {
    if (selectedShow !== 'all' && ep.showId !== selectedShow) return false
    if (search && !ep.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getShowTitle = (showId) => {
    const show = shows.find((s) => s.id === showId)
    return show?.title || 'Unknown'
  }

  const openAddForm = () => {
    setEditEp(null)
    setEpForm({
      seriesId: shows.length > 0 ? shows[0].id : '',
      title: '',
      description: '',
      episodeNumber: 1,
      season: 1,
      duration: '',
      videoUrl: '',
      premium: false,
    })
    setEpThumbFile(null)
    setEpVideoFile(null)
    setShowForm(true)
  }

  const openEditForm = (ep) => {
    setEditEp(ep)
    setEpForm({
      seriesId: ep.showId || '',
      title: ep.title || '',
      description: ep.desc || '',
      episodeNumber: ep.episodeNumber || 1,
      season: ep.season || 1,
      duration: ep.duration || '',
      videoUrl: ep.videoUrl || '',
      premium: Boolean(ep.premium),
    })
    setEpThumbFile(null)
    setEpVideoFile(null)
    setShowForm(true)
  }

  const handleFormField = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setEpForm((prev) => ({ ...prev, [field]: val }))
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!epForm.title || !epForm.seriesId) {
      showMessage('error', 'Title and Series are required')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('seriesId', epForm.seriesId)
      formData.append('title', epForm.title)
      formData.append('description', epForm.description || '')
      formData.append('episodeNumber', String(epForm.episodeNumber || 1))
      formData.append('season', String(epForm.season || 1))
      formData.append('premium', epForm.premium ? 'true' : 'false')
      formData.append('duration', epForm.duration || '0')
      if (epForm.videoUrl) formData.append('videoUrl', epForm.videoUrl)
      if (epVideoFile) formData.append('video', epVideoFile)
      if (epThumbFile) formData.append('thumbnail', epThumbFile)

      if (editEp) {
        await adminUpdateEpisode(editEp.id, formData)
        showMessage('success', 'Episode updated successfully')
      } else {
        await adminCreateEpisode(formData)
        showMessage('success', 'Episode created successfully')
      }

      setShowForm(false)
      fetchEpisodes()
    } catch (err) {
      showMessage('error', err.message || 'Failed to save episode')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    setConfirmDelete(null)
    try {
      await adminDeleteEpisode(id)
      showMessage('success', 'Episode deleted')
      fetchEpisodes()
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete episode')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl text-white">Episodes</h2>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark w-full text-xs sm:w-48"
            placeholder="Search episodes..."
          />
          <select value={selectedShow} onChange={(e) => setSelectedShow(e.target.value)} className="input-dark w-full text-xs sm:w-48">
            <option value="all">All Series</option>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <button onClick={openAddForm} className="btn-shine flex items-center justify-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2 text-sm text-white transition-colors hover:bg-[#b8860b]">
            <Plus size={14} /> Add Episode
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
            message.type === 'success'
              ? 'border border-green-500/30 bg-green-500/10 text-green-300'
              : 'border border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="glass mb-6 rounded-xl p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{editEp ? 'Edit Episode' : 'Add New Episode'}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 transition-colors hover:text-white">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Series *</label>
                <select value={epForm.seriesId} onChange={handleFormField('seriesId')} className="input-dark" required>
                  <option value="">Select series</option>
                  {shows.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Title *</label>
                <input type="text" value={epForm.title} onChange={handleFormField('title')} className="input-dark" placeholder="Episode title" required />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-400">Description</label>
              <textarea rows={2} value={epForm.description} onChange={handleFormField('description')} className="input-dark resize-none" placeholder="Description..." />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Episode #</label>
                <input type="number" min="1" value={epForm.episodeNumber} onChange={handleFormField('episodeNumber')} className="input-dark" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Season</label>
                <input type="number" min="1" value={epForm.season} onChange={handleFormField('season')} className="input-dark" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Duration</label>
                <input type="text" value={epForm.duration} onChange={handleFormField('duration')} className="input-dark" placeholder="45m" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Video URL</label>
                <input
                  type="url"
                  value={epForm.videoUrl}
                  onChange={handleFormField('videoUrl')}
                  className="input-dark"
                  placeholder="https://..."
                  disabled={!!epVideoFile}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Or Upload Video File</label>
                <input
                  type="file"
                  accept="video/*"
                  className="input-dark text-xs file:mr-2 file:rounded file:border-0 file:bg-[#D4A017] file:px-2 file:py-0.5 file:text-xs file:text-white"
                  onChange={(e) => {
                    setEpVideoFile(e.target.files[0])
                    if (e.target.files[0]) setEpForm((prev) => ({ ...prev, videoUrl: '' }))
                  }}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-400">Thumbnail File</label>
              <input
                type="file"
                accept="image/*"
                className="input-dark text-xs file:mr-2 file:rounded file:border-0 file:bg-[#D4A017] file:px-2 file:py-0.5 file:text-xs file:text-white"
                onChange={(e) => setEpThumbFile(e.target.files[0])}
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="formEpPremium" checked={epForm.premium} onChange={handleFormField('premium')} className="h-4 w-4 accent-[#F5C518]" />
              <label htmlFor="formEpPremium" className="text-sm text-gray-300">
                Premium episode
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="btn-shine flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4A017] py-2 text-sm font-bold text-white transition-all hover:bg-[#b8860b] disabled:opacity-50 sm:flex-1"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? 'Saving...' : editEp ? 'Update Episode' : 'Create Episode'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="glass rounded-lg px-4 py-2 text-sm text-white hover:bg-white/10">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <div className="grid min-w-[820px] grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 border-b border-[#1E1E2E] px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              <span className="w-16">Thumb</span>
              <span>Title</span>
              <span>Series · Season</span>
              <span>Access</span>
              <span>Actions</span>
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {search || selectedShow !== 'all' ? 'No matching episodes.' : 'No episodes yet. Click "Add Episode" to get started.'}
              </div>
            ) : (
              filtered.map((ep) => (
                <div
                  key={ep.id}
                  className="grid min-w-[820px] grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-4 border-b border-[#1E1E2E]/50 px-4 py-3 transition-colors last:border-0 hover:bg-white/3"
                >
                  <div className="group relative h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-[#0A0A0F]">
                    <img
                      src={ep.thumb || ep.thumbnail}
                      alt={ep.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    {ep.thumb && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Play size={12} className="fill-white text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      S{ep.season} E{ep.episodeNumber}: {ep.title}
                    </p>
                    <p className="truncate text-xs text-gray-500">{ep.desc || ep.description || ''}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs text-gray-400">{getShowTitle(ep.showId)}</p>
                    <p className="text-xs text-gray-500">{ep.duration || '-'}</p>
                  </div>

                  <div>
                    {ep.premium ? (
                      <span className="flex w-fit items-center gap-1 rounded-full bg-[#F5C518]/10 px-2 py-0.5 text-[10px] font-medium text-[#F5C518]">
                        <Lock size={8} /> Premium
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-[10px] font-medium text-green-400">Free</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {confirmDelete === ep.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(ep.id)}
                          disabled={deleting === ep.id}
                          className="rounded bg-red-500/20 p-1 text-[10px] text-red-400 hover:bg-red-500/30"
                        >
                          {deleting === ep.id ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="rounded bg-gray-500/20 p-1 text-[10px] text-gray-400 hover:bg-gray-500/30">
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditForm(ep)}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-400/10 hover:text-blue-400"
                          title="Edit"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(ep.id)}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-400/10 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
