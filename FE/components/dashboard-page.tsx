"use client"

import { motion, easeOut, easeInOut } from "framer-motion"
import { useState, useEffect } from "react"
import { SummaryCards } from "./dashboard/summary-cards"
import { GoalSavings } from "./dashboard/goal-savings"
import { AttendanceCalendar } from "./dashboard/attendance-calendar"
import { DailyQuizCard } from "./dashboard/daily-quiz"
import { Sparkles, TrendingUp, Star, Gift, Compass, Clover } from "lucide-react"
import Image from "next/image"
import { useAuthStore } from "@/store/auth"
import { useAttendanceStore } from "@/store/attendance"
import { attendanceApi } from "@/lib/api/attendance"
import { getUserInfo } from "@/lib/api/user"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOut,
    },
  },
}

const heroVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: easeOut,
    },
  },
}

const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
      ease: easeInOut,
    },
  },
}

const sparkleVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 180, 360],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: easeInOut,
    },
  },
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const { consecutiveDays, setConsecutiveDays, refreshStats } = useAttendanceStore()
  const [loading, setLoading] = useState(true)
  const [userLevel, setUserLevel] = useState<number>(1)
  
  // 사용자 이름 표시
  const displayName = user?.name || "사용자"

  // 출석 통계 로드 함수
  const loadAttendanceStats = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const stats = await attendanceApi.getAttendanceStats(user.id)
      setConsecutiveDays(stats.consecutiveDays)
    } catch (error) {
      console.error('출석 통계 로드 실패:', error)
      setConsecutiveDays(0)
    } finally {
      setLoading(false)
    }
  }

  // 연속 출석일 수 가져오기
  useEffect(() => {
    loadAttendanceStats()
    
    // 페이지 로드 시와 주기적으로 통계 업데이트 (5분마다)
    const interval = setInterval(loadAttendanceStats, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user?.id])

  // 출석체크 후 통계 새로고침을 위한 함수를 스토어에 등록
  useEffect(() => {
    useAttendanceStore.setState({ refreshStats: loadAttendanceStats })
  }, [user?.id])

  // 사용자 레벨 가져오기
  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const info = await getUserInfo(user.id)
        setUserLevel((info as any)?.level ?? 1)
      } catch (error) {
        console.error('사용자 레벨 로드 실패:', error)
        setUserLevel(1)
      }
    })()
  }, [user?.id])

  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div variants={sparkleVariants} animate="animate" className="absolute top-20 left-10 text-emerald-300">
          <Sparkles size={24} />
        </motion.div>
        <motion.div
          variants={sparkleVariants}
          animate="animate"
          className="absolute top-40 right-20 text-blue-300"
          style={{ animationDelay: "0.5s" }}
        >
          <Star size={20} />
        </motion.div>
        <motion.div
          variants={sparkleVariants}
          animate="animate"
          className="absolute top-1/3 left-20 text-teal-500"
          style={{ animationDelay: "0.5s" }}
        >
          <Clover size={20} />
        </motion.div>
        <motion.div
          variants={sparkleVariants}
          animate="animate"
          className="absolute bottom-40 left-20 text-yellow-300"
          style={{ animationDelay: "1s" }}
        >
          <Gift size={18} />
        </motion.div>
        <motion.div
          variants={sparkleVariants}
          animate="animate"
          className="absolute bottom-20 right-10 text-pink-300"
          style={{ animationDelay: "1.5s" }}
        >
          <TrendingUp size={22} />
        </motion.div>
      </div>

      <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Hero Section with 3D Characters */}
          <motion.div variants={itemVariants} className="relative">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden relative">
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="text-white space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                      안녕하세요,
                      <span className="block text-yellow-300">{displayName}님! 🌟</span>
                    </h1>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-xl text-emerald-100 leading-relaxed"
                  >
                    HanaPath와 함께 스마트한 금융 생활을 시작해봐요.
                    <br />
                    오늘도 목표를 향해 한 걸음 더!
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="flex flex-wrap gap-4 pt-4"
                  >
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                      <Compass className="text-yellow-300" size={16} />
                      <span className="text-sm font-medium">레벨 {userLevel}</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                      <TrendingUp className="text-green-300" size={16} />
                      <span className="text-sm font-medium">
                        {loading ? "로딩 중..." : `연속 출석 ${consecutiveDays}일`}
                      </span>
                    </div>               
                  </motion.div>
                </div>

                <motion.div variants={heroVariants} className="flex justify-center lg:justify-end">
                  <motion.div variants={floatingVariants} animate="animate" className="relative">
                    <Image
                      src="/dashboard-hero.png"
                      alt="HanaPath 대시보드 캐릭터"
                      width={400}
                      height={300}
                      className="w-full max-w-md h-auto drop-shadow-2xl"
                      priority
                    />

                    {/* Floating elements around the image */}
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
                    >
                      ⭐
                    </motion.div>

                    <motion.div
                      animate={{
                        rotate: -360,
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                        delay: 1,
                      }}
                      className="absolute -bottom-2 -left-4 w-6 h-6 bg-sky-300/80 rounded-full flex items-center justify-center shadow-lg"
                    >
                      💎
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Animated background shapes */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/5 rounded-full"
              />
            </div>
          </motion.div>

          {/* Enhanced Summary Cards */}
          <motion.div variants={itemVariants}>
            <SummaryCards />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <motion.div variants={itemVariants}>
                <GoalSavings />
              </motion.div>
            </div>

            <div className="lg:col-span-1 space-y-8">
              <motion.div variants={itemVariants}>
                <AttendanceCalendar />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <DailyQuizCard />
              </motion.div>
            </div>
          </div>     
        </motion.div>
      </div>
    </div>
  )
}
