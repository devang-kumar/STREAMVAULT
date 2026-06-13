import { useSearchParams } from 'react-router-dom'

export default function ContentTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex items-center gap-1">
      {['series', 'movies'].map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab
              ? 'border-b-2 border-[#F59E0B] text-white'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          {tab === 'series' ? 'Series' : 'Movies'}
        </button>
      ))}
    </div>
  )
}