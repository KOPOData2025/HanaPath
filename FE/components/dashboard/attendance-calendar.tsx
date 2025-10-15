"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Gift, Star, Trophy, ChevronLeft, ChevronRight, Check, Calendar, Award, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { attendanceApi } from "@/lib/api/attendance"
import { AttendanceDto } from "@/types/attendance"
import { useAuthStore } from "@/store/auth"
import { useAttendanceStore } from "@/store/attendance"
import { hanaMoneyApi } from "@/lib/api/hanamoney"
import { toast } from "sonner"

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export function AttendanceCalendar() {
  const { user } = useAuthStore()
  const { refreshStats } = useAttendanceStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<AttendanceDto.MonthlyAttendanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 현재 월의 첫 번째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // 첫 번째 날의 요일 (0: 일요일, 1: 월요일, ...)
  const firstDayWeekday = firstDayOfMonth.getDay()
  
  // 현재 월의 총 일수
  const daysInMonth = lastDayOfMonth.getDate()
  
  // 달력에 표시할 날짜 배열 생성
  const calendarDays = []
  
  // 이전 달의 마지막 날짜들 (첫 번째 주의 빈 칸을 채우기 위해)
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }
  
  // 현재 달의 날짜들
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }
  
  // 다음 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  // 이전 달로 이동
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  
  // 월 이름 포맷팅
  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ]
  
  const currentMonthName = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  // 출석 데이터 로드
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await attendanceApi.getMonthlyAttendance(
          user.id, 
          currentDate.getFullYear(), 
          currentDate.getMonth() + 1
        )
        setAttendanceData(data)
      } catch (err) {
        setError('출석 데이터를 불러오는데 실패했습니다.')
        console.error('출석 데이터 로드 오류:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAttendanceData()
  }, [user?.id, currentDate])

  // 출석체크 함수
  const handleCheckIn = async () => {
    if (!user?.id) return
    
    console.log('출석체크 시작...')
    
    try {
      // 1. 출석체크 기록 저장
      console.log('출석체크 API 호출 중...')
      const attendanceResponse = await attendanceApi.checkIn(user.id)
      console.log('출석체크 응답:', attendanceResponse)
      
      // 2. 하나머니 포인트 적립
      console.log('하나머니 API 호출 중...')
      const hanaMoneyResponse = await hanaMoneyApi.processAttendanceCheck()
      console.log('하나머니 응답:', hanaMoneyResponse)
      
      // 3. 출석체크 후 데이터 새로고침
      const updatedData = await attendanceApi.getMonthlyAttendance(
        user.id, 
        currentDate.getFullYear(), 
        currentDate.getMonth() + 1
      )
      setAttendanceData(updatedData)
      
      // 4. 대시보드의 연속 출석일수도 함께 업데이트
      refreshStats()
      
      // 5. 성공 메시지 표시
      let message = attendanceResponse.message || '출석체크가 완료되었습니다!'
      
      // 하나머니 응답 처리 (백엔드에서 이미 포인트 메시지를 포함하므로 추가하지 않음)
      if (hanaMoneyResponse.error) {
        console.warn('하나머니 적립 실패:', hanaMoneyResponse.error)
        // 하나머니 적립 실패해도 출석체크는 성공했으므로 계속 진행
      }
      
      console.log('토스트 표시 중...', message)
      
      toast.success("출석체크 완료", {
        description: message,
      })
      
      console.log('토스트 표시 완료')
    } catch (err) {
      console.error('출석체크 오류:', err)
      
      // 하나머니 API 오류인지 확인
      if (err instanceof Error && err.message.includes('이미 출석')) {
        toast.error("이미 출석체크 완료", {
          description: "오늘 이미 출석체크를 완료했습니다.",
        })
      } else {
        toast.error("출석체크 실패", {
          description: "출석체크에 실패했습니다. 다시 시도해주세요.",
        })
      }
    }
  }

  // 보상 날짜 계산 (5일, 10일, 15일, 20일, 25일, 30일)
  const getRewardDays = () => {
    const rewardDays: { [key: number]: string } = {}
    if (attendanceData?.attendedDays) {
      [5, 10, 15, 20, 25, 30].forEach(day => {
        if (attendanceData.attendedDays.includes(day)) {
          const multiplier = day <= 5 ? 2 : day <= 10 ? 3 : day <= 15 ? 4 : day <= 20 ? 5 : day <= 25 ? 6 : 10
          rewardDays[day] = `x${multiplier}`
        }
      })
    }
    return rewardDays
  }

  const rewardDays = getRewardDays()

  if (loading) {
    return (
      <motion.div variants={cardVariants}>
        <Card className="w-full shadow-xl border-0 overflow-hidden bg-white">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div variants={cardVariants}>
        <Card className="w-full shadow-xl border-0 overflow-hidden bg-white">
          <CardContent className="flex items-center justify-center p-8">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div variants={cardVariants}>
      <Card className="w-full shadow-xl border-0 overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-teal-600/20"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">이달의 출석체크</CardTitle>
                <p className="text-slate-200 text-sm mt-1">매일 출석하고 포인트를 받아보세요</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* 달력 헤더 */}
            <motion.div 
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="w-full flex items-center justify-between"
            >
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-teal-300/25 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-teal-700" />
              </button>
              <h2 className="text-lg font-semibold text-teal-800">
                {currentYear}년 {currentMonthName}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-teal-300/25 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-teal-700" />
              </button>
            </motion.div>
          
            {/* 요일 헤더 */}
            <motion.div 
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="w-full grid grid-cols-7 gap-1 mb-2"
            >
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-sm font-medium text-teal-700"
                >
                  {day}
                </div>
              ))}
            </motion.div>
          
            {/* 달력 그리드 */}
            <motion.div 
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="w-full grid grid-cols-7 gap-1"
            >
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={index}
                      className="h-9 w-9 flex items-center justify-center"
                    />
                  )
                }
              
                const isAttended = attendanceData?.attendedDays?.includes(day) || false
                const reward = rewardDays[day]
                const isToday = day === new Date().getDate() && 
                               currentDate.getMonth() === new Date().getMonth() &&
                               currentDate.getFullYear() === new Date().getFullYear()
              
                return (
                  <div
                    key={index}
                    className={cn(
                      "h-9 w-9 flex items-center justify-center rounded-lg relative font-medium transition-all duration-200 cursor-pointer",
                      // 출석 완료된 날 (보상 날짜 포함)
                      isAttended && reward && "bg-gradient-to-br from-yellow-500 to-orange-600 text-white font-bold shadow-lg",
                      isAttended && !reward && "bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-md",
                      // 오늘 날짜 (출석하지 않은 경우)
                      isToday && !isAttended && "bg-teal-100 text-teal-900 font-semibold border-2 border-teal-500",
                      // 일반 날짜 (출석하지 않은 경우)
                      !isAttended && !isToday && "hover:bg-teal-300/20"
                    )}
                  >
                    {day}
                    {/* 보상 날짜 뱃지 */}
                    {reward && (
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                      >
                        {reward}
                      </motion.div>
                    )}
                    {/* 출석 완료 뱃지 */}
                    {isAttended && !reward && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-md"
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </motion.div>



            {/* 오늘 출석 완료 버튼 */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={attendanceData?.todayAttended ? undefined : handleCheckIn}
                className="w-full h-10 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium shadow-lg transition-all duration-300 rounded-xl hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={attendanceData?.todayAttended || false}
              >
                <div className="flex items-center gap-2">
                  {attendanceData?.todayAttended ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      오늘 출석 완료!
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      출석체크하기
                    </>
                  )}
                </div>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
