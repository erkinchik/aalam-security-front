interface BadgeProps {
  children: React.ReactNode
  variant?:
    | 'new'
    | 'assigned'
    | 'in-progress'
    | 'closed'
    | 'default'
    | 'app-pending'
    | 'app-approved'
    | 'app-rejected'
  className?: string
}

const variants = {
  new: 'bg-status-new/20 text-blue-400 border-status-new/40',
  assigned: 'bg-status-assigned/20 text-yellow-400 border-status-assigned/40',
  'in-progress': 'bg-status-in-progress/20 text-orange-400 border-status-in-progress/40',
  closed: 'bg-status-closed/20 text-green-400 border-status-closed/40',
  default: 'bg-surface text-[var(--color-muted)] border-[var(--color-border)]',
  'app-pending': 'bg-status-new/20 text-blue-400 border-status-new/40',
  'app-approved': 'bg-status-closed/20 text-green-400 border-status-closed/40',
  'app-rejected': 'bg-red-500/10 text-red-400 border-red-500/30',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-md border px-2 py-0.5
        font-display text-xs font-medium
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  )
}
