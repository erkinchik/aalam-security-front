import { isAxiosError } from 'axios'

/**
 * Тексты по машинным кодам с сервера. Незнакомый код — показываем серверное
 * сообщение, поэтому словарь можно пополнять постепенно.
 */
const CODE_MESSAGES: Record<string, string> = {
  SESSION_NOT_FOUND: 'Вызов не найден',
  SESSION_ALREADY_CLOSED: 'Вызов уже закрыт',
  SESSION_ALREADY_CLAIMED: 'Вызов принял другой оператор',
  SESSION_WRONG_STATUS: 'Вызов в другом состоянии — обновите страницу',
  NOT_YOUR_SESSION: 'Это не ваш вызов',
  NOT_ASSIGNED_TO_SESSION: 'Вызов назначен не на вас',
  SOS_IN_PROGRESS: 'Вызов уже отправляется, подождите',
  NOT_ON_SHIFT: 'Заступите на смену, чтобы принимать вызовы',
  OPERATOR_BUSY: 'У оператора есть незакрытый вызов',
  SHIFT_HAS_OPEN_SESSIONS: 'Нельзя сдать смену: есть незакрытые вызовы',
  NOT_AN_OPERATOR: 'Пользователь не является оператором',
  OPERATOR_NOT_FOUND: 'Оператор не найден',
  SUBSCRIPTION_REQUIRED: 'Нужна подписка или привязка к точке',
  SUBSCRIPTION_EXPIRED: 'Срок подписки истёк',
  VENUE_BIND_REQUIRED: 'Сначала привяжитесь к точке по коду приглашения',
  VENUE_NOT_FOUND: 'Точка не найдена',
  DEMO_DISABLED: 'Демо-активация недоступна',
  PASSWORD_RESET_UNAVAILABLE:
    'Восстановление по почте пока недоступно. Обратитесь к администратору.',
  EMAIL_ALREADY_REGISTERED: 'Этот email уже зарегистрирован',
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  STAFF_CANNOT_SELF_DELETE:
    'Сотрудники и администраторы не удаляют учётную запись сами',
  ACTIVE_SOS_BLOCKS_DELETE: 'У вас есть активный SOS-вызов',
  TELEGRAM_ALREADY_LINKED: 'Этот Telegram уже привязан к другому аккаунту',
  PHONE_MISMATCH: 'Номер не совпадает с указанным в профиле',
}

type ApiErrorBody = {
  code?: string
  message?: string | string[]
  error?: string
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback
  }
  const data = error.response?.data as ApiErrorBody | undefined
  if (data?.code && CODE_MESSAGES[data.code]) return CODE_MESSAGES[data.code]
  const serverMessage = Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message || data?.error
  return serverMessage || fallback
}

export function apiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  return (error.response?.data as ApiErrorBody | undefined)?.code
}
