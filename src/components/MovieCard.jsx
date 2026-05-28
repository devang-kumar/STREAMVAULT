import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Star, Lock } from 'lucide-react'

const FALLBACK_POSTER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect fill="#111118" width="200" height="300"/><text fill="#333" font-family="sans-serif" font-size="14" text-anchor="middle" x="100" y="150">No Poster</text></svg>',
  )

export default function MovieCard({ show }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <button
      type="button"
      className="movie-card group relative w-[38vw] min-w-[140px] max-w-[190px] overflow-hidden rounded-xl border border-[#1E1E2E] bg-[#111118] text-left sm:w-44 md:w-48 lg:w-52"
      onClick={() => navigate(`/series/${show.id}`)}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={imgError ? FALLBACK_POSTER : show.poster || show.thumbnail || ''}
          alt={show.title}
          className="h-full w-full object-cover transition-transform duration-500 md:group-hover:scale-110"
          loading="lazy"
          onError={() => setImgError(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100" />

        <div className="absolute inset-0 hidden items-center justify-center opacity-0 transition-opacity duration-300 md:flex md:group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
            <Play size={18} className="ml-0.5 fill-white text-white" />
          </div>
        </div>

        {show.premium && (
          <div className="badge-premium absolute right-2 top-2 flex items-center gap-1">
            <Lock size={8} /> Premium
          </div>
        )}

        {show.tag && <div className="absolute left-2 top-2 rounded-md bg-[#D4A017] px-2 py-0.5 text-[10px] font-bold text-white">{show.tag}</div>}
      </div>

      <div className="p-2.5 sm:p-3">
        <h3 className="truncate text-sm font-semibold text-white">{show.title}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-gray-500">{show.year || '-'} · S{show.seasons || 1}</span>
          <div className="flex items-center gap-1 text-[#F5C518]">
            <Star size={10} className="fill-[#F5C518]" />
            <span className="text-xs text-gray-300">{show.rating || 0}</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {(Array.isArray(show.genre) ? show.genre : []).slice(0, 2).map((g) => (
            <span key={g} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-500">
              {g}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
