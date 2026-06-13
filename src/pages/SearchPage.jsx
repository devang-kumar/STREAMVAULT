import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getShows } from '../api/client'
import MovieCard from '../components/MovieCard'

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
    return shows.filter((s) => {
      const titleHit = String(s.title || '').toLowerCase().includes(q)
      const genreHit = (s.genre || []).join(' ').toLowerCase().includes(q)
      return !q || titleHit || genreHit
    })
  }, [shows, q])

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-4 pb-12 pt-24 sm:px-6 lg:px-10">
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <h1 className="mb-3 font-display text-xl tracking-wide text-white sm:text-2xl">
        {q ? `Search Results for "${rawQ}"` : 'Browse Titles'}
      </h1>

      <form onSubmit={handleSearchSubmit} className="mb-6 max-w-xl">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search titles or genres..."
          className="input-dark"
        />
      </form>

      {isLoading ? (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-[38vw] min-w-[140px] max-w-[190px] sm:w-44 md:w-48 lg:w-52 animate-pulse rounded-xl bg-white/5"
              style={{ aspectRatio: '2/3' }}
            />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-[#1E1E2E] bg-[#12121A] py-20 text-center">
          <p className="text-sm text-gray-400">No titles found for "{rawQ}".</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {results.map((show) => (
            <div key={show.id || show._id} className="transition-transform hover:-translate-y-1">
              <MovieCard show={show} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
