import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as loginApi } from '../api/auth'
import type { AuthTokens } from '../types/api'

const TOKEN_KEY = 'sos-security-admin-tokens'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (tokens: AuthTokens | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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

      logout: () => {
        set({ accessToken: null, refreshToken: null })
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
