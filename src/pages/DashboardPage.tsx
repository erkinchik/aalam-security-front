import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEmergencies, getOperators } from '../api/admin'

export function DashboardPage() {
  const { data: emergencies } = useQuery({
    queryKey: ['emergencies', { page: 1, limit: 1 }],
    queryFn: () => getEmergencies({ page: 1, limit: 1 }),
  })

  const { data: operators } = useQuery({
    queryKey: ['operators'],
    queryFn: () => getOperators(),
  })

  const totalEmergencies = emergencies?.total ?? 0
  const onlineOperators = operators?.filter((o) => o.isOnline).length ?? 0

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-6">
        Главная
      </h1>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Link
          to="/emergencies"
          className="block rounded-lg border border-[var(--color-border)] bg-surface p-4 hover:border-accent/50 transition-colors"
        >
          <p className="text-sm text-[var(--color-muted)]">Всего тревог</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-text)] mt-1">
            {totalEmergencies}
          </p>
        </Link>
        <Link
          to="/emergencies?assigned=false"
          className="block rounded-lg border border-[var(--color-border)] bg-surface p-4 hover:border-accent/50 transition-colors"
        >
          <p className="text-sm text-[var(--color-muted)]">Не назначены</p>
          <p className="font-display text-2xl font-semibold text-accent mt-1">
            Открыть список
          </p>
        </Link>
        <Link
          to="/operators"
          className="block rounded-lg border border-[var(--color-border)] bg-surface p-4 hover:border-accent/50 transition-colors"
        >
          <p className="text-sm text-[var(--color-muted)]">Операторы онлайн</p>
          <p className="font-display text-2xl font-semibold text-status-closed mt-1">
            {onlineOperators} / {operators?.length ?? 0}
          </p>
        </Link>
      </div>

      <div className="space-y-2">
        <Link
          to="/emergencies"
          className="block text-accent hover:underline font-medium"
        >
          Все тревоги →
        </Link>
        <Link
          to="/operators"
          className="block text-accent hover:underline font-medium"
        >
          Управление операторами →
        </Link>
        <Link
          to="/organizations"
          className="block text-accent hover:underline font-medium"
        >
          Управление организациями →
        </Link>
      </div>
    </div>
  )
}
