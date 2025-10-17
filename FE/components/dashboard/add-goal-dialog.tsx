"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { CalendarIcon, Target, Sparkles, ArrowRight, ArrowLeft, Check, Ticket, Gift, Headphones, Smartphone, Plane, Car, TrendingUp, BarChart3, Flag } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AddGoalDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onAddGoal: (name: string, targetAmount: number, targetDate: Date, category: string, paymentDay: number, memo?: string) => void
}

// 저축 기간 계산 유틸리티 함수
const calculateSavingsPeriod = (targetDate: Date, paymentDay: number) => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentDay = today.getDate()
  
  // 이번 달 납입일 계산
  const thisMonthPaymentDate = new Date(currentYear, currentMonth, paymentDay)
  
  // 이번 달 납입일이 지났는지 확인
  const isThisMonthPaymentPassed = today > thisMonthPaymentDate
  
  // 실제 저축 시작 월 (이번 달 납입일이 지났으면 다음 달부터)
  let startMonth = currentMonth
  let startYear = currentYear
  
  if (isThisMonthPaymentPassed) {
    startMonth = currentMonth + 1
    if (startMonth > 11) {
      startMonth = 0
      startYear = currentYear + 1
    }
  }
  
  // 목표 달성 월
  const targetYear = targetDate.getFullYear()
  const targetMonth = targetDate.getMonth()
  
  // 월 차이 계산 (목표월 - 시작월)
  const monthDiff = (targetYear - startYear) * 12 + (targetMonth - startMonth)
  
  // 목표일이 해당 월의 납입일보다 이전이면 해당 월은 제외
  const targetDay = targetDate.getDate()
  const effectiveMonths = targetDay < paymentDay ? Math.max(0, monthDiff) : Math.max(0, monthDiff + 1)
  
  // 디버깅용 로그
  console.log('저축 기간 계산:', {
    today: `${currentYear}-${currentMonth + 1}-${currentDay}`,
    targetDate: `${targetYear}-${targetMonth + 1}-${targetDay}`,
    paymentDay,
    isThisMonthPaymentPassed,
    startMonth: startMonth + 1,
    startYear,
    monthDiff,
    effectiveMonths
  })
  
  return {
    totalMonths: monthDiff + 1, // 전체 기간 (시작월 포함)
    effectiveMonths: effectiveMonths, // 실제 저축 월 수
    isThisMonthPaymentPassed
  }
}

const categories = [
  { value: "티켓", label: "티켓", icon: Ticket, color: "bg-teal-500" },
  { value: "패션/뷰티", label: "패션/뷰티", icon: Sparkles, color: "bg-pink-500" },
  { value: "전자기기", label: "전자기기", icon: Smartphone, color: "bg-blue-500" },
  { value: "교육", label: "교육", icon: Target, color: "bg-purple-500" },
  { value: "여행", label: "여행", icon: Plane, color: "bg-emerald-500" },
  { value: "선물", label: "선물", icon: Gift, color: "bg-amber-500" },
  { value: "기타/취미", label: "기타/취미", icon: Target, color: "bg-slate-500" },
]

const presetGoals = [
  { name: "콘서트 티켓", amount: 150000, category: "티켓", icon: Ticket },
  { name: "어버이날 선물", amount: 100000, category: "선물", icon: Gift },
  { name: "에어팟", amount: 200000, category: "전자기기", icon: Headphones },
]

type Step = "preset" | "custom" | "details" | "confirm"

