import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2, Loader2, Check, AlertTriangle } from 'lucide-react'
import StatusBadge from '../StatusBadge'
import { getMovies, deleteMovie } from '../../../lib/api/cms'

export default function MovieListView() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [message, setMessage] = useState({ type: '', text: '' })

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, sort: 'createdAt', order: 'desc' }
      if (search) params.q = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (genreFilter) params.genre = genreFilter

      const res = await getMovies(params)
      setMovies(res.data || [])
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      showMsg('error', err.message || 'Failed to load movies')
      setMovies([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, genreFilter])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  const handleDelete = async (id) => {
    if (!confirm('Delete this movie?')) return
    try {
      await deleteMovie(id)
      showMsg('success', 'Movie deleted')
      fetchMovies()
    } catch (err) {
      showMsg('error', err.message || 'Failed to delete')
    }
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search movies..."
          className="w-64 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <input
          type="text"
          value={genreFilter}
          onChange={(e) => { setGenreFilter(e.target.value); setPage(1) }}
          placeholder="Filter by genre..."
          className="w-48 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] px-3 py-2 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#F59E0B]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#141415]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)] text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
              <th className="px-4 py-3">Poster</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Genre</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <Loader2 size={20} className="mx-auto animate-spin text-[#F59E0B]" />
                </td>
              </tr>
            ) : movies.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#6B7280]">
                  No movies found.
                </td>
              </tr>
            ) : (
              movies.map((m) => {
                const id = m._id || m.id
                return (
                  <tr key={id} className="border-b border-[rgba(255,255,255,0.03)] transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="px-4 py-3">
                      <img
                        src={m.thumbnail || m.poster}
                        alt=""
                        className="h-10 w-7 rounded object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{m.title}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">
                      {Array.isArray(m.genre) ? m.genre[0] || '-' : m.genre || '-'}
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{m.releaseYear || '-'}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{m.durationMinutes ? `${m.durationMinutes}m` : '-'}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{m.rating || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status || 'draft'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/content/movies/${id}?view=flow`)}
                          className="rounded p-1.5 text-[#9CA3AF] hover:text-white"
                          title="Edit"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(id)}
                          className="rounded p-1.5 text-[#9CA3AF] hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-[#6B7280]">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}