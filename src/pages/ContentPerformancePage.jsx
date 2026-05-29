import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, TrendingUp, Eye, Film, Tv, RefreshCw, Loader2,
  AlertCircle, ArrowUpRight, ArrowDownRight, Crown, Star,
  Search, Filter
} from 'lucide-react'
import { adminGetContentPerformance } from '../api/client'

// ── Metric Card ──
function MetricCard({ label, value, icon: Icon, color, prefix = '' }) {
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-xl font-bold text-white">{prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
    </div>
  )
}

// ── SVG Line Chart ──
function LineChart({ data, dataKey, label, color }) {
  const values = data.map(d => d[dataKey] || 0)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const w = 400, h = 120, pad = 10
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
    const y = pad + (1 - ((d[dataKey] || 0) - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`
  const gradId = `grad-cp-${label.replace(/\s/g, '-')}`

  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-4">{label}</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={p} x1={pad} y1={pad + p * (h - pad * 2)} x2={w - pad} y2={pad + p * (h - pad * 2)} stroke="#1E1E2E" strokeWidth="0.5" />
        ))}
        <polygon points={areaPoints} fill={`url(#${gradId})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
          const y = pad + (1 - ((d[dataKey] || 0) - min) / range) * (h - pad * 2)
          return <circle key={i} cx={x} cy={y} r="2" fill={color} />
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} className="text-[8px] text-gray-500">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

// ── Ranking Table ──
function RankingTable({ title, items, icon: Icon }) {
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#1E1E2E] flex items-center gap-2">
        <Icon size={14} className="text-[#D4A017]" />
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-gray-500">No data yet</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="grid grid-cols-[24px_1.5fr_80px_80px_80px] gap-2 px-5 py-2 text-[9px] text-gray-500 font-medium uppercase tracking-wider border-b border-[#1E1E2E]">
              <span>#</span><span>Title</span><span>Total</span><span>Weekly</span><span>Monthly</span>
            </div>
            {items.map((item, i) => (
              <div key={item.id || i} className="grid grid-cols-[24px_1.5fr_80px_80px_80px] gap-2 px-5 py-2.5 border-b border-[#1E1E2E]/50 last:border-0 items-center hover:bg-white/[0.02] text-xs">
                <span className={`text-[10px] font-bold ${i === 0 ? 'text-[#D4A017]' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>{i + 1}</span>
                <div className="flex items-center gap-2 min-w-0">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-6 h-8 object-cover rounded flex-shrink-0" onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div className="w-6 h-8 bg-white/5 rounded flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-white truncate font-medium">{item.title}</p>
                    {item.premium && <span className="text-[8px] text-yellow-400">Premium</span>}
                  </div>
                </div>
                <span className="text-white font-medium">{item.totalViews?.toLocaleString('en-IN') || 0}</span>
                <span className="text-gray-400">{item.weeklyViews?.toLocaleString('en-IN') || 0}</span>
                <span className="text-gray-400">{item.monthlyViews?.toLocaleString('en-IN') || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──
export default function ContentPerformancePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, series, movies
  const [sortBy, setSortBy] = useState('total') // total, weekly, monthly

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await adminGetContentPerformance()
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load content performance data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[#D4A017]" /></div>
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button onClick={fetchData} className="text-xs text-gray-400 hover:text-white">Try again</button>
      </div>
    )
  }

  const ov = data?.overview || {}
  const trend = data?.dailyTrend || []
  const top = data?.topPerforming || []
  const lowest = data?.lowestPerforming || []
  const topSeries = data?.mostViewedSeries || []
  const topMovies = data?.mostViewedMovies || []
  const genres = data?.genrePerformance || []

  // Filter ranking data
  const getRankingData = () => {
    let items = []
    if (filter === 'series') items = topSeries
    else if (filter === 'movies') items = topMovies
    else items = top

    if (sortBy === 'weekly') items = [...items].sort((a, b) => (b.weeklyViews || 0) - (a.weeklyViews || 0))
    else if (sortBy === 'monthly') items = [...items].sort((a, b) => (b.monthlyViews || 0) - (a.monthlyViews || 0))
    else items = [...items].sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))

    return items.slice(0, 10)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-white">Content Performance</h1>
          <p className="text-xs text-gray-500 mt-1">Views, rankings, and performance metrics — all from real data</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-[#111118] border border-[#1E1E2E] rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#D4A017]/50 transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Content" value={ov.totalContent || 0} icon={Film} color="#6b7280" />
        <MetricCard label="Total Views" value={ov.totalViews || 0} icon={Eye} color="#D4A017" />
        <MetricCard label="Weekly Views" value={ov.totalWeeklyViews || 0} icon={TrendingUp} color="#22c55e" />
        <MetricCard label="Monthly Views" value={ov.totalMonthlyViews || 0} icon={BarChart3} color="#3b82f6" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard label="Series Views" value={ov.totalSeriesViews || 0} icon={Tv} color="#8b5cf6" />
        <MetricCard label="Movie Views" value={ov.totalMovieViews || 0} icon={Film} color="#f97316" />
      </div>

      {/* Views Trend Chart */}
      <div className="mb-6">
        <LineChart data={trend} dataKey="views" label="Daily Views (30 days)" color="#D4A017" />
      </div>

      {/* Filters + Ranking */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[#111118] border border-[#1E1E2E] rounded-lg p-0.5">
          {['all', 'series', 'movies'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-colors capitalize ${
                filter === f ? 'bg-[#D4A017] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[#111118] border border-[#1E1E2E] rounded-lg p-0.5">
          {[
            { key: 'total', label: 'Total' },
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' }
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                sortBy === s.key ? 'bg-[#D4A017] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Ranking Table */}
      <div className="mb-6">
        <RankingTable
          title={`Top Performing Content${filter !== 'all' ? ` (${filter})` : ''}`}
          items={getRankingData()}
          icon={Star}
        />
      </div>

      {/* Lowest Performing + Genre Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RankingTable title="Lowest Performing" items={lowest} icon={ArrowDownRight} />

        {/* Genre Performance */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Genre Performance</h3>
          {genres.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No genre data</p>
          ) : (
            <div className="space-y-2.5">
              {genres.slice(0, 8).map((g, i) => {
                const maxViews = Math.max(...genres.map(x => x.totalViews), 1)
                const pct = Math.round((g.totalViews / maxViews) * 100)
                const colors = ['#D4A017', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6']
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{g.genre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600">{g.count} titles</span>
                        <span className="text-xs text-white font-medium">{g.totalViews.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#1E1E2E] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}