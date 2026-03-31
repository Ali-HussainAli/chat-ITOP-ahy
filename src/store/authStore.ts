import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type User = {
  id: string
  phone: string
  name: string
  avatar_url: string | null
  bio: string | null
  last_seen: string
  is_online: boolean
  verification_color: string | null
  role: 'user' | 'admin'
  is_banned: boolean
  is_active: boolean
  created_at: string
}

type AuthStore = {
  user: User | null
  theme: 'dark' | 'light'
  setUser: (user: User | null) => void
  setTheme: (theme: 'dark' | 'light') => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      theme: 'dark',
      setUser: (user) => set({ user }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'itop-auth',
      partialize: (state) => ({ user: state.user, theme: state.theme }),
    }
  )
)
