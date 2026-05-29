import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { searchContent } from '../../lib/api/cms'

export default function SearchDropdown({ placeholder = 'Search...', onSelect, type = 'all' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ series: [], seasons: [], episodes: [], movies: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  const performSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults({ series: [], seasons: [], episodes: [], movies: [] })
      return
    }
    setLoading(true)
    try {
      const data = await searchContent(q, type)
      setResults(data.data || { series: [], seasons: [], episodes: [], movies: [] })
      setIsOpen(true)
    } catch {
      setResults({ series: [], seasons: [], episodes: [], movies: [] })
    } finally {
      setLoading(false)
    }
  }, [type])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(val), 300)
  }

  const handleSelect = (item) => {
    setIsOpen(false)
    setQuery('')
    if (onSelect) onSelect(item)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const allResults = [
    ...results.series.map(r => ({ ...r, _type: 'Series' })),
    ...results.seasons.map(r => ({ ...r, _type: 'Season' })),
    ...results.episodes.map(r => ({ ...r, _type: 'Episode' })),
    ...results.movies.map(r => ({ ...r, _type: 'Movie' })),
  ]

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (allResults.length > 0) setIsOpen(true) }}
          placeholder={placeholder}
          className="w-[280px] rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] py-2 pl-9 pr-3 text-sm text-white placeholder-[#6B7280] outline-none transition-colors focus:border-[#F59E0B]"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#F59E0B]" />
        )}
      </div>

      {isOpen && allResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-50 mt-1 w-[400px] rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] shadow-xl"
        >
          <div className="max-h-[300px] overflow-y-auto py-1">
            {allResults.map((item, i) => (
              <button
                key={`${item.type}-${item.id}-${i}`}
                onClick={() => handleSelect(item)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors"
              >
                {item.thumbnail_url && (
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    className="h-8 w-6 flex-shrink-0 rounded object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{item.title}</p>
                  {item.breadcrumb && (
                    <p className="truncate text-[11px] text-[#9CA3AF]">{item.breadcrumb}</p>
                  )}
                  {item.series_title && !item.breadcrumb && (
                    <p className="truncate text-[11px] text-[#6B7280]">{item.series_title}</p>
                  )}
                </div>
                <span className="flex-shrink-0 rounded bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[10px] text-[#6B7280]">
                  {item.type || item._type || ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}