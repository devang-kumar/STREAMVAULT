import { useEffect, useMemo, useState } from 'react'
import HeroBanner from '../components/HeroBanner'
import ContentRow from '../components/ContentRow'
import Footer from '../components/Footer'
import { getShows, getMovies } from '../api/client'

export default function Home() {
  const [shows, setShows] = useState([])
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError('')
        const [showsData, moviesData] = await Promise.all([
          getShows(),
          getMovies().catch(() => [])
        ])
        if (!mounted) return
        setShows(Array.isArray(showsData) ? showsData : [])
        setMovies(Array.isArray(moviesData) ? moviesData : [])
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Failed to load shows from server.')
        setShows([])
        setMovies([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const rows = useMemo(() => {
    if (!shows.length && !movies.length) return []

    const tagRows = [
      { title: 'Top Picks', tag: 'Top Pick' },
      { title: 'Recommended For You', tag: 'Recommended' },
      { title: 'New Releases', tag: 'New' },
      { title: 'Upcoming', tag: 'Upcoming' },
    ].map((r) => ({ title: r.title, shows: shows.filter((s) => s.tag === r.tag) }))

    const seriesRows = tagRows.map((r) => ({ ...r, shows: r.shows.length ? r.shows : shows.slice(0, 8) }))
    return movies.length ? [{ title: 'Movies', shows: movies }, ...seriesRows] : seriesRows
  }, [shows, movies])

  return (
    <div className="min-h-screen bg-[#0F0E0F]">
      {error && <div className="mx-4 mt-20 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 sm:mx-6 lg:mx-10">{error}</div>}

      {isLoading ? (
        <div className="space-y-6 px-4 pt-24 sm:px-6 lg:px-10">
          <div className="h-56 animate-pulse rounded-2xl bg-white/5 sm:h-64" />
          <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
          <div className="h-40 animate-pulse rounded-xl bg-white/5" />
          <div className="h-8 w-56 animate-pulse rounded bg-white/5" />
          <div className="h-40 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : (
        <>
          <HeroBanner />

          <div className="pb-6 pt-2">
            {rows.length === 0 && !error ? (
              <div className="px-4 text-sm text-gray-500 sm:px-6 lg:px-10">No content available for this category yet.</div>
            ) : (
              rows.map((row) => <ContentRow key={row.title} title={row.title} shows={row.shows} />)
            )}
          </div>

          <Footer />
        </>
      )}
    </div>
  )
}
