import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Star, Calendar, Tv, Lock, ChevronRight } from 'lucide-react'
import { getShow, getEpisodes } from '../api/client'

export default function SeriesDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [show, setShow] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // ✅ Added selected season state
  const [selectedSeason, setSelectedSeason] = useState(1)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        setIsLoading(true)
        setError('')

        const [showData, epsData] = await Promise.all([
          getShow(id),
          getEpisodes(id)
        ])

        if (!mounted) return

        setShow(showData)
        setEpisodes(Array.isArray(epsData) ? epsData : [])
      } catch (err) {
        if (!mounted) return

        setError(err.message || 'Failed to load series.')
        setShow(null)
        setEpisodes([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-16 space-y-4 pt-24">
        <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
        <div className="h-24 bg-white/5 rounded animate-pulse" />
      </div>
    )
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Show not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {error && (
        <div className="mx-6 mt-20 md:mx-10 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="relative h-[60vh] overflow-hidden">
        <img
          src={show.banner || show.poster}
          alt={show.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80'
          }}
        />

        <div className="absolute inset-0 hero-gradient" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-6 md:left-10 text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-10 fade-up">
          {show.premium && (
            <span className="badge-premium mb-3 inline-flex items-center gap-1">
              <Lock size={8} /> Premium Only
            </span>
          )}

          <h1 className="font-display text-5xl md:text-7xl text-white tracking-wide mb-3">
            {show.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <Star
                size={14}
                className="text-[#F5C518] fill-[#F5C518]"
              />
              <span className="text-white font-medium">
                {show.rating}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{show.year}</span>
            </div>

            <div className="flex items-center gap-1">
              <Tv size={14} />
              <span>
                {show.seasons} Season
                {show.seasons > 1 ? 's' : ''}
              </span>
            </div>

            {(show.genre || []).map((g) => (
              <span
                key={g}
                className="bg-white/10 px-3 py-0.5 rounded-full text-xs"
              >
                {g}
              </span>
            ))}
          </div>

          <p className="text-gray-300 max-w-2xl text-sm leading-relaxed mb-6">
            {show.description}
          </p>

          <button
            onClick={() =>
              navigate(`/watch/${show.id}/${episodes[0]?.id || 1}`)
            }
            className="btn-shine flex items-center gap-2 bg-[#D4A017] hover:bg-[#b8860b] text-white font-bold px-7 py-3 rounded-xl transition-all hover:scale-105"
          >
            <Play size={16} className="fill-white" />
            Watch Now
          </button>
        </div>
      </div>

      <div className="px-6 md:px-16 py-12">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold font-display tracking-wide">
            Episodes
          </h2>

          {/* ✅ Functional season selector */}
          <select
            value={selectedSeason}
            onChange={(e) =>
              setSelectedSeason(Number(e.target.value))
            }
            className="input-dark w-auto text-xs px-3 py-1.5 bg-[#111118]"
          >
            {Array.from(
              { length: show.seasons || 1 },
              (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Season {i + 1}
                </option>
              )
            )}
          </select>
        </div>

        <div className="space-y-3">
          {/* ✅ Filter episodes by selected season */}
          {episodes
            .filter(
              (ep) => (ep.season || 1) === selectedSeason
            )
            .map((ep, index) => (
              <div
                key={ep.id}
                onClick={() =>
                  !ep.premium &&
                  navigate(`/watch/${show.id}/${ep.id}`)
                }
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                  ep.premium
                    ? 'episode-locked cursor-not-allowed opacity-70'
                    : 'border-[#1E1E2E] bg-[#111118] hover:border-[#D4A017]/30 hover:bg-white/5 cursor-pointer'
                }`}
              >
                <span className="text-2xl font-display text-gray-600 w-8 text-center flex-shrink-0">
                  {ep.episodeNumber || index + 1}
                </span>

                  <div className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#0A0A0F]">
                    <img
                      src={ep.thumb || ep.thumbnail || show.poster}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />

                  {ep.premium ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Lock
                        size={16}
                        className="text-[#F5C518]"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play
                        size={16}
                        className="text-white fill-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-white">
                      {ep.title}
                    </h3>

                    {ep.premium && (
                      <span className="badge-premium">
                        Premium
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {ep.desc}
                  </p>
                </div>

                <span className="text-xs text-gray-500 flex-shrink-0">
                  {ep.duration}
                </span>

                {!ep.premium && (
                  <ChevronRight
                    size={14}
                    className="text-gray-600 group-hover:text-white transition-colors flex-shrink-0"
                  />
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}