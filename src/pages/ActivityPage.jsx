import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Users, TrendingUp, Calendar, RefreshCw, Loader2,
  AlertCircle, ArrowUpRight, ArrowDownRight, Clock, Eye, Search,
  Play, UserPlus, Crown, Zap
} from 'lucide-react'
import { adminGetActivity } from '../api/client'

const EVENT_LABELS = {
  login: 'Logins',
  register: 'Registrations',
  logout: 'Logouts',
  watch: 'Watches',
  search: 'Searches',
  browse: 'Browses',
  subscribe: 'Subscriptions',
  profile_update: 'Profile Updates'
}
const EVENT_COLORS = {
  login: '#3b82f6',
  register: '#22c55e',
  logout: '#6b7280',
  watch: '#D4A017',
  search: '#8b5cf6',
  browse: '#f97316',
  subscribe: '#f5c518',
  profile_update: '#ec4899'
}
const EVENT_ICONS = {
  login: Eye,
  register: UserPlus,
  logout: Users,
  watch: Play,
  search: Search,
  browse: Activity,
  subscribe: Crown,
  profile_update: Zap
}

// ── Metric Card ──
function MetricCard({ label, value, icon: Icon, color, growth, growthLabel }) {
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
      {growth !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          {growth >= 0 ? (
            <ArrowUpRight size={12} className="text-green-400" />
          ) : (
            <ArrowDownRight size={12} className="text-red-400" />
          )}
          <span className={`text-[10px] font-medium ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Math.abs(growth)}%
          </span>
          <span className="text-[10px] text-gray-600">vs prev period</span>
        </div>
      )}
    </div>
  )
}

// ── SVG Line Chart ──
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
  const gradId = `grad-${label.replace(/\s/g, '-')}`

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
          <span key={i} className="text-[8px] text-gray-500">{d[labelKey]}</span>
        ))}
      </div>
    </div>
  )
}

// ── Bar Chart ──
function BarChart({ data, valueKey, labelKey = 'label', label, color }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-4">{label}</h3>
      <div className="flex items-end gap-1" style={{ height: 100 }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(((d[valueKey] || 0) / max) * 100, 2)}%`,
                background: `linear-gradient(to top, ${color}40, ${color})`,
                minHeight: 2
              }}
            />
            <span className="text-[7px] text-gray-600">{d[labelKey]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──
export default function ActivityPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await adminGetActivity()
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load activity data')
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
  const dailyTrend = data?.dailyTrend || []
  const weeklyTrend = data?.weeklyTrend || []
  const monthlyTrend = data?.monthlyTrend || []
  const events = data?.eventDistribution || []
  const hourly = data?.hourlyDistribution || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-white">User Activity</h1>
          <p className="text-xs text-gray-500 mt-1">DAU, WAU, MAU and engagement metrics — all from real data</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-[#111118] border border-[#1E1E2E] rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#D4A017]/50 transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Core DAU/WAU/MAU Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Daily Active (DAU)" value={ov.dau || 0} icon={Activity} color="#D4A017" growth={ov.dauGrowth} />
        <MetricCard label="Weekly Active (WAU)" value={ov.wau || 0} icon={TrendingUp} color="#22c55e" growth={ov.wauGrowth} />
        <MetricCard label="Monthly Active (MAU)" value={ov.mau || 0} icon={Calendar} color="#3b82f6" growth={ov.mauGrowth} />
        <MetricCard label="Retention Rate" value={`${ov.retentionRate || 0}%`} icon={Users} color="#8b5cf6" />
      </div>

      {/* User Status Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard label="Total Users" value={ov.totalUsers || 0} icon={Users} color="#6b7280" />
        <MetricCard label="Active Accounts" value={ov.activeUsers || 0} icon={UserPlus} color="#22c55e" />
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <LineChart data={dailyTrend} dataKey="dau" label="Daily Active Users (30 days)" color="#D4A017" />
        <BarChart data={dailyTrend.slice(-14)} valueKey="events" label="Daily Events (14 days)" color="#3b82f6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <LineChart data={weeklyTrend} dataKey="wau" label="Weekly Active Users (12 weeks)" color="#22c55e" />
        <LineChart data={monthlyTrend} dataKey="mau" label="Monthly Active Users (12 months)" color="#8b5cf6" />
      </div>

      {/* Event Distribution + Hourly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Event Distribution */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Event Distribution (30 days)</h3>
          {events.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No events recorded yet</p>
          ) : (
            <div className="space-y-2.5">
              {events.map((e, i) => {
                const maxCount = Math.max(...events.map(ev => ev.count), 1)
                const pct = Math.round((e.count / maxCount) * 100)
                const Icon = EVENT_ICONS[e.event] || Activity
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: EVENT_COLORS[e.event] || '#888' }} />
                        <span className="text-xs text-gray-400">{EVENT_LABELS[e.event] || e.event}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-600">{e.uniqueUsers} users</span>
                        <span className="text-xs text-white font-medium">{e.count.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#1E1E2E] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: EVENT_COLORS[e.event] || '#888' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Hourly Activity */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Peak Hours (7 days)</h3>
          <div className="flex items-end gap-[2px]" style={{ height: 100 }}>
            {hourly.map((h, i) => {
              const maxVal = Math.max(...hourly.map(x => x.events), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max((h.events / maxVal) * 100, 1)}%`,
                      background: h.events > 0
                        ? `linear-gradient(to top, ${h.events / maxVal > 0.7 ? '#D4A017' : '#3b82f6'}80, ${h.events / maxVal > 0.7 ? '#D4A017' : '#3b82f6'})`
                        : '#1E1E2E',
                      minHeight: 1
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[7px] text-gray-600">00:00</span>
            <span className="text-[7px] text-gray-600">06:00</span>
            <span className="text-[7px] text-gray-600">12:00</span>
            <span className="text-[7px] text-gray-600">18:00</span>
            <span className="text-[7px] text-gray-600">23:00</span>
          </div>
        </div>
      </div>
    </div>
  )
}