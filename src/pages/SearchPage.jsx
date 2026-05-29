import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getShows } from '../api/client'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const rawQ = (params.get('q') || '').trim()
  const q = rawQ.toLowerCase()
  const [searchInput, setSearchInput] = useState(rawQ)

  const [shows, setShows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    setSearchInput(rawQ)
  }, [q])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const next = searchInput.trim()
    setParams(next ? { q: next } : {})
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError('')
        const data = await getShows()
        if (!mounted) return
        setShows(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Search API unavailable.')
        setShows([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const results = useMemo(() => {
    const base = shows.filter((s) => {
      const titleHit = String(s.title || '').toLowerCase().includes(q)
      const genreHit = (s.genre || []).join(' ').toLowerCase().includes(q)
      return !q || titleHit || genreHit
    })

    return base
  }, [shows, q])

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-4 pb-12 pt-24 sm:px-6 lg:px-10">
      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>}

      <h1 className="mb-3 font-display text-xl tracking-wide text-white sm:text-2xl">{q ? `Search Results for "${rawQ}"` : 'Browse Titles'}</h1>

      <form onSubmit={handleSearchSubmit} className="mb-4 max-w-xl">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search titles or genres..."
          className="input-dark"
        />
      </form>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-white/5 sm:h-56" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-gray-400">No titles found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {results.map((show) => (
            <Link key={show.id} to={`/series/${show.id}`} className="group">
              <div className="overflow-hidden rounded-xl border border-[#1E1E2E] bg-[#111118] transition-colors hover:border-[#D4A017]/40">
                <img src={show.poster} alt={show.title} className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-56" />
              </div>
              <p className="mt-2 truncate text-sm text-white">{show.title}</p>
              <p className="truncate text-xs text-gray-500">{(show.genre || []).join(', ')}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