export function AddGoalDialog({ isOpen, onOpenChange, onAddGoal }: AddGoalDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>("preset")
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [displayAmount, setDisplayAmount] = useState("")
  const [date, setDate] = useState<Date>()
  const [paymentDay, setPaymentDay] = useState<number>(1)
  const [category, setCategory] = useState("")
  const [memo, setMemo] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<typeof presetGoals[0] | null>(null)
  const [isSafari, setIsSafari] = useState(false)

  useEffect(() => {
    // Safari 브라우저 감지
    const userAgent = navigator.userAgent.toLowerCase()
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/chromium/.test(userAgent)
    setIsSafari(isSafariBrowser)
  }, [])

  const handlePresetSelect = (preset: typeof presetGoals[0]) => {
    setSelectedPreset(preset)
    setName(preset.name)
    setAmount(preset.amount.toString())
    setDisplayAmount(preset.amount.toLocaleString())
    setCategory(preset.category)
    setCurrentStep("details")
  }

  const handleCustomStart = () => {
    setCurrentStep("custom")
  }

  const handleNext = () => {
    if (currentStep === "custom") {
      setCurrentStep("details")
    } else if (currentStep === "details") {
      setCurrentStep("confirm")
    }
  }

  const handleBack = () => {
    if (currentStep === "custom") {
      setCurrentStep("preset")
    } else if (currentStep === "details") {
      setCurrentStep(selectedPreset ? "preset" : "custom")
    } else if (currentStep === "confirm") {
      setCurrentStep("details")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name && amount && date && category) {
      try {
        await onAddGoal(name, Number(amount), date, category, paymentDay, memo)
        resetForm()
        onOpenChange(false)
        
        toast.success(`${name}`, {
          description: "목표가 성공적으로 설정되었습니다!"
        })
      } catch (error) {
        console.error('목표 생성 실패:', error)
        toast.error('목표 생성에 실패했습니다.')
      }
    }
  }

  const resetForm = () => {
    setName("")
    setAmount("")
    setDisplayAmount("")
    setDate(undefined)
    setPaymentDay(1)
    setCategory("")
    setMemo("")
    setSelectedPreset(null)
    setCurrentStep("preset")
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const canProceed = () => {
    if (currentStep === "custom") {
      const can = name.trim() !== "" && amount.trim() !== "" && category !== ""
      console.log("Custom step can proceed:", can, { name: name.trim(), amount: amount.trim(), category })
      return can
    }
    if (currentStep === "details") {
      const can = name.trim() !== "" && amount.trim() !== "" && date && category !== ""
      console.log("Details step can proceed:", can, { name: name.trim(), amount: amount.trim(), date, category })
      return can
    }
    return true
  }

  const getStepIndicator = () => {
    const steps = selectedPreset ? ["preset", "details", "confirm"] : ["preset", "custom", "details", "confirm"]
    const currentIndex = steps.indexOf(currentStep)
    
    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
                            <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                    index <= currentIndex
                      ? "bg-teal-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
              {index < currentIndex ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
                              <div
                  className={cn(
                    "w-12 h-0.5 mx-2 transition-all duration-300",
                    index < currentIndex ? "bg-teal-600" : "bg-slate-200"
                  )}
                />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-[600px] max-h-[90vh] overflow-y-auto",
        isSafari 
          ? "animate-in fade-in-0 zoom-in-95 duration-500 ease-out" 
          : "animate-in fade-in-0 zoom-in-95 duration-400"
      )}>
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-800">새로운 저축 목표</DialogTitle>
          <DialogDescription className="text-slate-600">
            어떤 목표를 위해 저축하고 싶나요? 단계별로 설정해보세요.
          </DialogDescription>
        </DialogHeader>

        {getStepIndicator()}

        <AnimatePresence mode="wait">
          {currentStep === "preset" && (
            <motion.div
              key="preset"
              initial={isSafari ? 
                { opacity: 1, y: 0 } : 
                { opacity: 0, y: 20 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={isSafari ? 
                { opacity: 1, y: 0 } : 
                { opacity: 0, y: -20 }
              }
              transition={isSafari ? 
                { duration: 0 } : 
                {
                  duration: 0.3,
                  ease: "easeInOut",
                  type: "tween"
                }
              }
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">빠른 선택</h3>
                <p className="text-slate-600">자주 설정하는 목표를 빠르게 선택하세요</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {presetGoals.map((preset, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    initial={isSafari ? 
                      { opacity: 1, y: 0 } : 
                      { opacity: 0, y: 10 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={isSafari ? 
                      { duration: 0 } : 
                      {
                        delay: index * 0.1,
                        duration: 0.3,
                        ease: "easeInOut",
                        type: "tween"
                      }
                    }
                    onClick={() => handlePresetSelect(preset)}
                    className="p-3 text-center bg-slate-50 hover:bg-teal-50 rounded-lg border border-slate-200 hover:border-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <preset.icon className="w-4 h-4 text-teal-600" />
                      <div className="font-medium text-xs text-slate-800 leading-tight">{preset.name}</div>
                      <div className="text-xs text-slate-600 font-medium">{preset.amount.toLocaleString()}원</div>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${categories.find(c => c.value === preset.category)?.color}`} />
                        <span className="text-xs text-slate-500">{preset.category}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

                             <div className="pt-4">
                 <Button
                   onClick={handleCustomStart}
                   className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-white text-sm"
                 >
                   직접 입력하기
                 </Button>
               </div>
            </motion.div>
          )}

                    {currentStep === "custom" && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, x: isSafari ? 10 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSafari ? -10 : -20 }}
              transition={{ 
                duration: isSafari ? 0.2 : 0.3,
                ease: isSafari ? "easeOut" : "easeInOut",
                type: "tween"
              }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">목표 정보 입력</h3>
                <p className="text-slate-600 text-sm">원하는 목표의 정보를 입력해주세요</p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-lg p-4 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                      목표 이름
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 에어팟 프로"
                      className="h-9 border-slate-200 focus:border-teal-600 focus:ring-teal-600/20 transition-all duration-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memo" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                      메모
                    </Label>
                    <Input
                      id="memo"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="목표에 대한 메모 (선택사항)"
                      className="h-9 border-slate-200 focus:border-teal-600 focus:ring-teal-600/20 transition-all duration-200 bg-white"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                      카테고리
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-9 border-slate-200 focus:border-teal-600 focus:ring-teal-600/20 transition-all duration-200 bg-white">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                      목표 금액
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="text"
                        value={displayAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '')
                          setAmount(value)
                          setDisplayAmount(value ? Number(value).toLocaleString() : '')
                        }}
                        placeholder="1,000,000"
                        className="h-9 pr-12 border-slate-200 focus:border-teal-600 focus:ring-teal-600/20 transition-all duration-200 bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs">원</span>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: isSafari ? 10 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSafari ? -10 : -20 }}
              transition={{ 
                duration: isSafari ? 0.2 : 0.3,
                ease: isSafari ? "easeOut" : "easeInOut",
                type: "tween"
              }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">목표 기간 설정</h3>
                <p className="text-slate-600 text-sm">목표 달성 날짜와 납입일을 설정해주세요</p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-lg p-4 border border-slate-100">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                        목표 날짜
                      </Label>
                      <Popover modal={isSafari}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-10 justify-start text-left font-normal border-slate-200 hover:border-teal-600 focus:border-teal-600 focus:ring-teal-600/20 transition-all duration-200 bg-white",
                              !date && "text-slate-400",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "yyyy년 MM월 dd일") : "날짜를 선택하세요"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-auto p-0"
                          align="center"
                          side="left"
                          sideOffset={43}
                          avoidCollisions={false}
                          style={isSafari ? { 
                            zIndex: 99999,
                            WebkitTransform: 'translateZ(0)',
                            transform: 'translateZ(0)'
                          } : undefined}
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="rounded-md border shadow-lg bg-white"
                            style={{
                              width: '280px',
                              fontSize: '14px'
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                        납입일
                      </Label>
                      <Select value={paymentDay.toString()} onValueChange={(value) => setPaymentDay(Number(value))}>
                        <SelectTrigger className="h-10 border-slate-200 focus:border-teal-600 focus:ring-teal-600/20 transition-all duration-200 bg-white">
                          <SelectValue placeholder="납입일 선택" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              매월 {day}일
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {amount && date && (
                    <motion.div
                      initial={{ opacity: 0, y: isSafari ? 5 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: isSafari ? 0.2 : 0.3,
                        ease: isSafari ? "easeOut" : "easeInOut",
                        type: "tween"
                      }}
                      className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-lg p-3"
                    >

                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-md p-2">
                          <div className="text-center">
                            <div className="text-slate-600 text-xs mb-1">저축 기간</div>
                            <div className="text-base font-bold text-slate-800">
                              {(() => {
                                const { effectiveMonths } = calculateSavingsPeriod(date!, paymentDay)
                                return effectiveMonths
                              })()}개월
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-md p-2">
                          <div className="text-center">
                            <div className="text-slate-600 text-xs mb-1">월 저축액</div>
                            <div className="text-base font-bold text-slate-800">
                              {(() => {
                                const { effectiveMonths } = calculateSavingsPeriod(date!, paymentDay)
                                return Math.ceil(Number(amount) / Math.max(1, effectiveMonths)).toLocaleString()
                              })()}원
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                                                  <p className="text-blue-600 text-xs font-medium">
                            {(() => {
                              const { effectiveMonths } = calculateSavingsPeriod(date!, paymentDay)
                              const monthlyAmount = Math.ceil(Number(amount) / Math.max(1, effectiveMonths))
                              
                              return `총 ${effectiveMonths}개월 동안 매월 ${monthlyAmount.toLocaleString()}원씩 저축하면 목표 달성해요!`
                            })()}
                          </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: isSafari ? 10 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSafari ? -10 : -20 }}
              transition={{ 
                duration: isSafari ? 0.2 : 0.3,
                ease: isSafari ? "easeOut" : "easeInOut",
                type: "tween"
              }}
              className="space-y-6"
            >
                            <div className="text-center mb-3">
                <h3 className="text-base font-semibold text-slate-800 mb-1">목표 확인</h3>
                <p className="text-slate-500 text-xs">설정한 목표를 확인해주세요</p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-lg p-3 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-bold text-slate-800">{name}</h4>
                  <span className={`text-xs text-white px-2 py-0.5 rounded-full ${categories.find(c => c.value === category)?.color}`}>{category}</span>
                  {memo && <span className="text-xs text-slate-400">• {memo}</span>}
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-xs text-slate-600">목표 금액</span>
                    <span className="text-sm text-slate-800">{Number(amount).toLocaleString()}원</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-xs text-slate-600">저축 기간</span>
                    <span className="text-sm text-slate-800">
                      {date ? (() => {
                        const { effectiveMonths } = calculateSavingsPeriod(date, paymentDay)
                        return effectiveMonths
                      })() : 0}개월
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-slate-600">납입일</span>
                    <span className="text-sm text-slate-800">매월 {paymentDay}일</span>
                  </div>
                </div>

                <div className="bg-white rounded-md p-2 mb-3 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1 font-medium">저축 기간</div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1 pl-2">
                      <div className="text-xs text-slate-400 mb-1">시작일</div>
                      <div className="text-sm font-semibold text-slate-700">{format(new Date(), "MM월 dd일")}</div>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="w-8 h-px bg-gradient-to-r from-slate-300 to-teal-300 relative">
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="text-center flex-1 pr-2">
                      <div className="text-xs text-slate-400 mb-1">목표일</div>
                      <div className="text-sm font-semibold text-slate-700">{date ? format(date, "MM월 dd일") : ""}</div>
                    </div>
                  </div>
                </div>

                {amount && date && (
                  <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                    월 {date ? (() => {
                      const { effectiveMonths } = calculateSavingsPeriod(date, paymentDay)
                      return Math.ceil(Number(amount) / Math.max(1, effectiveMonths)).toLocaleString()
                    })() : "0"}원씩 저축하면 목표 달성!
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="gap-3 pt-6">
          {currentStep !== "preset" && (
            <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>
          )}
          

          
          {currentStep !== "preset" && currentStep !== "confirm" && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          {currentStep === "confirm" && (
            <Button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              목표 저장
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
