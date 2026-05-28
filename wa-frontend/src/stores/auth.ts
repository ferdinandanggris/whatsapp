import { create } from "zustand"
import type { User } from "../types"
import * as authApi from "../api/auth"

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  setAuth: (token: string, refreshToken: string, user: User) => void
  logout: () => void
  init: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  user: null,
  loading: !localStorage.getItem("token"),

  setAuth: (token, refreshToken, user) => {
    localStorage.setItem("token", token)
    localStorage.setItem("refresh_token", refreshToken)
    set({ token, user, loading: false })
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("refresh_token")
    set({ token: null, user: null, loading: false })
  },

  init: async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const user = await authApi.getMe()
      set({ token, user, loading: false })
    } catch {
      localStorage.removeItem("token")
      localStorage.removeItem("refresh_token")
      set({ token: null, user: null, loading: false })
    }
  },
}))
