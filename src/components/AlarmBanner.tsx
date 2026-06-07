import { useAlarmStore } from '../stores/alarmStore'

export function AlarmBanner() {
  const isRinging = useAlarmStore((s) => s.isRinging)
  const pendingCount = useAlarmStore((s) => s.pendingCount)
  const dismiss = useAlarmStore((s) => s.dismiss)

  if (!isRinging) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-500/40 bg-red-600/90 px-3 sm:px-6 py-3 text-white animate-pulse">
      <div className="font-display text-sm font-semibold">
        Новая тревога{pendingCount > 1 ? ` (×${pendingCount})` : ''} — нажмите в любом месте, чтобы заглушить
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          dismiss()
        }}
        className="shrink-0 rounded-md bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30"
      >
        Заглушить
      </button>
    </div>
  )
}
