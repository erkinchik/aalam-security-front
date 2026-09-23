import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as loginApi, logout as logoutApi } from '../api/auth'
import { useAlarmStore } from './alarmStore'
import type { AuthTokens } from '../types/api'

const TOKEN_KEY = 'sos-security-admin-tokens'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (tokens: AuthTokens | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,

      setTokens: (tokens) =>
        set({
          accessToken: tokens?.accessToken ?? null,
          refreshToken: tokens?.refreshToken ?? null,
        }),

      login: async (email, password) => {
        const tokens = await loginApi(email, password)
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      },

      logout: async () => {
        const { accessToken, refreshToken } = get()
        // Сначала гасим локально: сирена живёт на уровне модуля и после выхода
        // звучала на странице входа, где её нечем остановить.
        set({ accessToken: null, refreshToken: null })
        useAlarmStore.getState().dismiss()
        if (!accessToken || !refreshToken) return
        try {
          await logoutApi(refreshToken, accessToken)
        } catch (err) {
          // Выход на клиенте уже случился; не отозванный токен истечёт сам.
          console.warn('logout: сервер не подтвердил выход', err)
        }
      },
    }),
    {
      name: TOKEN_KEY,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
