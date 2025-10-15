import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: number
  name: string
  nickname: string | null
  email: string
  phone: string
  nationalIdFront: string
  nationalIdBackFirst: string
  userType: string
  createdAt: string
}

interface AuthState {
  isLoggedIn: boolean
  user: User | null
  token: string | null
  isInitialized: boolean
  login: (userData: User, token: string) => void
  logout: () => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      token: null,
      isInitialized: false,
      login: (userData: User, token: string) => {
        localStorage.setItem('access_token', token)
        set({ isLoggedIn: true, user: userData, token })
      },
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        set({ isLoggedIn: false, user: null, token: null })
      },
      initializeAuth: () => {
        const token = localStorage.getItem('access_token')
        const userData = localStorage.getItem('user')
        
        if (token && userData) {
          try {
            const user = JSON.parse(userData)
            set({ isLoggedIn: true, user, token, isInitialized: true })
          } catch (error) {
            console.error('Failed to parse user data:', error)
            get().logout()
            set({ isInitialized: true })
          }
        } else {
          set({ isInitialized: true })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isLoggedIn: state.isLoggedIn, 
        user: state.user, 
        token: state.token,
        isInitialized: state.isInitialized
      }),
    }
  )
)
