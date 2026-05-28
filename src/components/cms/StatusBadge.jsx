const STATUS_STYLES = {
  published: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20',
  draft: 'bg-[#6B7280]/15 text-[#6B7280] border border-[#6B7280]/20',
  archived: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20',
  upcoming: 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20',
  ongoing: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/20',
  completed: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20',
}

export default function StatusBadge({ status = 'draft' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style}`}>
      {status}
    </span>
  )
}