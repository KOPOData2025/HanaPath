"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    // 앱 시작 시 인증 상태 초기화
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
} 