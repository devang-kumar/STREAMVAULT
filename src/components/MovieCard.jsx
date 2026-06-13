import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Star, Lock, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { useWatchlist } from '../hooks/useWatchlist'
import { useAuth } from '../hooks/useAuth'

const FALLBACK_POSTER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect fill="#18181B" width="200" height="300"/><text fill="#333" font-family="sans-serif" font-size="14" text-anchor="middle" x="100" y="150">No Poster</text></svg>',
  )

export default function MovieCard({ show }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isWatchlisted, toggleWatchlist } = useWatchlist()
  const [imgError, setImgError] = useState(false)
  
  const showId = show.id || show._id
  const saved = isWatchlisted(showId)

  const handleCardClick = () => {
    navigate(show.contentType === 'movie' ? `/movies/${showId}` : `/series/${showId}`)
  }

  const handleToggleWatchlist = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (!user) {
      navigate('/login?mode=signin')
      return
    }
    await toggleWatchlist(showId, show.contentType || 'series')
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="movie-card group relative flex flex-col w-[38vw] min-w-[140px] max-w-[190px] cursor-pointer overflow-hidden rounded-xl border border-[#2A2A2F] bg-[#18181B] text-left transition-transform sm:w-44 md:w-48 lg:w-52"
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={imgError ? FALLBACK_POSTER : show.poster || show.thumbnail || ''}
          alt={show.title}
          className="movie-card-thumbnail w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />

        <div className="absolute inset-0 hidden flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 md:flex md:group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
            <Play size={18} className="ml-0.5 fill-white text-white" />
          </div>
        </div>

        {/* Watchlist Toggle Button */}
        <button
          onClick={handleToggleWatchlist}
          className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 md:opacity-0 md:group-hover:opacity-100"
          aria-label={saved ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          {saved ? (
            <BookmarkCheck size={16} className="text-[#D4A017]" />
          ) : (
            <BookmarkPlus size={16} className="text-white hover:text-[#D4A017]" />
          )}
        </button>

        {show.premium && (
          <div className="badge-premium absolute left-2 top-2 flex items-center gap-1 shadow-md z-10">
            <Lock size={8} /> Premium
          </div>
        )}

        {show.tag && !show.premium && (
          <div className="absolute left-2 top-2 badge-gold-poster z-10 shadow-md">{show.tag}</div>
        )}
      </div>

      <div className="movie-card-info flex flex-col justify-between p-2.5 sm:p-3 flex-1">
        <h3 className="truncate text-sm font-semibold text-white">{show.title}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-[#B0B0B5]">
            {show.year || show.releaseYear || '-'} · {show.contentType === 'movie' ? `${show.durationMinutes || '-'}m` : `S${show.seasons || 1}`}
          </span>
          <div className="flex items-center gap-1 text-[#C49A4F]">
            <Star size={10} className="fill-[#C49A4F]" />
            <span className="text-xs text-[#B0B0B5]">{show.rating || 0}</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {(Array.isArray(show.genre) ? show.genre : []).slice(0, 2).map((g) => (
            <span key={g} className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-[#B0B0B5]">
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}