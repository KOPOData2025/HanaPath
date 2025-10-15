"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Plus, Trash2, CalendarIcon, TrendingUp, Edit3, PlusCircle, PlusSquare, CirclePlus } from "lucide-react"
import { AddGoalDialog } from "./add-goal-dialog"
import { format } from "date-fns"
import { getActiveSavingsGoals, deleteSavingsGoal, createSavingsGoal, SavingsGoal } from "@/lib/api/savings"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth"

export interface Goal {
  id: number
  name: string
  currentAmount: number
  targetAmount: number
  targetDate: Date
  startDate: Date
  monthlyTarget: number
  category: string
  paymentDay: number
  memo?: string
}

// 카테고리 색상 정의 (add-goal-dialog와 동일)
const categories = [
  { value: "티켓", label: "티켓", color: "bg-teal-500" },
  { value: "패션/뷰티", label: "패션/뷰티", color: "bg-pink-500" },
  { value: "전자기기", label: "전자기기", color: "bg-blue-500" },
  { value: "교육", label: "교육", color: "bg-purple-500" },
  { value: "여행", label: "여행", color: "bg-emerald-500" },
  { value: "선물", label: "선물", color: "bg-amber-500" },
  { value: "기타/취미", label: "기타/취미", color: "bg-slate-500" },
]

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
}

