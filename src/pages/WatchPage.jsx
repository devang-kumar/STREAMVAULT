import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, ChevronLeft, Lock, Settings, Check, List, X
} from 'lucide-react'
import { getEpisode, getEpisodes, getShow, saveWatchSession, updateContinueWatching, trackActivity } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import PremiumGateModal from '../components/PremiumGateModal'

// ── Tiny helper ───────────────────────────────────────────────
const fmt = (s) => {
  if (!s || !isFinite(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

export default function WatchPage() {
  const { id, epId } = useParams()
  const navigate     = useNavigate()

  // ── refs ──
  const videoRef          = useRef(null)
  const containerRef      = useRef(null)
  const controlsTimer     = useRef(null)
  const progressTimer     = useRef(null)
  const progressBarRef    = useRef(null)
  const lastSaveRef       = useRef(0)

  // ── state ──
  const [show,         setShow]         = useState(null)
  const [episodes,     setEpisodes]     = useState([])
  const [currentEp,    setCurrentEp]    = useState(null)
  const [playing,      setPlaying]      = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [buffered,     setBuffered]     = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [muted,        setMuted]        = useState(false)
  const [volume,       setVolume]       = useState(1)
  const [fullscreen,   setFullscreen]   = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading,    setIsLoading]    = useState(true)
  const [videoReady,   setVideoReady]   = useState(false)
  const [error,        setError]        = useState('')
  const [locked,       setLocked]       = useState(false)
  const [showQuality,  setShowQuality]  = useState(false)
  const [quality,      setQuality]      = useState('Auto')
  const [showEpisodeList, setShowEpisodeList] = useState(true)

  // ── Auth & premium gate ──
  const { user } = useAuth()
  const userIsPremium = !!(user?.subscription?.status === 'Premium' ||
    user?.plan?.toLowerCase() === 'premium')
  const [premiumGate, setPremiumGate] = useState(null)

  // ── Load episode data ──
  useEffect(() => {
    let mounted = true
    setVideoReady(false)
    setPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)

    ;(async () => {
      try {
        setIsLoading(true)
        setError('')
        setLocked(false)

        // Load show and episodes in parallel
        const [showData, epsData] = await Promise.all([getShow(id), getEpisodes(id)])
        if (!mounted) return

        setShow(showData)
        const episodeList = Array.isArray(epsData) ? epsData : []
        setEpisodes(episodeList)

        // Load the specific episode
        try {
          const ep = await getEpisode(epId)
          if (!mounted) return
          setCurrentEp(ep)
        } catch (epErr) {
          if (!mounted) return
          if (epErr.status === 403 && epErr.data?.locked) {
            setLocked(true)
            // Find the episode in the list as fallback
            const fallbackEp = episodeList.find(e => String(e.id) === String(epId))
            if (fallbackEp) {
              setCurrentEp(fallbackEp)
            }
          } else {
            // If episode fetch fails, try to use any available episode
            setError(epErr.message || 'Failed to load episode')
            if (episodeList.length > 0) {
              setCurrentEp(episodeList.find(e => String(e.id) === String(epId)) || episodeList[0])
            }
          }
        }
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Failed to load content')
        setShow(null)
        setEpisodes([])
        setCurrentEp(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [id, epId])

  // ── Analytics: track watch start ──
  useEffect(() => {
    if (!currentEp || !id || locked) return
    trackActivity('watch_start', {
      seriesId: id,
      episodeId: epId,
      title: currentEp.title || currentEp.name,
    }).catch(() => {})
  }, [id, epId, currentEp, locked])

  // ── Save watch progress to continue watching (debounced) ──
  useEffect(() => {
    if (!currentEp || !id || !duration || locked) return
    const now = Date.now()
    if (now - lastSaveRef.current < 15000) return
    lastSaveRef.current = now
    const pct = Math.round(progress)
    // Save to continue watching
    updateContinueWatching({
      showId: id,
      episodeId: epId,
      progress: pct,
      duration: Math.floor(duration),
      lastPosition: Math.floor(currentTime)
    }).catch(() => {})
    // Also save analytics
    saveWatchSession({
      seriesId: id,
      episodeId: epId,
      durationWatched: Math.floor(currentTime),
      episodeDuration: Math.floor(duration),
      progress: pct,
      lastPosition: Math.floor(currentTime),
      completed: pct >= 90,
    }).catch(() => {})
  }, [progress, currentTime, duration, id, epId, currentEp, locked])

  // Save on unmount / navigation
  useEffect(() => {
    return () => {
      if (!id || !duration || !currentEp) return
      const pct = Math.round(progress)
      updateContinueWatching({
        showId: id,
        episodeId: epId,
        progress: pct,
        duration: Math.floor(duration),
        lastPosition: Math.floor(currentTime)
      }).catch(() => {})
      saveWatchSession({
        seriesId: id,
        episodeId: epId,
        durationWatched: Math.floor(currentTime),
        episodeDuration: Math.floor(duration),
        progress: pct,
        lastPosition: Math.floor(currentTime),
        completed: pct >= 90,
      }).catch(() => {})
    }
  }, [id, epId, currentTime, duration, progress, currentEp])

  // ── Video events ──
  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setCurrentTime(v.currentTime)
    setProgress((v.currentTime / v.duration) * 100)
    // Buffered
    if (v.buffered.length > 0) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100)
    }
  }, [])

  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
    setVideoReady(true)
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [])

  const onEnded = useCallback(() => {
    setPlaying(false)
    trackActivity('watch_complete', { seriesId: id, episodeId: epId }).catch(() => {})
    saveWatchSession({
      seriesId: id,
      episodeId: epId,
      durationWatched: Math.floor(duration),
      episodeDuration: Math.floor(duration),
      progress: 100,
      completed: true,
      lastPosition: Math.floor(duration),
    }).catch(() => {})
    const next = episodes.find(e =>
      Number(e.episodeNumber || e.id) === Number(currentEp?.episodeNumber || currentEp?.id) + 1
    )
    if (next) navigate(`/watch/${id}/${next.id}`)
  }, [episodes, currentEp, id, epId, navigate, duration])

  // ── Poll fallback ──
  useEffect(() => {
    if (playing) {
      progressTimer.current = setInterval(() => {
        const v = videoRef.current
        if (v?.duration) {
          setCurrentTime(v.currentTime)
          setProgress((v.currentTime / v.duration) * 100)
        }
      }, 250)
    }
    return () => clearInterval(progressTimer.current)
  }, [playing])

  // ── Controls ──
  const togglePlay = useCallback((e) => {
    e?.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}) }
    else          { v.pause(); setPlaying(false) }
  }, [])

  const handleSeek = useCallback((e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v?.duration) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const frac  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.currentTime = frac * v.duration
    setCurrentTime(v.currentTime)
    setProgress(frac * 100)
  }, [])

  const toggleMute = useCallback((e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const handleVolumeChange = useCallback((e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    const val = parseFloat(e.target.value)
    v.volume = val
    setVolume(val)
    v.muted = val === 0
    setMuted(val === 0)
  }, [])

  const toggleFullscreen = useCallback((e) => {
    e.stopPropagation()
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  // ── Auto-hide controls ──
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimer.current)
    if (playing) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [playing])

  useEffect(() => { resetControlsTimer() }, [playing, resetControlsTimer])
  useEffect(() => () => clearTimeout(controlsTimer.current), [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space')     { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowRight') {
        const v = videoRef.current
        if (v) { v.currentTime = Math.min(v.duration, v.currentTime + 10) }
      }
      if (e.code === 'ArrowLeft') {
        const v = videoRef.current
        if (v) { v.currentTime = Math.max(0, v.currentTime - 10) }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [togglePlay])

  // ── Derived ──
  const nextEp = episodes.find(e =>
    Number(e.episodeNumber || e.id) === Number(currentEp?.episodeNumber || currentEp?.id) + 1
  )

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 bg-black">
            <div className="aspect-video w-full bg-white/5 animate-pulse" />
          </div>
          <div className="w-72 bg-[#0A0A0F] border-l border-[#1E1E2E] p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!show || !currentEp) return null

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#050508] flex flex-col select-none">

      {/* ── Premium locked overlay was here, removed in favor of PremiumGateModal ── */}

      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 px-5 py-3 bg-gradient-to-b from-black/90 to-transparent z-20 flex-shrink-0">
        <button
          onClick={() => navigate(`/series/${id}`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Link
            to={`/series/${id}`}
            className="text-xs text-gray-500 hover:text-gray-300 font-display tracking-wider truncate transition-colors"
          >
            {show.title}
          </Link>
          <span className="text-gray-700 text-xs flex-shrink-0">›</span>
          <p className="text-sm font-semibold text-white truncate">{currentEp.title}</p>
        </div>

        {error && (
          <div className="ml-auto hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-lg px-3 py-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            Error
          </div>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Video column ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Player ── */}
          <div
            ref={containerRef}
            className={`relative bg-black flex-shrink-0 ${fullscreen ? 'flex-1' : ''}`}
            style={{ aspectRatio: fullscreen ? undefined : '16/9', maxHeight: fullscreen ? undefined : 'calc(100vh - 180px)' }}
            onMouseMove={resetControlsTimer}
            onMouseLeave={() => { if (playing) setShowControls(false) }}
            onClick={togglePlay}
          >
            {/* Video element — only load src when not locked */}
            <video
              ref={videoRef}
              autoPlay={!locked}
              playsInline
              preload={locked ? 'none' : 'metadata'}
              className="absolute inset-0 w-full h-full object-contain cursor-pointer"
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onWaiting={() => setVideoReady(false)}
              onCanPlay={() => setVideoReady(true)}
            >
              {!locked && <source src={currentEp.videoUrl} type="video/mp4" />}
            </video>

            {/* Buffering spinner */}
            {!videoReady && currentEp.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {/* Center play/pause flash */}
            <div
              className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300 ${
                !playing && videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                <Play size={30} className="text-white fill-white ml-1" />
              </div>
            </div>

            {/* Gradient overlays — top + bottom */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-[2]" />
            <div
              className={`absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-[2] transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* ── Controls overlay ── */}
            <div
              className={`absolute inset-x-0 bottom-0 z-[3] px-4 pb-3 transition-all duration-300 ${
                showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
            >
              {/* Progress bar */}
              <div className="mb-3 group/bar" onClick={e => e.stopPropagation()}>
                <div
                  ref={progressBarRef}
                  className="relative h-1 bg-white/20 rounded-full cursor-pointer group-hover/bar:h-2.5 transition-all duration-150"
                  onClick={handleSeek}
                >
                  {/* Buffered */}
                  <div
                    className="absolute inset-y-0 left-0 bg-white/25 rounded-full transition-all"
                    style={{ width: `${buffered}%` }}
                  />
                  {/* Played */}
                  <div
                    className="absolute inset-y-0 left-0 bg-[#D4A017] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity scale-0 group-hover/bar:scale-100 duration-150" />
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 mt-1 px-0.5">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Control buttons row */}
              <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    title={playing ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {playing
                      ? <Pause size={20} />
                      : <Play size={20} className="fill-white" />
                    }
                  </button>

                  {/* Skip next episode */}
                  {nextEp && (
                    <button
                      onClick={() => navigate(`/watch/${id}/${nextEp.id}`)}
                      className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                      title="Next Episode"
                    >
                      <SkipForward size={18} />
                    </button>
                  )}

                  {/* Volume */}
                  <div className="flex items-center gap-2 group/vol">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    >
                      {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={muted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="opacity-0 w-0 group-hover/vol:opacity-100 group-hover/vol:w-20 transition-all duration-200 cursor-pointer accent-[#D4A017]"
                    />
                  </div>

                  {/* Time display */}
                  <span className="text-xs text-gray-400 hidden sm:block font-mono">
                    {fmt(currentTime)} / {fmt(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quality picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowQuality(q => !q)}
                      className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                      title="Quality"
                    >
                      <Settings size={16} className={showQuality ? 'animate-spin-slow' : ''} />
                    </button>
                    {showQuality && (
                      <div className="absolute bottom-10 right-0 glass rounded-xl overflow-hidden w-32 shadow-2xl border border-white/10">
                        <div className="px-3 py-2 border-b border-white/10 text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Quality</div>
                        {['4K Ultra HD', '1080p HD', '720p', '480p', 'Auto'].map(q => (
                          <button
                            key={q}
                            onClick={() => { setQuality(q); setShowQuality(false) }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                              quality === q ? 'text-[#D4A017] bg-[#D4A017]/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {q}
                            {quality === q && <Check size={12} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    title="Fullscreen"
                  >
                    {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Episode info strip ── */}
          {!fullscreen && (
            <div className="px-5 py-3 bg-[#0A0A0F] border-t border-[#1E1E2E] flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">{currentEp.title}</h2>
                  {currentEp.desc && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{currentEp.desc}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {currentEp.duration && (
                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded">{currentEp.duration}</span>
                  )}
                  {nextEp && (
                    <button
                      onClick={() => navigate(`/watch/${id}/${nextEp.id}`)}
                      className="flex items-center gap-1.5 text-xs text-white bg-[#D4A017]/80 hover:bg-[#D4A017] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <SkipForward size={12} /> Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Episode sidebar toggle button (mobile/tablet) ── */}
        {!fullscreen && (
          <button
            onClick={() => setShowEpisodeList(v => !v)}
            className="fixed bottom-6 right-6 z-30 lg:hidden flex items-center justify-center w-12 h-12 rounded-full bg-[#D4A017] text-black shadow-lg hover:bg-[#b8860b] transition-colors"
            aria-label="Toggle episode list"
          >
            <List size={18} />
          </button>
        )}

        {/* ── Episode sidebar ── */}
        {!fullscreen && (
          <div className={`hidden lg:flex w-[280px] xl:w-72 bg-[#08080D] border-l border-[#1E1E2E] flex-col overflow-hidden flex-shrink-0 ${showEpisodeList ? '!flex' : ''}`}
            style={{ '@media (min-width: 1024px)': { display: 'flex' } }}
          >
            {/* Sidebar header */}
            <div className="px-4 py-3 border-b border-[#1E1E2E] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Episodes</h3>
                <p className="text-[10px] text-gray-600 mt-0.5">{episodes.length} episodes</p>
              </div>
              <button onClick={() => setShowEpisodeList(false)} className="lg:hidden text-gray-500 hover:text-white p-1">
                <X size={14} />
              </button>
            </div>

            {/* Episode list */}
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-thin">
              {episodes.map((ep) => {
                const isActive  = String(ep.id) === String(currentEp?.id)
                const isPremium = (show?.premium || ep.premium) && !isActive

                return (
                  <div
                    key={ep.id}
                    onClick={() => navigate(`/watch/${id}/${ep.id}`)}
                    className={`group flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#D4A017]/15 border border-[#D4A017]/25 shadow-sm'
                        : isPremium && !userIsPremium
                        ? 'border border-transparent'
                        : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-[72px] h-[42px] rounded-lg overflow-hidden flex-shrink-0 bg-[#111118]">
                      <img
                        src={ep.thumb || show.poster}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Overlay for active/premium/hover */}
                      {isActive ? (
                        <div className="absolute inset-0 bg-[#D4A017]/30 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-[#D4A017] flex items-center justify-center shadow">
                            <Play size={9} className="fill-white text-white ml-0.5" />
                          </div>
                        </div>
                      ) : isPremium ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock size={12} className="text-[#F5C518]" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                          <Play size={14} className="fill-white text-white opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Episode meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] flex-shrink-0 animate-pulse" />
                        )}
                        <p className={`text-xs font-semibold truncate leading-tight ${isActive ? 'text-[#D4A017]' : 'text-white'}`}>
                          {ep.title}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-600">{ep.duration || `Ep ${ep.episodeNumber || ep.id}`}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Premium Gate Modal ── */}
      {(premiumGate || locked) && (
        <PremiumGateModal
          type={premiumGate?.type || 'episode'}
          title={premiumGate?.title || currentEp?.title}
          onClose={() => setPremiumGate(null)}
        />
      )}
    </div>
  )
}