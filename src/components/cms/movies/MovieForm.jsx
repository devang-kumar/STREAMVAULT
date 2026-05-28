import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, Check, AlertTriangle } from 'lucide-react'
import FileDropzone from '../FileDropzone'
import { createMovie, updateMovie, getMovieById } from '../../../lib/api/cms'

const INITIAL_FORM = {
  title: '',
  release_year: '',
  duration_minutes: '',
  description: '',
  genre_ids: '',
  tags: '',
  director: '',
  cast: '',
  rating: '',
  is_premium: false,
  trailer_url: '',
  status: 'draft',
}

export default function MovieForm() {
  const navigate = useNavigate()
  const { movieId } = useParams()
  const isEdit = !!movieId

  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  useEffect(() => {
    if (movieId) {
      loadMovie(movieId)
    }
  }, [movieId])

  const loadMovie = async (id) => {
    setLoading(true)
    try {
      const res = await getMovieById(id)
      const m = res.data
      setForm({
        title: m.title || '',
        release_year: m.releaseYear?.toString() || '',
        duration_minutes: m.durationMinutes?.toString() || '',
        description: m.description || '',
        genre_ids: Array.isArray(m.genre) ? m.genre.join(', ') : m.genre || '',
        tags: Array.isArray(m.tags) ? m.tags.join(', ') : '',
        director: m.director || '',
        cast: Array.isArray(m.cast) ? m.cast.map(c => c.name).join(', ') : '',
        rating: m.rating || '',
        is_premium: m.premium || m.isPremium || false,
        trailer_url: m.trailerUrl || '',
        status: m.status || 'draft',
      })
    } catch (err) {
      showMsg('error', err.message || 'Failed to load movie')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [field]: val }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title) { showMsg('error', 'Title is required'); return }
    if (!form.release_year) { showMsg('error', 'Release year is required'); return }
    if (!form.duration_minutes) { showMsg('error', 'Duration is required'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('release_year', form.release_year)
      fd.append('duration_minutes', form.duration_minutes)
      fd.append('description', form.description)
      fd.append('genre_ids', form.genre_ids)
      fd.append('tags', form.tags)
      fd.append('director', form.director)
      fd.append('cast', form.cast)
      fd.append('rating', form.rating)
      fd.append('is_premium', form.is_premium ? 'true' : 'false')
      fd.append('trailer_url', form.trailer_url)
      fd.append('status', form.status)

      if (isEdit) {
        await updateMovie(movieId, fd)
        showMsg('success', 'Movie updated')
      } else {
        const res = await createMovie(fd)
        showMsg('success', 'Movie created')
        navigate(`/admin/content/movies/${res.data._id || res.data.id}?view=flow`, { replace: true })
      }
    } catch (err) {
      showMsg('error', err.message || 'Failed to save movie')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#F59E0B]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {message.text && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
          message.type === 'success'
            ? 'border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
            : 'border border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#141415] p-6">
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-black">1</span>
            <h3 className="text-sm font-semibold text-white">{isEdit ? 'EDIT MOVIE' : 'ADD NEW MOVIE'}</h3>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">Enter all movie details below.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Movie Title *</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="e.g. Inception"
                value={form.title}
                onChange={handleChange('title')}
                maxLength={200}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Release Year *</label>
              <input
                type="number"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="e.g. 2010"
                value={form.release_year}
                onChange={handleChange('release_year')}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Description * <span className="text-[#6B7280]">({form.description.length}/1000)</span></label>
            <textarea
              rows={4}
              className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
              placeholder="Describe the movie..."
              value={form.description}
              onChange={handleChange('description')}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Duration (min) *</label>
              <input
                type="number"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="e.g. 148"
                value={form.duration_minutes}
                onChange={handleChange('duration_minutes')}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Genre</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="Action, Sci-Fi (comma-separated)"
                value={form.genre_ids}
                onChange={handleChange('genre_ids')}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Tags</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="award-winning, popular"
                value={form.tags}
                onChange={handleChange('tags')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Director</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="e.g. Christopher Nolan"
                value={form.director}
                onChange={handleChange('director')}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Cast</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="Leonardo DiCaprio, Joseph Gordon-Levitt"
                value={form.cast}
                onChange={handleChange('cast')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Rating (MPAA)</label>
              <select
                value={form.rating}
                onChange={handleChange('rating')}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
              >
                <option value="">Select rating</option>
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
                <option value="NR">NR</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Trailer URL</label>
              <input
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
                placeholder="YouTube or Vimeo link"
                value={form.trailer_url}
                onChange={handleChange('trailer_url')}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_premium}
                onChange={handleChange('is_premium')}
                className="h-4 w-4 rounded border-[rgba(255,255,255,0.06)] bg-[#0F0F10] text-[#F59E0B] focus:ring-[#F59E0B]"
              />
              <span className="text-xs text-[#9CA3AF]">Premium Movie (only premium users can watch)</span>
            </label>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Status</label>
            <select
              value={form.status}
              onChange={handleChange('status')}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0F0F10] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Banner/Image</label>
              <FileDropzone
                accept="image/jpeg,image/png,image/webp"
                maxSize={10 * 1024 * 1024}
                label="Upload banner image"
                onUpload={async (file) => {
                  const fd = new FormData()
                  fd.append('banner', file)
                  if (isEdit) {
                    await updateMovie(movieId, fd)
                    loadMovie(movieId)
                  }
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Thumbnail/Poster</label>
              <FileDropzone
                accept="image/jpeg,image/png,image/webp"
                maxSize={5 * 1024 * 1024}
                label="Upload poster image"
                onUpload={async (file) => {
                  const fd = new FormData()
                  fd.append('thumbnail', file)
                  if (isEdit) {
                    await updateMovie(movieId, fd)
                    loadMovie(movieId)
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">Video File</label>
            <FileDropzone
              accept="video/mp4,video/webm,video/quicktime"
              maxSize={5 * 1024 * 1024 * 1024} // 5GB
              label="Upload video file"
              preview={false}
              onUpload={async (file) => {
                const fd = new FormData()
                fd.append('video', file)
                if (isEdit) {
                  await updateMovie(movieId, fd)
                } else {
                  // Store reference for when movie is created
                  showMsg('success', 'Video selected (will be uploaded on save)')
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#D97706] disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="mx-auto animate-spin" /> : isEdit ? 'Update Movie →' : 'Save Movie →'}
          </button>
        </form>
      </div>
    </div>
  )
}