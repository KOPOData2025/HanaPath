"use client"

import { useAuthStore } from "@/store/auth"
import { LandingPage } from "@/components/landing-page"
import { DashboardPage } from "@/components/dashboard-page"

export default function HomePage() {
  const { isLoggedIn } = useAuthStore()
  return isLoggedIn ? <DashboardPage /> : <LandingPage />
}
