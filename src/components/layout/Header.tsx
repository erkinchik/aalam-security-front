import { useAuthStore } from '../../stores/authStore'
import { useAlarmStore } from '../../stores/alarmStore'
import { Button } from '../ui/Button'

type HeaderProps = {
  onMobileMenuOpen: () => void
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const logout = useAuthStore((s) => s.logout)
  const isAudioUnlocked = useAlarmStore((s) => s.isAudioUnlocked)
  const testBeep = useAlarmStore((s) => s.testBeep)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-surface px-3 sm:px-6">
      <button
        type="button"
        onClick={onMobileMenuOpen}
        className="md:hidden -ml-1 rounded-md p-2 text-[var(--color-text)] hover:bg-[var(--color-border)]"
        aria-label="Открыть меню"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            void testBeep()
          }}
          title={
            isAudioUnlocked
              ? 'Проверить сигнал тревоги'
              : 'Звук заблокирован браузером — нажмите, чтобы включить'
          }
          aria-label={isAudioUnlocked ? 'Тест звука' : 'Включить звук'}
        >
          <span className="sm:hidden inline-flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </span>
          <span className="hidden sm:inline">
            {isAudioUnlocked ? 'Тест звука' : 'Включить звук'}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          aria-label="Выйти"
        >
          <span className="sm:hidden inline-flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="hidden sm:inline">Выйти</span>
        </Button>
      </div>
    </header>
  )
}
