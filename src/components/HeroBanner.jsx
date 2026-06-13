import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { getShows } from '../api/client'

export default function HeroBanner() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getShows()
        if (!mounted) return
        const shows = Array.isArray(data) ? data : []
        const top = [...shows].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4)
        setFeatured(top)
      } catch {
        if (!mounted) return
        setFeatured([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (featured.length < 2) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [featured.length])

  const slideTo = (idx) => {
    if (animating || !featured.length) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx % featured.length)
      setAnimating(false)
    }, 300)
  }

  if (loading || !featured.length || !featured[current]) return null

  const show = featured[current]

  return (
    <section className="hero-fade-bottom relative h-[72vh] min-h-[420px] overflow-hidden sm:h-[78vh] md:min-h-[500px] lg:h-[84vh]">
      <div className={`absolute inset-0 transition-opacity duration-500 ${animating ? 'opacity-0' : 'opacity-100'}`}>
        <img
          src={show.banner || show.poster}
          alt={show.title}
          className="h-full w-full object-cover object-center"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80'
          }}
        />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div className={`absolute inset-0 z-20 flex items-end px-4 pb-14 pt-20 transition-all duration-500 sm:px-6 sm:pb-16 lg:items-center lg:px-16 ${animating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-3">
            {show.tag && <span className="badge-gold">{show.tag}</span>}
            <div className="flex items-center gap-1 text-[#C49A4F]">
              <Star size={12} className="fill-[#C49A4F]" />
              <span className="text-xs font-medium text-[#B0B0B5] sm:text-sm">{show.rating}</span>
            </div>
          </div>

          <h1 className="mb-3 font-display text-3xl leading-none tracking-wide text-white sm:text-5xl lg:mb-4 lg:text-7xl">{show.title}</h1>

          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#B0B0B5] sm:mb-4 sm:gap-3 sm:text-sm">
            <span>{show.year}</span>
            <span className="h-1 w-1 rounded-full bg-[#B0B0B5]" />
            <span>
              {show.seasons} Season{show.seasons > 1 ? 's' : ''}
            </span>
            {!!(Array.isArray(show.genre) ? show.genre : []).length && (
              <>
                <span className="h-1 w-1 rounded-full bg-[#B0B0B5]" />
                <span className="truncate">{(Array.isArray(show.genre) ? show.genre : []).join(', ')}</span>
              </>
            )}
          </div>

          <p className="mb-6 max-w-lg line-clamp-3 text-sm leading-relaxed text-[#B0B0B5] sm:text-base">{show.description}</p>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
<button
  onClick={() => navigate(`/series/${show.id}`)}
  className="btn-premium inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-bold text-black transition-all sm:px-8 sm:py-4 sm:text-base"
>
  <Play size={17} className="fill-black" />
  Play Now
</button>
            <button
              onClick={() => navigate(`/series/${show.id}`)}
              className="glass inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 sm:px-6 sm:py-3"
            >
              <Info size={17} />
              More Info
            </button>
          </div>
        </div>
      </div>

      {featured.length > 1 && (
        <>
          <div className="absolute bottom-6 left-4 z-20 flex items-center gap-2 sm:left-6 lg:bottom-8 lg:left-16">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => slideTo(i)}
                className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-[#C49A4F]' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="absolute bottom-4 right-3 z-20 hidden items-center gap-1 sm:flex lg:bottom-5 lg:right-4">
            <button onClick={() => slideTo((current - 1 + featured.length) % featured.length)} className="rounded-lg p-2 text-white/60 transition-colors hover:text-white" aria-label="Previous slide">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => slideTo((current + 1) % featured.length)} className="rounded-lg p-2 text-white/60 transition-colors hover:text-white" aria-label="Next slide">
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
    </section>
  )
}