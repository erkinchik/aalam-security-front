import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../stores/authStore'
import { useAlarmStore } from '../stores/alarmStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import logoUrl from '../assets/logo.png'

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  async function onSubmit(data: FormData) {
    setError(null)
    void useAlarmStore.getState().unlock()
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Неверные учётные данные'
          : 'Неверные учётные данные',
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-2">
          <img src={logoUrl} alt="SOS Security" className="h-10 w-10 rounded-lg" />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            SOS Security — Админ-панель
          </h1>
        </div>
        <p className="text-[var(--color-muted)] text-sm mb-6">
          Войдите, чтобы управлять тревогами
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Вход…' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  )
}
