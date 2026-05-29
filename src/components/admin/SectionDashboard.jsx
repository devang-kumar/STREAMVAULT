import { TrendingUp, TrendingDown } from 'lucide-react'

export default function SectionDashboard({ statCards, onAddSeries }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-5">
            <p className="mb-1 text-xs font-medium text-gray-500">{stat.label}</p>
            <p className="font-display text-2xl text-white sm:text-3xl">{stat.value}</p>
            <div className={`mt-2 flex items-center gap-1 text-xs ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {stat.change.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {stat.change} this month
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-4 sm:p-6">
        <h3 className="mb-4 text-base font-semibold text-white">Monthly Signups</h3>
        <div className="overflow-x-auto pb-1">
          <div className="flex h-32 min-w-[680px] items-end gap-2">
            {[60, 80, 55, 90, 75, 100, 85, 110, 95, 120, 105, 140].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full cursor-pointer rounded-t bg-[#D4A017]/80 transition-colors hover:bg-[#D4A017]" style={{ height: `${h}%` }} />
                <span className="text-[9px] text-gray-600">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-4 sm:p-6">
        <h3 className="mb-4 text-base font-semibold text-white">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'New series uploaded', item: 'Void Protocol S1', time: '2h ago', color: 'text-green-400' },
            { action: 'Episode published', item: 'Dark Horizons E6', time: '5h ago', color: 'text-blue-400' },
            { action: 'User reported', item: 'Content violation flag', time: '8h ago', color: 'text-yellow-400' },
            { action: 'Subscription spike', item: '+342 new users today', time: '12h ago', color: 'text-[#D4A017]' },
          ].map((a, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 border-b border-white/5 py-2 last:border-0 sm:flex-nowrap sm:gap-3">
              <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current ${a.color}`} />
              <div className="min-w-0 flex-1">
                <span className="text-sm text-gray-300">{a.action} - </span>
                <span className="text-sm font-medium text-white">{a.item}</span>
              </div>
              <span className="text-xs text-gray-600">{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Add Series', action: onAddSeries, color: 'bg-[#D4A017]/10 text-[#D4A017] hover:bg-[#D4A017]/20' },
          { label: 'View Users', action: null, color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' },
          { label: 'Analytics', action: null, color: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' },
          { label: 'Settings', action: null, color: 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20' },
        ].map((q) => (
          <button key={q.label} onClick={q.action} className={`rounded-xl p-4 text-left text-sm font-medium transition-colors ${q.color}`}>
            {q.label}
          </button>
        ))}
      </div>
    </div>
  )
}
