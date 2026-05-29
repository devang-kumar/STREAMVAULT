import { useState } from 'react'
import { Edit, Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react'
import { adminDeleteSeries, adminTogglePublish } from '../../api/client'

export default function SectionSeries({ shows, onAdd, onEdit, onRefresh }) {
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const filtered = (Array.isArray(shows) ? shows : []).filter((s) => s.title?.toLowerCase().includes(search.toLowerCase()))

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    setConfirmDelete(null)
    try {
      await adminDeleteSeries(id)
      showMessage('success', 'Series deleted successfully')
      if (onRefresh) onRefresh()
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete series')
    } finally {
      setDeleting(null)
    }
  }

  const handleTogglePublish = async (id) => {
    try {
      await adminTogglePublish(id)
      if (onRefresh) onRefresh()
    } catch (err) {
      showMessage('error', err.message || 'Failed to toggle publish status')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl text-white">Series Library</h2>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark w-full text-xs sm:w-48"
            placeholder="Search series..."
          />
          <button onClick={onAdd} className="btn-shine flex items-center justify-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2 text-sm text-white transition-colors hover:bg-[#b8860b]">
            <Plus size={14} /> Add Series
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
          {message.type === 'success' ? null : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      <div className="glass overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <div className="grid min-w-[860px] grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-[#1E1E2E] px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            <span>Title</span>
            <span>Genre</span>
            <span>Year</span>
            <span>Status</span>
            <span>Published</span>
            <span>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              {search ? 'No series match your search.' : 'No series yet. Click "Add Series" to get started.'}
            </div>
          ) : (
            filtered.map((show) => (
              <div
                key={show.id}
                className="grid min-w-[860px] grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-[#1E1E2E]/50 px-4 py-3 transition-colors last:border-0 hover:bg-white/3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={show.poster || show.thumbnail}
                    alt={show.title}
                    className="h-10 w-8 flex-shrink-0 rounded object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{show.title}</p>
                    <p className="text-xs text-gray-500">
                      {show.seasons || 1} season{(show.seasons || 1) > 1 ? 's' : ''} · {show.rating || 0} ★
                    </p>
                  </div>
                </div>

                <span className="text-xs text-gray-400">{Array.isArray(show.genre) ? show.genre[0] || '-' : show.genre || '-'}</span>
                <span className="text-xs text-gray-400">{show.year || '-'}</span>

                <div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${show.premium ? 'bg-[#F5C518]/10 text-[#F5C518]' : 'bg-green-400/10 text-green-400'}`}>
                    {show.premium ? 'Premium' : 'Free'}
                  </span>
                </div>

                <div>
                  <button
                    onClick={() => handleTogglePublish(show.id)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      show.isPublished !== false
                        ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
                        : 'bg-gray-400/10 text-gray-400 hover:bg-gray-400/20'
                    }`}
                  >
                    {show.isPublished !== false ? 'Published' : 'Draft'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {confirmDelete === show.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(show.id)}
                        disabled={deleting === show.id}
                        className="rounded bg-red-500/20 p-1 text-[10px] text-red-400 transition-colors hover:bg-red-500/30"
                      >
                        {deleting === show.id ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded bg-gray-500/20 p-1 text-[10px] text-gray-400 transition-colors hover:bg-gray-500/30"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onEdit(show)}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-400/10 hover:text-blue-400"
                        title="Edit"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(show.id)}
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
    </div>
  )
}
