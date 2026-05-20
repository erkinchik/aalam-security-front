import { publicClient } from './client'
import type { AuthTokens } from '../types/api'

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await publicClient.post<AuthTokens>('/auth/login', {
    email,
    password,
  })
  return data
}
