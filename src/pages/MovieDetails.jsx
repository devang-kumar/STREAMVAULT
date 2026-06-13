import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, Film, Lock, Play, Star, BookmarkCheck, BookmarkPlus } from 'lucide-react'
import { getMovie } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useWatchlist } from '../hooks/useWatchlist'

export default function MovieDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError('')
        const data = await getMovie(id)
        if (mounted) setMovie(data)
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load movie.')
          setMovie(null)
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] p-6 pt-24 md:p-16">
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <p className="text-gray-400">{error || 'Movie not found.'}</p>
      </div>
    )
  }

  const genreList = Array.isArray(movie.genre) ? movie.genre : []

  const { user } = useAuth()
  const { isWatchlisted, toggleWatchlist } = useWatchlist()

  const handleToggleWatchlist = async () => {
    if (!user) {
      navigate('/login?mode=signin')
      return
    }
    await toggleWatchlist(movie.id, 'movie')
  }

  const saved = isWatchlisted(movie?.id)

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src={movie.banner || movie.poster}
          alt={movie.title}
          className="h-full w-full object-cover"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div className="absolute inset-0 hero-gradient" />
        <button onClick={() => navigate('/')} className="absolute left-6 top-20 text-sm text-gray-400 hover:text-white md:left-10">
          ← Back
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 md:px-16">
          {movie.premium && <span className="badge-premium mb-3 inline-flex items-center gap-1"><Lock size={8} /> Premium Only</span>}
          <h1 className="mb-3 font-display text-5xl tracking-wide text-white md:text-7xl">{movie.title}</h1>
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Star size={14} className="fill-[#F5C518] text-[#F5C518]" /> {movie.rating || 'NR'}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {movie.releaseYear || movie.year || '-'}</span>
            <span className="flex items-center gap-1"><Film size={14} /> {movie.durationMinutes || '-'}m</span>
            {genreList.map((genre) => <span key={genre} className="rounded-full bg-white/10 px-3 py-0.5 text-xs">{genre}</span>)}
          </div>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-gray-300">{movie.description}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(`/watch/movie/${movie.id}`)}
              className="btn-shine flex items-center gap-2 rounded-xl bg-[#D4A017] px-7 py-3 font-bold text-white transition-all hover:scale-105 hover:bg-[#b8860b]"
            >
              <Play size={16} className="fill-white" /> Watch Movie
            </button>
            <button
              onClick={handleToggleWatchlist}
              className="flex items-center gap-2 px-7 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
              title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {saved ? (
                <>
                  <BookmarkCheck size={16} className="text-[#D4A017]" />
                  Saved
                </>
              ) : (
                <>
                  <BookmarkPlus size={16} />
                  Watchlist
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