export function GoalSavings() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // 목표 목록 로드
  const loadGoals = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const savingsGoals = await getActiveSavingsGoals(user.id)
      const convertedGoals: Goal[] = savingsGoals.map(goal => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        targetDate: new Date(goal.targetDate),
        startDate: new Date(goal.startDate),
        monthlyTarget: goal.monthlyTarget,
        category: goal.category,
        paymentDay: goal.paymentDay,
        memo: goal.memo,
      }))
      setGoals(convertedGoals)
    } catch (error: any) {
      console.error('목표 목록 로드 실패:', error)
      // 목표가 없는 것은 정상적인 상황이므로 에러 토스트를 표시하지 않음
      // 실제 네트워크 오류나 서버 오류일 때만 토스트 표시
      if (error.response?.status >= 500) {
        toast.error('목표 목록을 불러오는데 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  // 사용자가 변경될 때마다 목표 목록 로드
  useEffect(() => {
    if (user?.id) {
      loadGoals()
    }
  }, [user?.id])

  // 날짜가 바뀔 때마다 현재 날짜 업데이트
  useEffect(() => {
    const updateDate = () => {
      const newDate = new Date()
      setCurrentDate(prevDate => {
        // 날짜가 실제로 바뀌었는지 확인
        if (prevDate.getDate() !== newDate.getDate() || 
            prevDate.getMonth() !== newDate.getMonth() || 
            prevDate.getFullYear() !== newDate.getFullYear()) {
          return newDate
        }
        return prevDate
      })
    }
    
    // 1분마다 체크
    const interval = setInterval(updateDate, 60000)
    
    return () => clearInterval(interval)
  }, [])



  const addGoal = async (name: string, targetAmount: number, targetDate: Date, category: string, paymentDay: number, memo?: string) => {
    if (!user?.id) return
    
    try {
      // API 호출하여 목표 생성
      await createSavingsGoal(user.id, {
        name,
        targetAmount,
        targetDate: targetDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
        paymentDay,
        category,
        memo: memo || '', // 메모 전달
      })
      
      // 목록 새로고침
      await loadGoals()
    } catch (error) {
      console.error('목표 생성 실패:', error)
      toast.error('목표 생성에 실패했습니다.')
      throw error // 에러를 다시 던져서 다이얼로그에서 처리할 수 있도록
    }
  }

  const deleteGoal = async (id: number) => {
    if (!user?.id) return
    
    try {
      await deleteSavingsGoal(user.id, id)
      setGoals(goals.filter((goal) => goal.id !== id))
      toast.success('목표가 삭제되었습니다.')
    } catch (error) {
      console.error('목표 삭제 실패:', error)
      toast.error('목표 삭제에 실패했습니다.')
    }
  }



  return (
    <>
      <motion.div variants={cardVariants}>
        <Card className="w-full overflow-hidden shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-teal-600/20"></div>
            <div className="relative z-10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">목표 저축</CardTitle>
                  <p className="text-slate-200 text-sm mt-1">꿈을 향한 첫 걸음을 시작해보세요</p>
                </div>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 border-0 shadow-none hover:shadow-none"
              >
                <PlusCircle className="h-10 w-10" strokeWidth={2.5} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-slate-500">목표를 불러오는 중...</p>
              </div>
            ) : goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100
              const remainingAmount = goal.targetAmount - goal.currentAmount
              
              // 정확한 남은 일수 계산
              const today = new Date(currentDate)
              today.setHours(0, 0, 0, 0)
              const targetDate = new Date(goal.targetDate)
              targetDate.setHours(0, 0, 0, 0)
              const daysLeft = Math.max(0, Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="group relative"
                >
                  <div 
                    className="bg-gradient-to-r from-slate-50 to-gray-50 p-5 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedGoal(goal)}
                  >
                    <div className="flex gap-6 items-start">
                      <div className="flex-shrink-0 w-48 h-48 flex items-center justify-center relative overflow-visible group">
                        {/* 원형 진행률 링 */}
                        <div className="absolute inset-0 w-full h-full overflow-visible">
                          <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 320 320">
                            {/* 배경 원 */}
                            <circle
                              cx="160"
                              cy="160"
                              r="162"
                              stroke="#e5e7eb"
                              strokeWidth="22"
                              fill="none"
                            />
                            {/* 진행률 원 */}
                            <circle
                              cx="160"
                              cy="160"
                              r="162"
                              stroke="#0d9488"
                              strokeWidth="22"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 165}`}
                              strokeDashoffset={`${2 * Math.PI * 165 * (1 - progress / 100)}`}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                        </div>
                        
                        <img 
                          src="/saving.png" 
                          alt="저축 목표" 
                          className="w-full h-full object-contain opacity-90 relative z-10"
                        />

                        {/* 호버 시 진행률 정보 - 말풍선 */}
                        <div className="absolute -top-9 -left-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                          <div className="bg-white rounded-lg px-3 py-2 shadow-lg relative">
                            <div className="text-sm font-bold text-teal-600">{progress.toFixed(1)}% 달성!</div>
                            <div className="text-xs text-slate-600">{remainingAmount.toLocaleString()}원 남았어요</div>
                            {/* 말풍선 꼬리 */}
                            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white transform rotate-45"></div>
                          </div>
                        </div>

                      </div>
                      <div className="flex-1 pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-lg text-slate-800">{goal.name}</span>
                              <span className={`text-xs text-white px-2 py-1 rounded-full ${categories.find(c => c.value === goal.category)?.color || 'bg-slate-500'}`}>
                                {goal.category}
                              </span>
                              <span className="text-xs text-white bg-slate-500 px-2 py-1 rounded-full shadow-sm">
                                D-{daysLeft}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-slate-500 gap-4 flex-wrap">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                <span>시작일: {format(goal.startDate, "yyyy년 MM월 dd일")}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                <span>목표일: {format(goal.targetDate, "yyyy년 MM월 dd일")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <span className="text-sm font-bold text-slate-700 block">
                                {goal.currentAmount.toLocaleString()}원
                              </span>
                              <span className="text-xs text-slate-500">/ {goal.targetAmount.toLocaleString()}원</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteGoal(goal.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-lg">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-sky-600 rounded-full"></div>
                                  <span className="text-xs font-medium text-sky-700">월 목표 저축액</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-sky-600">매월 {goal.paymentDay}일 납입</span>
                                  <span className="text-lg font-bold text-sky-800">{goal.monthlyTarget.toLocaleString()}원</span>
                                </div>
                              </div>
                            </div>
                            {goal.memo && (
                              <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <div className="text-xs text-slate-700">
                                  <span className="font-medium text-blue-700">메모</span>
                                  <p className="mt-1 leading-relaxed">{goal.memo}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {goals.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">아직 목표가 없어요</h3>
                <p className="text-slate-500 mb-4">첫 번째 저축 목표를 설정해보세요!</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AddGoalDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} onAddGoal={addGoal} />

      {/* Goal Details Modal */}
      {selectedGoal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedGoal(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-slate-800">{selectedGoal.name}</h3>
                <span className={`text-xs text-white px-2 py-1 rounded-full ${categories.find(c => c.value === selectedGoal.category)?.color || 'bg-slate-500'}`}>
                  {selectedGoal.category}
                </span>
              </div>
              {selectedGoal.memo && (
                <div className="flex items-start gap-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="text-xs text-slate-700">
                    <span className="font-medium text-blue-700">메모</span>
                    <p className="mt-1">{selectedGoal.memo}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-3 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-600">목표 달성률</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedGoal.currentAmount.toLocaleString()}원
                  </p>
                  <p className="text-xs text-slate-500">현재 금액</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-sm font-semibold text-slate-800">{selectedGoal.targetAmount.toLocaleString()}원</p>
                  <p className="text-xs text-slate-500">목표 금액</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-indigo-50 rounded-lg">
                  <p className="text-xs font-semibold text-indigo-600">
                    {format(selectedGoal.startDate, "MM/dd")}
                  </p>
                  <p className="text-xs text-slate-500">시작일</p>
                </div>
                <div className="text-center p-2 bg-indigo-50 rounded-lg">
                  <p className="text-xs font-semibold text-indigo-600">
                    {format(selectedGoal.targetDate, "MM/dd")}
                  </p>
                  <p className="text-xs text-slate-500">목표일</p>
                </div>
                <div className="text-center p-2 bg-teal-50 rounded-lg">
                  <p className="text-xs font-semibold text-teal-600">
                    {selectedGoal.paymentDay}일
                  </p>
                  <p className="text-xs text-slate-500">납입일</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedGoal(null)}>
                닫기
              </Button>
              <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700">
                <Edit3 className="w-3 h-3 mr-1" />
                수정
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
