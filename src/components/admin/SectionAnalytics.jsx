import { useState, useEffect } from 'react'
import { adminGetAnalytics } from '../../api/client'

export default function SectionAnalytics() {
  const [revenueData, setRevenueData] = useState(Array(12).fill(0))
  const [topContent, setTopContent] = useState([])
  const [planDistribution, setPlanDistribution] = useState([])
  const [kpis, setKpis] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    adminGetAnalytics()
      .then((data) => {
        if (!mounted) return
        setRevenueData(data.revenueData || Array(12).fill(0))
        setTopContent(data.topContent || [])
        setPlanDistribution(data.planDistribution || [])
        setKpis(data.kpis || [])
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load analytics', err)
        setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const maxRevenue = Math.max(...revenueData, 100)

  if (isLoading) return <div className="text-white">Loading analytics...</div>

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-white">Analytics</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, idx) => (
          <div key={idx} className="glass rounded-xl p-5">
            <p className="mb-1 text-xs text-gray-500">{k.label}</p>
            <p className="font-display text-2xl text-white sm:text-3xl">{k.value}</p>
            <p className="mt-1 text-xs text-gray-600">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-white">Monthly Revenue (INR)</h3>
          <span className="text-xs text-gray-500">Last 12 months</span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex h-40 min-w-[680px] items-end gap-2">
            {revenueData.map((v, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                <div
                  className="relative w-full cursor-pointer rounded-t bg-[#D4A017]/70 transition-colors hover:bg-[#D4A017]"
                  style={{ height: `${(v / maxRevenue) * 100}%` }}
                  title={`INR ${(v / 1000).toFixed(0)}k`}
                />
                <span className="text-[9px] text-gray-600">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="glass rounded-xl p-4 sm:p-6">
          <h3 className="mb-4 font-semibold text-white">Top Content</h3>
          <div className="space-y-3">
            {topContent.map((c, i) => (
              <div key={c.title} className="flex items-center gap-3">
                <span className="w-5 font-display text-lg text-gray-600">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.views} views</p>
                </div>
                <span className={`text-xs font-medium ${c.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{c.trend}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4 sm:p-6">
          <h3 className="mb-4 font-semibold text-white">Subscription Distribution</h3>
          <div className="space-y-3">
            {planDistribution.map((p) => (
              <div key={p.plan}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-400">{p.plan}</span>
                  <span className="text-gray-500">{p.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
