"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { HanaLogo } from "@/components/hana-logo"
import { cn } from "@/lib/utils"
import { login as loginAPI } from "@/lib/api/user"
import { toast } from "sonner"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog"
import { CheckCircle, XCircle } from "lucide-react"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setIsLoading(true)
  //
  //   // 로딩 애니메이션을 위한 지연
  //   await new Promise((resolve) => setTimeout(resolve, 1500))
  //
  //   login()
  //   router.push("/") // 로그인 후 홈(대시보드)으로 이동
  // }

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await loginAPI(formData.email, formData.password)
      
      // 백엔드에서 토큰과 사용자 정보를 함께 반환
      const { user: userData, token } = response
      
      // 사용자 정보를 localStorage에 저장
      localStorage.setItem('user', JSON.stringify(userData))
      
      // auth store에 로그인 정보 저장
      login(userData, token)
      
      toast.success(
        <span className="inline-flex items-center gap-2">
          <CheckCircle className="text-green-500 w-6 h-6" />
          환영합니다!
        </span>,
        {
          icon: null,
          duration: 3000,
        }
      )
      // 토스트가 보일 시간을 주고 라우팅
      setTimeout(() => {
        router.push("/mypage")
      }, 1000)
    } catch (error) {
      setIsErrorModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-32 h-32 bg-[#009178]/10 rounded-full"
        />
        <motion.div
          animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-32 w-24 h-24 bg-teal-400/15 rounded-full"
        />
        <motion.div
          animate={{ y: [-15, 15, -15], x: [15, -15, 15] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-32 w-40 h-40 bg-[#009178]/8 rounded-full"
        />
        <motion.div
          animate={{ y: [10, -10, 10], x: [-5, 5, -5] }}
          transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-20 right-20 w-28 h-28 bg-teal-300/12 rounded-full"
        />
      </div>
      <div className="w-full max-w-md">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="absolute inset-0 bg-gray-50/50 rounded-2xl -m-4" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 bg-[#009178] rounded-2xl shadow-lg">
                  <HanaLogo size={32} className="brightness-0 invert" />
                </div>
                <span className="text-2xl font-bold text-[#004E42]">HanaPath</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">로그인</h1>
              <p className="text-gray-600">다시 오신 것을 환영합니다!</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                이메일
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="hello@hanapath.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-[#009178] focus:ring-[#009178]" />
                <span className="text-gray-600">로그인 상태 유지</span>
              </label>
              <Link href="#" className="text-[#009178] hover:text-[#004E42] font-medium">
                비밀번호 찾기
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-12 bg-[#009178] hover:bg-[#004E42] text-white font-semibold rounded-xl transition-all duration-300 group shadow-lg hover:shadow-xl",
                isLoading && "opacity-70 cursor-not-allowed",
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  로그인 중...
                </div>
              ) : (
                <>
                  로그인
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-[#009178] hover:text-[#004E42] font-semibold">
                회원가입
              </Link>
            </p>
          </div>

          <AlertDialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
            <AlertDialogContent className="max-w-md text-center space-y-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">로그인 실패</AlertDialogTitle>
                <AlertDialogDescription className="text-red-500">이메일 또는 비밀번호가 올바르지 않습니다.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button
                    onClick={() => setIsErrorModalOpen(false)}
                    className="w-full bg-[#009178] text-white hover:bg-[#007c64]"
                >
                  확인
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </motion.div>
      </div>
    </div>
  )
}
