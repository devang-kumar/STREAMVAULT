import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'

export default function ContentRow({ title, shows }) {
  const rowRef = useRef(null)

  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <div className="group/row mb-8 sm:mb-10">
      <div className="mb-3 flex items-end justify-between px-4 sm:mb-4 sm:px-6 lg:px-10">
        <h2 className="font-display text-lg tracking-wide text-white sm:text-xl">{title}</h2>
      </div>

      <div className="relative px-4 sm:px-6 lg:px-10">
        <button
          onClick={() => scroll(-1)}
          className="absolute left-2 top-1/2 z-10 hidden h-14 w-9 -translate-y-1/2 items-center justify-center rounded-r-lg bg-black/60 text-white/90 opacity-0 transition-all hover:bg-black/80 group-hover/row:opacity-100 md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Outer scroll wrapper — handles horizontal scrolling only. */}
        <div
          ref={rowRef}
          className="content-row-scroll rail-scroll no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Inner card row — overflow: visible so the scaled hover state of
              any card is never clipped. Padding: 12px 16px gives the first
              and last cards breathing room when they scale up. */}
          <div className="content-row-cards flex snap-x snap-mandatory gap-3 sm:gap-4">
            {shows.map((show) => (
              <div key={show.id} className="content-row-snap snap-start">
                <MovieCard show={show} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => scroll(1)}
          className="absolute right-2 top-1/2 z-10 hidden h-14 w-9 -translate-y-1/2 items-center justify-center rounded-l-lg bg-black/60 text-white/90 opacity-0 transition-all hover:bg-black/80 group-hover/row:opacity-100 md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
