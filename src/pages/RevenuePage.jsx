import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, TrendingUp, Users, CreditCard, Calendar,
  ArrowUpRight, ArrowDownRight, RefreshCw, Loader2,
  AlertCircle, Check, Crown, Zap
} from 'lucide-react'
import { adminGetRevenue } from '../api/client'

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

// ── Simple Bar Chart ──
function BarChart({ data, label, color = '#D4A017', valueKey = 'revenue', labelKey = 'label', formatValue }) {
  const maxValue = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">{label}</h3>
        <TrendingUp size={16} className="text-gray-500" />
      </div>
      <div className="flex items-end gap-1.5" style={{ height: 140 }}>
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: `${Math.max((item[valueKey] / maxValue) * 100, 2)}%`,
                background: `linear-gradient(to top, ${color}40, ${color})`,
                minHeight: 2,
              }}
              title={formatValue ? formatValue(item[valueKey]) : `₹${item[valueKey]?.toLocaleString('en-IN')}`}
            />
            <span className="text-[8px] text-gray-500">{item[labelKey]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Line Chart (SVG) ──
function LineChart({ data, dataKey = 'revenue', labelKey = 'label', color = '#D4A017', label }) {
  const values = data.map(d => d[dataKey])
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const width = 400
  const height = 120
  const padding = 10

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (d[dataKey] - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`

  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">{label}</h3>
        <TrendingUp size={16} className="text-gray-500" />
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={padding + pct * (height - padding * 2)}
            x2={width - padding}
            y2={padding + pct * (height - padding * 2)}
            stroke="#1E1E2E"
            strokeWidth="0.5"
          />
        ))}
        {/* Area fill */}
        <polygon points={areaPoints} fill={`url(#grad-${label})`} />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - padding * 2)
          const y = padding + (1 - (d[dataKey] - min) / range) * (height - padding * 2)
          return (
            <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
          )
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

// ── Recent Payments Table ──
function RecentPayments({ payments }) {
  if (!payments || payments.length === 0) return (
    <div className="text-center py-8 text-gray-500 text-xs">No payments yet</div>
  )
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#1E1E2E]">
        <h3 className="text-sm font-bold text-white">Recent Payments</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_100px_100px] gap-3 px-5 py-2 border-b border-[#1E1E2E] text-[9px] text-gray-500 font-medium uppercase tracking-wider">
            <span>User</span>
            <span>Plan</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {payments.map((p, i) => (
            <div key={p.id || i} className="grid grid-cols-[1.5fr_1fr_1fr_100px_100px] gap-3 px-5 py-2.5 border-b border-[#1E1E2E]/50 last:border-0 items-center text-xs">
              <div>
                <p className="text-white truncate">{p.user}</p>
                <p className="text-[10px] text-gray-500 truncate">{p.email}</p>
              </div>
              <span className="text-gray-400">{p.planName}</span>
              <span className="text-gray-400">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              <span className="text-white font-medium">₹{p.amount?.toLocaleString('en-IN')}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${
                p.status === 'captured' ? 'bg-green-500/10 text-green-400'
                : p.status === 'failed' ? 'bg-red-500/10 text-red-400'
                : 'bg-yellow-500/10 text-yellow-400'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Revenue Page ──
export default function RevenuePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await adminGetRevenue()
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load revenue data')
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
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[#D4A017]" />
      </div>
    )
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
  const trend = data?.revenueTrend || []
  const subGrowth = data?.subscriptionGrowth || []
  const planBreakdown = data?.revenueByPlan || []
  const recentPayments = data?.recentPayments || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-white">Revenue Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">Financial metrics from Razorpay payments</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#111118] border border-[#1E1E2E] rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#D4A017]/50 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Revenue Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Revenue" value={ov.totalRevenue || 0} icon={DollarSign} color="#D4A017" prefix="₹" />
        <MetricCard label="Monthly Revenue" value={ov.monthlyRevenue || 0} icon={TrendingUp} color="#22c55e" prefix="₹" />
        <MetricCard label="Weekly Revenue" value={ov.weeklyRevenue || 0} icon={Calendar} color="#3b82f6" prefix="₹" />
        <MetricCard label="Daily Revenue" value={ov.dailyRevenue || 0} icon={Zap} color="#f97316" prefix="₹" />
      </div>

      {/* Subscription Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Paid Subscribers" value={ov.totalPaidUsers || 0} icon={Crown} color="#f5c518" />
        <MetricCard label="Free Users" value={ov.totalFreeUsers || 0} icon={Users} color="#6b7280" />
        <MetricCard label="Conversion Rate" value={`${ov.conversionRate || 0}%`} icon={TrendingUp} color="#22c55e" />
        <MetricCard label="Revenue / User" value={`₹${ov.revenuePerUser || 0}`} icon={CreditCard} color="#8b5cf6" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <LineChart
          data={trend}
          dataKey="revenue"
          labelKey="label"
          color="#D4A017"
          label="Revenue Trend (12 months)"
        />
        <LineChart
          data={subGrowth}
          dataKey="paid"
          labelKey="label"
          color="#22c55e"
          label="Subscription Growth (12 months)"
        />
      </div>

      {/* Bar charts for revenue by plan and monthly breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <BarChart
          data={trend}
          label="Monthly Revenue (Bar)"
          color="#D4A017"
          valueKey="revenue"
          labelKey="label"
        />
        <BarChart
          data={subGrowth}
          label="Monthly New Subscribers"
          color="#22c55e"
          valueKey="newSubscribers"
          labelKey="label"
          formatValue={(v) => `${v} subscribers`}
        />
      </div>

      {/* Revenue by Plan + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue by Plan */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Revenue by Plan</h3>
          {planBreakdown.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No payment data yet</p>
          ) : (
            <div className="space-y-3">
              {planBreakdown.map((plan, i) => {
                const totalRev = planBreakdown.reduce((s, p) => s + p.revenue, 0)
                const pct = totalRev > 0 ? Math.round((plan.revenue / totalRev) * 100) : 0
                const colors = ['#D4A017', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6']
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{plan.planName} ({plan.billingCycle})</span>
                      <span className="text-xs text-white font-medium">₹{plan.revenue?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-600 mt-0.5">{pct}% · {plan.transactions} transactions</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Payments (spanning 2 cols) */}
        <div className="lg:col-span-2">
          <RecentPayments payments={recentPayments} />
        </div>
      </div>
    </div>
  )
}