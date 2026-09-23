import { publicClient } from './client'
import type { AuthTokens } from '../types/api'

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await publicClient.post<AuthTokens>('/auth/login', {
    email,
    password,
  })
  return data
}

/**
 * Отзывает refresh-токен на сервере. Токен доступа передаём явно, а не через
 * apiClient: его интерцептор при неудачном обновлении сам зовёт выход, и на
 * протухшем токене вышла бы петля.
 */
export async function logout(refreshToken: string, accessToken: string): Promise<void> {
  await publicClient.post(
    '/auth/logout',
    { refreshToken },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
}
