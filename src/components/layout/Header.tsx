import { useAuthStore } from '../../stores/authStore'
import { useAlarmStore } from '../../stores/alarmStore'
import { Button } from '../ui/Button'

export function Header() {
  const logout = useAuthStore((s) => s.logout)
  const isAudioUnlocked = useAlarmStore((s) => s.isAudioUnlocked)
  const testBeep = useAlarmStore((s) => s.testBeep)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-surface px-6">
      <div />
      <div className="flex items-center gap-2">
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
        >
          {isAudioUnlocked ? 'Тест звука' : 'Включить звук'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Выйти
        </Button>
      </div>
    </header>
  )
}
