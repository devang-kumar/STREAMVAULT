import { List, Grid } from 'lucide-react'

export default function ViewToggle({ viewMode, onChange }) {
  return (
    <div className="flex items-center rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141415] p-0.5">
      <button
        onClick={() => onChange('list')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          viewMode === 'list'
            ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
            : 'text-[#9CA3AF] hover:text-white'
        }`}
        title="List View"
      >
        <List size={14} />
        <span className="hidden sm:inline">List</span>
      </button>
      <button
        onClick={() => onChange('flow')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          viewMode === 'flow'
            ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
            : 'text-[#9CA3AF] hover:text-white'
        }`}
        title="Flow View"
      >
        <Grid size={14} />
        <span className="hidden sm:inline">Flow</span>
      </button>
    </div>
  )
}