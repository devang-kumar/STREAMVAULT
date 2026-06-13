import { ChevronRight, Edit } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function BreadcrumbBar({ path = [], status, onEdit }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#141415] px-4 py-2.5 border border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-1.5 text-sm">
        {path.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} className="text-[#6B7280]" />}
            <span className={i === path.length - 1 ? 'text-white font-medium' : 'text-[#9CA3AF]'}>
              {item.label}
            </span>
          </span>
        ))}
      </div>
      {status && (
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={status} />
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
            >
              <Edit size={12} />
              Edit Details
            </button>
          )}
        </div>
      )}
    </div>
  )
}