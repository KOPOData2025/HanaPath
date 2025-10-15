"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Wallet, Users, Calendar as CalendarIcon2, DollarSign, Check, Baby, Bell, CreditCard, Lock, ArrowLeft, X, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"
import { cn, formatPhoneNumber, formatAccountNumber } from "@/lib/utils"
import { createAllowanceSchedule } from "@/lib/api/allowance"
import { getWalletBalance, validateWalletPassword } from "@/lib/api/wallet"

interface Child {
  id: number
  name: string
  nickname: string | null
  email: string
  phone: string
  level: number
}

interface AllowanceSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  parentId: number
  children: Child[]
}

export default function AllowanceSettingsModal({
  isOpen,
  onClose,
  parentId,
  children,
}: AllowanceSettingsModalProps) {
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [paymentDay, setPaymentDay] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [currentStep, setCurrentStep] = useState<"input" | "password" | "summary">("input")
  const [parentWalletInfo, setParentWalletInfo] = useState<{ accountNumber: string; balance: number } | null>(null)
  const [password, setPassword] = useState<string>("")
  const [isValidatingPassword, setIsValidatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string>("")

  // 자녀 목록 확인
  useEffect(() => {
    console.log("용돈 설정 모달 - 자녀 목록:", children)
    console.log("자녀 목록 길이:", children.length)
  }, [children])

  // 모달이 열릴 때마다 초기화 및 부모 지갑 정보 로드
  useEffect(() => {
    if (isOpen) {
      setSelectedChild("")
      setAmount("")
      setPaymentDay(undefined)
      setCurrentStep("input")
      setPassword("")
      setIsValidatingPassword(false)
      setPasswordError("")
      loadParentWalletInfo()
    }
  }, [isOpen, parentId])

  // 부모 지갑 정보 로드
  const loadParentWalletInfo = async () => {
    try {
      const walletInfo = await getWalletBalance(parentId)
      setParentWalletInfo(walletInfo)
    } catch (error) {
      console.error("부모 지갑 정보 로드 실패:", error)
      toast.error("부모 지갑 정보를 불러올 수 없습니다", {
        icon: <CreditCard className="w-4 h-4" />
      })
    }
  }

  const handleNext = () => {
    if (!selectedChild || !amount || !paymentDay) {
      toast.error("모든 필드를 입력해주세요", {
        icon: <CalendarIcon2 className="w-4 h-4" />
      })
      return
    }

    const numAmount = parseInt(amount.replace(/[^\d]/g, ""))
    if (numAmount < 1000) {
      toast.error("용돈은 최소 1,000원 이상이어야 합니다", {
        icon: <DollarSign className="w-4 h-4" />
      })
      return
    }

    setCurrentStep("password")
  }

  const handleBack = () => {
    if (currentStep === "password") {
      setCurrentStep("input")
      setPassword("")
      setIsValidatingPassword(false)
      setPasswordError("")
    } else if (currentStep === "summary") {
      setCurrentStep("password")
    }
  }

  const handlePasswordNext = async () => {
    if (password.length !== 4) {
      setPasswordError("비밀번호는 4자리여야 합니다")
      return
    }

    setIsValidatingPassword(true)
    setPasswordError("")

    try {
      const response = await validateWalletPassword(password)
      // API가 boolean을 반환하므로 true인지 확인
      if (response === true) {
        // 최소 1.5초 로딩 표시
        await new Promise(resolve => setTimeout(resolve, 1500))
        setCurrentStep("summary")
      } else {
        setPasswordError("비밀번호가 일치하지 않습니다")
        setPassword("")
      }
    } catch (error) {
      console.error("비밀번호 검증 실패:", error)
      setPasswordError("비밀번호가 일치하지 않습니다")
      setPassword("")
    } finally {
      setIsValidatingPassword(false)
    }
  }

  const handleSubmit = async () => {
    setIsCompleting(true)
    try {
      const numAmount = parseInt(amount.replace(/[^\d]/g, ""))
      
      // 실제 API 호출
      await createAllowanceSchedule({
        childId: parseInt(selectedChild),
        amount: numAmount,
        paymentDay: paymentDay ? paymentDay.getDate() : 1
      })

      // 최소 1.5초 로딩 표시
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success("용돈 설정이 완료되었습니다!", {
        icon: <Wallet className="w-4 h-4" />,
        description: (
          <div>
            {children.find(c => c.id.toString() === selectedChild)?.name}님에게
            매월 {paymentDay ? format(paymentDay, "d일") : ""}에<br />
            {numAmount.toLocaleString()}원이 지급됩니다.
          </div>
        )
      })
      
      onClose()
    } catch (error) {
      console.error("용돈 설정 실패:", error)
      const errorMessage = error instanceof Error ? error.message : "용돈 설정에 실패했습니다"
      toast.error(errorMessage, {
        icon: <CalendarIcon2 className="w-4 h-4" />
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numValue = value.replace(/[^\d]/g, "")
    if (numValue === "") return ""
    return parseInt(numValue).toLocaleString()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setAmount(formatted)
  }

  // 키패드 숫자 입력
  const handleKeypadInput = (num: string) => {
    if (password.length < 4) {
      setPassword(prev => prev + num)
      setPasswordError("")
    }
  }

  // 키패드 삭제
  const handleKeypadDelete = () => {
    setPassword(prev => prev.slice(0, -1))
    setPasswordError("")
  }

  // 키패드 초기화
  const handleKeypadClear = () => {
    setPassword("")
    setPasswordError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center"
            >
              <Wallet className="w-4 h-4 text-white" />
            </motion.div>
            용돈 설정
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            자녀에게 정기적으로 지급할 용돈을 설정하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {currentStep === "input" ? (
            <>
              {/* 부모 출금 계좌 정보 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  부모 출금 계좌
                </Label>
                {parentWalletInfo ? (
                  <div className="h-11 flex items-center justify-between bg-gray-50 rounded-lg px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-sky-800">하나은행</span>
                      <span className="text-sm text-sky-600">
                        {formatAccountNumber(parentWalletInfo.accountNumber, 'wallet')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      잔액: {parentWalletInfo.balance.toLocaleString()}원
                    </div>
                  </div>
                ) : (
                  <div className="h-11 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    부모 지갑 정보를 불러오는 중...
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  선택한 계좌에서 매월 자동으로 용돈이 출금됩니다
                </p>
              </div>

              {/* 자녀 선택 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  자녀 선택
                </Label>
                {children.length > 0 ? (
                  <Select value={selectedChild} onValueChange={setSelectedChild}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="용돈을 지급할 자녀를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                                        {children.map((child) => (
                    <SelectItem key={child.id} value={child.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{child.name}</span>
                        <span className="text-slate-500 text-sm">({formatPhoneNumber(child.phone)})</span>
                      </div>
                    </SelectItem>
                  ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-11 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-sm">
                    <Users className="w-4 h-4 mr-2" />
                    연결된 자녀가 없습니다
                  </div>
                )}
                {children.length === 0 && (
                  <p className="text-xs text-amber-600">
                    관계 정보 관리에서 자녀와 연결해주세요
                  </p>
                )}
              </div>

              {/* 용돈 금액 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-600" />
                  용돈 금액
                </Label>
                <div className="relative">
                  <Input
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="예: 50,000"
                    className="h-11 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                    원
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  최소 1,000원부터 설정 가능합니다
                </p>
              </div>

                        {/* 납입일 설정 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <CalendarIcon2 className="w-4 h-4 text-slate-600" />
              납입일
            </Label>
            <Select value={paymentDay ? paymentDay.getDate().toString() : ""} onValueChange={(value) => setPaymentDay(value ? new Date(2024, 0, parseInt(value)) : undefined)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="매월 납입일을 선택하세요">
                  {paymentDay ? `매월 ${paymentDay.getDate()}일` : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    매월 {day}일
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              선택한 날짜에 매월 자동으로 용돈이 지급됩니다
            </p>
          </div>
            </>
          ) : currentStep === "password" ? (
            /* 비밀번호 입력 단계 */
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* 헤더 */}
              <div className="text-center">
                                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.7, type: "spring", stiffness: 150, damping: 20 }}
                    className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md"
                  >
                    <Lock className="w-6 h-6 text-white" />
                  </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                  className="text-sm text-gray-600"
                >
                  하나은행 계좌 비밀번호를 입력해주세요
                </motion.p>
              </div>

              {/* 비밀번호 표시 */}
              <div className="space-y-2">
            
                <div className="h-12 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex gap-2">
                                         {password.split('').map((_, index) => (
                       <div
                         key={index}
                         className="w-3 h-3 rounded-full bg-sky-600"
                       />
                     ))}
                    {Array.from({ length: 4 - password.length }).map((_, index) => (
                      <div
                        key={index + password.length}
                        className="w-3 h-3 rounded-full bg-gray-300"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  4자리 숫자를 입력해주세요
                </p>
              </div>

              {/* 에러 메시지 */}
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{passwordError}</span>
                </motion.div>
              )}

              {/* 키패드 */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <motion.button
                      key={num}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleKeypadInput(num.toString())}
                      className="h-12 bg-white border border-gray-200 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {num}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleKeypadClear}
                    className="h-12 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5 mx-auto" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeypadInput("0")}
                    className="h-12 bg-white border border-gray-200 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    0
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleKeypadDelete}
                    className="h-12 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mx-auto" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* 설정 요약 */
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.25, 0.46, 0.45, 0.94],
                type: "spring",
                stiffness: 200,
                damping: 30
              }}
              className="relative"
            >
              {/* 메인 컨테이너 */}
                             <div className="bg-sky-50 rounded-xl p-4 shadow-md backdrop-blur-sm">
                {/* 상단 헤더 */}
                <div className="text-center mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.7, type: "spring", stiffness: 150, damping: 20 }}
                                         className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                    className="text-xs text-sky-600"
                  >
                    설정한 내용을 확인해주세요
                  </motion.p>
                </div>

                {/* 정보 카드들 */}
                <div className="space-y-3">
                  {/* 출금 계좌 */}
                  <motion.div
                    initial={{ opacity: 0, x: -25, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center shadow-sm">
                        <CreditCard className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-sky-600 uppercase tracking-wide mb-0.5">
                          출금 계좌
                        </p>
                        <p className="text-sm font-semibold text-sky-800">
                          하나은행 {parentWalletInfo ? formatAccountNumber(parentWalletInfo.accountNumber, 'wallet') : "로딩 중..."}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* 지급 대상 */}
                  <motion.div
                    initial={{ opacity: 0, x: -25, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center shadow-sm">
                        <Baby className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-sky-600 uppercase tracking-wide mb-0.5">
                          지급 대상
                        </p>
                        <p className="text-sm font-semibold text-sky-800">
                          {children.find(c => c.id.toString() === selectedChild)?.name}
                          <span className="text-sky-600 font-normal ml-1">
                            ({formatPhoneNumber(children.find(c => c.id.toString() === selectedChild)?.phone || '')})
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* 지급 일정 */}
                  <motion.div
                    initial={{ opacity: 0, x: -25, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center shadow-sm">
                        <CalendarIcon2 className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-sky-600 uppercase tracking-wide mb-0.5">
                          지급 일정
                        </p>
                        <p className="text-sm font-semibold text-sky-800">
                          매월 {paymentDay ? paymentDay.getDate() + "일" : ""} 자동 지급
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* 지급 금액 */}
                  <motion.div
                    initial={{ opacity: 0, x: -25, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center shadow-sm">
                        <DollarSign className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-sky-600 uppercase tracking-wide mb-0.5">
                          지급 금액
                        </p>
                        <p className="text-sm font-bold text-sky-800">
                          {amount}원
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* 하단 안내 */}
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.7, ease: "easeOut" }}
                  className="mt-4 relative overflow-hidden"
                >
                  {/* 배경 장식 */}
                  <div className="absolute inset-0 bg-sky-50 rounded-xl" />
                  <div className="absolute top-0 right-0 w-16 h-16 bg-sky-100/30 rounded-full -translate-y-8 translate-x-8" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-sky-100/20 rounded-full translate-y-6 -translate-x-6" />
                  
                  {/* 메인 컨텐츠 */}
                  <div className="relative p-4">
                    <div className="flex items-start gap-3">
                      <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 1.0, duration: 0.8, type: "spring", stiffness: 120, damping: 15 }}
                        className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0"
                      >
                        <Bell className="w-4 h-4 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <motion.p 
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
                          className="text-sm font-semibold text-sky-800 mb-1"
                        >
                          자동 지급 안내
                        </motion.p>
                        <motion.p 
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
                          className="text-xs text-sky-600 leading-relaxed"
                        >
                          매월 지정된 날짜에 자동으로 용돈이 지급됩니다.<br />
                          <span className="font-medium text-sky-700">설정 완료 후 즉시 적용</span>됩니다.
                        </motion.p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {currentStep === "input" ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                취소
              </Button>
              <Button
                onClick={handleNext}
                disabled={children.length === 0 || !selectedChild || !amount || !paymentDay}
                className="bg-sky-600 hover:bg-sky-700 px-6"
              >
                <Wallet className="w-4 h-4 mr-2" />
                다음
              </Button>
            </>
          ) : currentStep === "password" ? (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-6"
              >
                뒤로
              </Button>
              <Button
                onClick={handlePasswordNext}
                disabled={password.length !== 4 || isValidatingPassword}
                className="bg-sky-600 hover:bg-sky-700 px-6"
              >
                {isValidatingPassword ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    확인 중...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    확인
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isCompleting}
                className="px-6"
              >
                뒤로
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCompleting}
                className="bg-sky-600 hover:bg-sky-700 px-6"
              >
                {isCompleting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    설정 완료 중...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    용돈 설정 완료
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 