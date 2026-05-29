import { useState, useEffect, useCallback } from 'react'
import {
  Clock, TrendingUp, Eye, Film, Tv, RefreshCw, Loader2,
  AlertCircle, CheckCircle, BarChart3, Users, Play, Star
} from 'lucide-react'
import { adminGetEngagement } from '../api/client'

function MetricCard({ label, value, icon: Icon, color, suffix = '' }) {
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}</p>
    </div>
  )
}

function LineChart({ data, dataKey, label, color, labelKey = 'label' }) {
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
  const gradId = `grad-eng-${label.replace(/\s/g, '-')}`

  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-4">{label}</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
        <defs><linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0, 0.25, 0.5, 0.75, 1].map(p => (<line key={p} x1={pad} y1={pad + p * (h - pad * 2)} x2={w - pad} y2={pad + p * (h - pad * 2)} stroke="#1E1E2E" strokeWidth="0.5" />))}
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
          <span key={i} className="text-[8px] text-gray-500">{d[labelKey]}</span>
        ))}
      </div>
    </div>
  )
}

function EngagementTable({ title, items, icon: Icon, color = '#D4A017' }) {
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#1E1E2E] flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-gray-500">No data yet</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="grid grid-cols-[24px_1.5fr_80px_80px_80px_80px] gap-2 px-5 py-2 text-[9px] text-gray-500 font-medium uppercase tracking-wider border-b border-[#1E1E2E]">
              <span>#</span><span>Content</span><span>Avg Min</span><span>Sessions</span><span>Compl%</span><span>Viewers</span>
            </div>
            {items.map((item, i) => (
              <div key={item.seriesId || i} className="grid grid-cols-[24px_1.5fr_80px_80px_80px_80px] gap-2 px-5 py-2.5 border-b border-[#1E1E2E]/50 last:border-0 items-center hover:bg-white/[0.02] text-xs">
                <span className={`text-[10px] font-bold ${i === 0 ? 'text-[#D4A017]' : 'text-gray-500'}`}>{i + 1}</span>
                <span className="text-white truncate font-medium">{item.title}</span>
                <span className="text-white font-medium">{item.avgWatchMinutes?.toFixed(1)}m</span>
                <span className="text-gray-400">{item.sessions}</span>
                <span className="text-gray-400">{item.completionRate}%</span>
                <span className="text-gray-400">{item.uniqueViewers}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EngagementPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await adminGetEngagement()
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load engagement data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

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
  const trend = data?.watchTimeTrend || []
  const high = data?.highestEngagement || []
  const low = data?.lowestEngagement || []
  const comp = data?.completionSummary || {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-white">Watch Duration & Engagement</h1>
          <p className="text-xs text-gray-500 mt-1">Watch time, completion rates, and engagement metrics from real sessions</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-[#111118] border border-[#1E1E2E] rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#D4A017]/50 transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Watch Time" value={ov.totalWatchTimeHours || 0} icon={Clock} color="#D4A017" suffix=" hrs" />
        <MetricCard label="Avg Watch Duration" value={ov.avgWatchMinutes || 0} icon={TrendingUp} color="#22c55e" suffix=" min" />
        <MetricCard label="Total Sessions" value={ov.totalSessions || 0} icon={Play} color="#3b82f6" />
        <MetricCard label="Unique Viewers" value={ov.totalUniqueViewers || 0} icon={Users} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Overall Completion" value={ov.overallCompletionRate || 0} icon={CheckCircle} color="#22c55e" suffix="%" />
        <MetricCard label="Series Completion" value={ov.seriesCompletionRate || 0} icon={Eye} color="#f97316" suffix="%" />
        <MetricCard label="Weekly Sessions" value={ov.weeklySessions || 0} icon={BarChart3} color="#14b8a6" />
        <MetricCard label="Monthly Sessions" value={ov.monthlySessions || 0} icon={BarChart3} color="#ec4899" />
      </div>

      <div className="mb-6">
        <LineChart data={trend} dataKey="hours" label="Daily Watch Time (hours) — 30 days" color="#D4A017" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <EngagementTable title="Highest Engagement" items={high} icon={Star} color="#D4A017" />
        <EngagementTable title="Lowest Engagement" items={low} icon={TrendingUp} color="#f97316" />
      </div>

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Completion Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Episodes Completed', value: comp.totalEpisodesCompleted, color: '#22c55e' },
            { label: 'Total Sessions', value: comp.totalSessions, color: '#3b82f6' },
            { label: 'Series Completion', value: `${comp.seriesCompletionRate}%`, color: '#f97316' },
            { label: 'Overall Completion', value: `${comp.overallCompletionRate}%`, color: '#8b5cf6' },
          ].map(c => (
            <div key={c.label} className="text-center p-3 rounded-lg" style={{ background: `${c.color}10` }}>
              <p className="text-lg font-bold text-white">{c.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}