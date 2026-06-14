import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Star, Calendar, Tv, Lock, ChevronRight, Film, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { getShow, getEpisodes } from '../api/client'
import { getSeriesById } from '../lib/api/cms'
import { useAuth } from '../hooks/useAuth'
import { useWatchlist } from '../hooks/useWatchlist'

export default function SeriesDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [show, setShow] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [seasons, setSeasons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [showTrailer, setShowTrailer] = useState(false)

  const loadCMSData = useCallback(async () => {
    try {
      const res = await getSeriesById(id)
      const data = res.data || {}
      return data
    } catch {
      return null
    }
  }, [id])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        setIsLoading(true)
        setError('')

        const [showData, epsData, cmsData] = await Promise.all([
          getShow(id),
          getEpisodes(id),
          loadCMSData()
        ])

        if (!mounted) return

        // Merge CMS data into show data for richer display
        const merged = { ...showData }
        if (cmsData) {
          merged.banner = cmsData.banner || showData.banner
          merged.thumbnail = cmsData.thumbnail || showData.poster
          merged.logoUrl = cmsData.logoUrl || ''
          merged.trailerUrl = cmsData.trailerUrl || ''
          // FIX: cmsData.seasons is an array of objects — store count as number, keep array separate
          merged.cmsSeasons = Array.isArray(cmsData.seasons) ? cmsData.seasons : []
          merged.seasons = Array.isArray(cmsData.seasons)
            ? cmsData.seasons.length
            : (typeof cmsData.seasons === 'number' ? cmsData.seasons : showData.seasons)
        }

        setShow(merged)
        setEpisodes(Array.isArray(epsData) ? epsData : [])
        if (cmsData?.seasons?.length) {
          setSeasons(cmsData.seasons)
        }
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
  }, [id, loadCMSData])

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

  // Defensive: ensure seasonCount is always a number
  const seasonCount = typeof show.seasons === 'number'
    ? show.seasons
    : (Array.isArray(show.seasons) ? show.seasons.length : (Number(show.seasons) || 1))

  // Defensive: ensure genre is always an array of strings
  const genreList = Array.isArray(show.genre)
    ? show.genre.filter(g => typeof g === 'string')
    : (typeof show.genre === 'string' ? [show.genre] : [])

  const { user } = useAuth()
  const { isWatchlisted, toggleWatchlist } = useWatchlist()

  const handleToggleWatchlist = async () => {
    if (!user) {
      navigate('/login?mode=signin')
      return
    }
    await toggleWatchlist(show.id, 'series')
  }

  const saved = isWatchlisted(show?.id)

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
          onClick={() => navigate('/')}
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

          <div className="flex flex-wrap items-center gap-4 text-base text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <Star
                size={16}
                className="text-[#F5C518] fill-[#F5C518]"
              />
              <span className="text-white font-medium">
                {show.rating}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{show.year}</span>
            </div>

            <div className="flex items-center gap-1">
              <Tv size={16} />
              <span>
                {seasonCount} Season
                {seasonCount > 1 ? 's' : ''}
              </span>
            </div>

            {genreList.map((g) => (
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

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() =>
                navigate(`/watch/${show.id}/${episodes[0]?.id || 1}`)
              }
              className="btn-auth-submit flex items-center gap-2 px-7 py-3 rounded-xl"
            >
              <Play size={16} className="fill-black" />
              Watch Now
            </button>

            {show.trailerUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 px-7 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
              >
                <Film size={16} />
                Watch Trailer
              </button>
            )}

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

      <div className="px-6 md:px-16 py-12">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold font-display tracking-wide text-white">
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
              { length: seasonCount || 1 },
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
              (ep) => (ep.season || ep.seasonNumber || 1) === selectedSeason
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
                  {ep.episodeNumber || ep.number || index + 1}
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
                    {ep.desc || ep.description || ''}
                  </p>
                </div>

                <span className="text-xs text-gray-500 flex-shrink-0">
                  {ep.duration || ep.durationMinutes || ''}
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

      {showTrailer && show.trailerUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="relative w-full max-w-4xl mx-4 aspect-video rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cloudinary / direct video URL */}
            {(show.trailerUrl.includes('cloudinary.com') || show.trailerUrl.includes('.mp4') || show.trailerUrl.includes('.webm')) ? (
              <video
                src={show.trailerUrl}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
              />
            ) : (
              /* YouTube / Vimeo embed */
              <iframe
                src={show.trailerUrl.replace('watch?v=', 'embed/') + (show.trailerUrl.includes('?') ? '&autoplay=1' : '?autoplay=1')}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            )}
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
