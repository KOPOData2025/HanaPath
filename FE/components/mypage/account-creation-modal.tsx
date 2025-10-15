"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  ArrowLeft,
  ArrowRight,
  Wallet,
  TrendingUp,
  Shield,
  CheckCircle2,
  FileText,
  Lock,
  Star,
  Target,
  Zap,
  Trophy,
  Eye,
  EyeOff,
  Copy,
  Download,
  Users,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { createWallet, createInvestmentAccount } from "@/lib/api/wallet"
import { formatAccountNumber } from "@/lib/utils"
import TermsModal from "./terms-modal"

interface AccountCreationModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number
  accountType: "wallet" | "investment"
  onSuccess: () => void
}

interface StepProps {
  onNext: () => void
  onPrev: () => void
  data: FormData
  setData: (data: FormData) => void
  accountType: "wallet" | "investment"
  onOpenTerms?: (type: "service" | "privacy" | "financial") => void
}

interface FormData {
  accountPassword: string
  confirmPassword: string
  termsAgreed: boolean
  privacyAgreed: boolean
  serviceAgreed: boolean
}

const steps = [
  { id: 1, name: "상품 안내", icon: FileText },
  { id: 2, name: "약관 동의", icon: Shield },
  { id: 3, name: "비밀번호 설정", icon: Lock },
  { id: 4, name: "계좌 생성", icon: CheckCircle2 },
]

// 1단계: 상품 안내
function ProductIntroStep({ onNext, accountType }: StepProps) {
  const isWallet = accountType === "wallet"

  const benefits = isWallet ? [
    { icon: Zap, title: "실시간 잔액 확인", desc: "언제 어디서나 잔액을 확인하세요" },
    { icon: Shield, title: "안전한 송금", desc: "강력한 보안으로 안전하게 송금하세요" },
    { icon: Star, title: "목표 저축 관리", desc: "목표를 설정하고 달성해 봐요" },
    { icon: Target, title: "소비 패턴 분석", desc: "내 소비 패턴을 파악하고 관리해 봐요" },
  ] : [
    { icon: Zap, title: "실시간 주식 데이터", desc: "시장 데이터를 실시간으로 확인하세요" },
    { icon: Shield, title: "안전한 학습 환경", desc: "가상 자금으로 부담 없이 학습하세요" },
    { icon: Trophy, title: "포트폴리오 관리", desc: "나만의 포트폴리오를 만들어봐요" },
    { icon: Star, title: "투자 성과 분석", desc: "상세하게 수익률을 분석해 봐요" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
                  <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-xl ${
              isWallet 
                ? "bg-gradient-to-br from-teal-500 to-teal-700" 
                : "bg-gradient-to-br from-teal-500 to-teal-700"
            }`}
          >
          {isWallet ? (
            <Wallet className="w-10 h-10 text-white" />
          ) : (
            <TrendingUp className="w-10 h-10 text-white" />
          )}
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">
          {isWallet ? "디지털 지갑" : "모의 투자 계좌"}
        </h2>
        <p className="text-gray-600">
          {isWallet 
            ? "안전하고 편리한 디지털 지갑으로 용돈을 관리하세요" 
            : "실제 투자 전 모의 투자로 경험을 쌓아보세요"
          }
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`p-3 rounded-xl border ${
              isWallet ? "bg-teal-50 border-teal-100" : "bg-teal-50 border-teal-100"
            }`}
          >
            <div className="flex items-start gap-2">
              <benefit.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isWallet ? "text-teal-500" : "text-teal-500"
              }`} />
              <div className="min-w-0">
                <h3 className="font-medium text-sm mb-1 leading-tight">{benefit.title}</h3>
                <p className="text-xs text-gray-500 leading-tight">{benefit.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {accountType === "wallet" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1 text-sm">청소년 사용자 안내</h4>
              <p className="text-xs text-amber-700 leading-tight">
                만 19세 미만 사용자는 부모님과의 관계 승인 후 계좌를 개설할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      <Button onClick={onNext} className="w-full bg-teal-500 hover:bg-teal-600" size="lg">
        다음 단계 <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  )
}

// 2단계: 약관 동의
function TermsStep({ onNext, onPrev, data, setData, onOpenTerms }: StepProps) {
  const allAgreed = data.termsAgreed && data.privacyAgreed && data.serviceAgreed

  const handleAllAgree = (checked: boolean) => {
    setData({
      ...data,
      termsAgreed: checked,
      privacyAgreed: checked,
      serviceAgreed: checked,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <h2 className="text-xl font-bold mb-2">약관 및 동의사항</h2>
        <p className="text-gray-600">서비스 이용을 위한 약관에 동의해주세요</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-3 p-3">
            <Checkbox
              id="all-agree"
              checked={allAgreed}
              onCheckedChange={handleAllAgree}
            />
            <Label htmlFor="all-agree" className="font-medium">
              전체 약관에 동의합니다
            </Label>
          </div>

          <div className="space-y-3 pl-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="terms"
                  checked={data.termsAgreed}
                  onCheckedChange={(checked) => 
                    setData({ ...data, termsAgreed: checked as boolean })
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  서비스 이용약관 동의 <span className="text-red-500">(필수)</span>
                </Label>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onOpenTerms?.("service")}
              >
                보기
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="privacy"
                  checked={data.privacyAgreed}
                  onCheckedChange={(checked) => 
                    setData({ ...data, privacyAgreed: checked as boolean })
                  }
                />
                <Label htmlFor="privacy" className="text-sm">
                  개인정보 수집·이용 동의 <span className="text-red-500">(필수)</span>
                </Label>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onOpenTerms?.("privacy")}
              >
                보기
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="service"
                  checked={data.serviceAgreed}
                  onCheckedChange={(checked) => 
                    setData({ ...data, serviceAgreed: checked as boolean })
                  }
                />
                <Label htmlFor="service" className="text-sm">
                  금융서비스 약관 동의 <span className="text-red-500">(필수)</span>
                </Label>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onOpenTerms?.("financial")}
              >
                보기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" /> 이전
        </Button>
        <Button onClick={onNext} disabled={!allAgreed} className="flex-1 bg-teal-500 hover:bg-teal-600">
          다음 <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  )
}

// PIN 입력 컴포넌트
function PinInput({ 
  value, 
  onChange, 
  showValue, 
  placeholder,
  isActive = false
}: { 
  value: string
  onChange: (value: string) => void
  showValue: boolean
  placeholder: string 
  isActive?: boolean
}) {
  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={index}
          initial={{ scale: 1 }}
          animate={{ 
            scale: value[index] ? 1.05 : 1,
            borderColor: isActive && index === value.length ? '#475569' : '#e5e7eb'
          }}
          transition={{ duration: 0.2 }}
          className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-mono bg-white transition-all ${
            isActive && index === value.length 
              ? 'border-slate-500 shadow-lg' 
              : value[index] 
                ? 'border-teal-400 bg-teal-50' 
                : 'border-gray-200'
          }`}
        >
          <motion.span
            key={value[index] || 'empty'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {showValue ? (value[index] || "") : (value[index] ? "●" : "")}
          </motion.span>
        </motion.div>
      ))}
    </div>
  )
}

// 숫자 키패드 모달 컴포넌트
function NumericKeypadModal({ 
  isOpen,
  onClose,
  onNumberClick, 
  onBackspace, 
  onClear,
  currentInput,
  passwordLength,
  confirmLength
}: { 
  isOpen: boolean
  onClose: () => void
  onNumberClick: (num: string) => void
  onBackspace: () => void
  onClear: () => void
  currentInput: 'password' | 'confirm'
  passwordLength: number
  confirmLength: number
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {currentInput === 'password' ? '계좌 비밀번호 입력' : '비밀번호 확인 입력'}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-8 flex flex-col items-center">
          {/* 현재 입력 상태 표시 */}
          <div className="text-center space-y-4 w-full">
            <div className="text-sm text-gray-500">
              {currentInput === 'password' 
                ? `계좌 비밀번호 (${passwordLength}/4)` 
                : `비밀번호 확인 (${confirmLength}/4)`
              }
            </div>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    currentInput === 'password' 
                      ? (index < passwordLength ? 'bg-slate-600 border-slate-600' : 'border-gray-300')
                      : (index < confirmLength ? 'bg-teal-500 border-teal-500' : 'border-gray-300')
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 키패드 */}
          <div className="grid grid-cols-3 gap-4 max-w-sm justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onNumberClick(num.toString())
                  if (navigator.vibrate) {
                    navigator.vibrate(50)
                  }
                }}
                className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-xl font-semibold hover:bg-slate-50 hover:border-slate-400 hover:shadow-lg active:bg-slate-100 transition-all"
              >
                {num}
              </motion.button>
            ))}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onClear()
                if (navigator.vibrate) {
                  navigator.vibrate(100)
                }
              }}
              className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-300 hover:shadow-lg active:bg-red-100 transition-all"
            >
              Clear
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onNumberClick("0")
                if (navigator.vibrate) {
                  navigator.vibrate(50)
                }
              }}
              className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-xl font-semibold hover:bg-slate-50 hover:border-slate-400 hover:shadow-lg active:bg-slate-100 transition-all"
            >
              0
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onBackspace()
                if (navigator.vibrate) {
                  navigator.vibrate(30)
                }
              }}
              className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-lg font-medium hover:bg-orange-50 hover:border-orange-300 hover:shadow-lg active:bg-orange-100 transition-all flex items-center justify-center"
            >
              ⌫
            </motion.button>
          </div>

          <div className="text-center flex justify-center">
            <Button variant="outline" onClick={onClose} className="mt-4">
              닫기
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// 3단계: 비밀번호 설정
function PasswordStep({ onNext, onPrev, data, setData }: StepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [currentInput, setCurrentInput] = useState<'password' | 'confirm'>('password')
  const [keypadOpen, setKeypadOpen] = useState(false)

  const isValidPassword = data.accountPassword.length === 4 && /^\d{4}$/.test(data.accountPassword)
  const passwordsMatch = data.accountPassword === data.confirmPassword && data.confirmPassword.length > 0
  const bothComplete = data.accountPassword.length === 4 && data.confirmPassword.length === 4

  const handleNumberClick = (num: string) => {
    if (currentInput === 'password') {
      if (data.accountPassword.length < 4) {
        const newPassword = data.accountPassword + num
        setData({ ...data, accountPassword: newPassword })
        
        // 4자리가 되면 자동으로 확인 필드로 이동하고 키패드 닫기
        if (newPassword.length === 4) {
          setTimeout(() => {
            setCurrentInput('confirm')
            setKeypadOpen(false)
          }, 500)
        }
      }
    } else {
      if (data.confirmPassword.length < 4) {
        const newConfirm = data.confirmPassword + num
        setData({ ...data, confirmPassword: newConfirm })
        
        // 4자리가 되면 키패드 닫기
        if (newConfirm.length === 4) {
          setTimeout(() => {
            setKeypadOpen(false)
          }, 500)
        }
      }
    }
  }

  const handleBackspace = () => {
    if (currentInput === 'password') {
      setData({ ...data, accountPassword: data.accountPassword.slice(0, -1) })
    } else {
      setData({ ...data, confirmPassword: data.confirmPassword.slice(0, -1) })
    }
  }

  const handleClear = () => {
    if (currentInput === 'password') {
      setData({ ...data, accountPassword: '' })
    } else {
      setData({ ...data, confirmPassword: '' })
    }
  }

  const openKeypad = (inputType: 'password' | 'confirm') => {
    setCurrentInput(inputType)
    setKeypadOpen(true)
  }

  return (
    <>
      {/* 키패드 모달 */}
      <NumericKeypadModal
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        onNumberClick={handleNumberClick}
        onBackspace={handleBackspace}
        onClear={handleClear}
        currentInput={currentInput}
        passwordLength={data.accountPassword.length}
        confirmLength={data.confirmPassword.length}
      />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-bold mb-2">계좌 비밀번호 설정</h2>
          <p className="text-gray-600">계좌 거래 시 사용할 4자리 숫자 비밀번호를 설정하세요</p>
        </div>

        <div className="space-y-6">
          {/* 비밀번호 입력 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Label className="text-sm font-medium">
                계좌 비밀번호 <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div 
              onClick={() => openKeypad('password')}
              className="cursor-pointer transition-all hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 rounded-2xl p-4"
            >
              <PinInput
                value={data.accountPassword}
                onChange={(value) => setData({ ...data, accountPassword: value })}
                showValue={showPassword}
                placeholder="계좌 비밀번호"
                isActive={false}
              />
            </div>
            
            {data.accountPassword.length > 0 && !isValidPassword && (
              <p className="text-sm text-red-500 text-center">4자리 숫자를 입력해주세요</p>
            )}
          </div>

          {/* 비밀번호 확인 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Label className="text-sm font-medium">
                비밀번호 확인 <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div 
              onClick={() => openKeypad('confirm')}
              className="cursor-pointer transition-all hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 rounded-2xl p-4"
            >
              <PinInput
                value={data.confirmPassword}
                onChange={(value) => setData({ ...data, confirmPassword: value })}
                showValue={showConfirm}
                placeholder="비밀번호 확인"
                isActive={false}
              />
            </div>
            
            {/* 비밀번호 확인 메시지 */}
            {bothComplete && (
              <div className="text-center">
                {passwordsMatch ? (
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-sm text-teal-500 font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    비밀번호가 일치합니다
                  </motion.p>
                ) : (
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-sm text-red-500 font-medium flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    비밀번호가 일치하지 않습니다
                  </motion.p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1 text-sm">비밀번호 안전 수칙</h4>
              <ul className="text-xs text-blue-700 space-y-0.5">
                <li>• 생년월일, 전화번호 등 추측 가능한 번호는 피해주세요</li>
                <li>• 비밀번호는 안전한 곳에 보관하세요</li>
                <li>• 타인에게 절대 알려주지 마세요</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onPrev} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" /> 이전
          </Button>
          <Button onClick={onNext} disabled={!isValidPassword || !passwordsMatch} className="flex-1 bg-teal-500 hover:bg-teal-600">
            다음 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// 4단계: 계좌 생성 및 완료
function CompletionStep({ onPrev, data, accountType, userId, onSuccess, onAccountCreated }: StepProps & { userId: number, onSuccess: () => void, onAccountCreated: () => void }) {
  const [isCreating, setIsCreating] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{ accountNumber: string } | null>(null)

  const createAccount = async () => {
    setIsCreating(true)
    try {
      const accountData = {
        accountPassword: data.accountPassword,
        termsAgreed: data.termsAgreed && data.privacyAgreed && data.serviceAgreed,
      }

      console.log("계좌 생성 요청:", { userId, accountData, accountType })

      // 로딩 시간을 위한 딜레이 (2초)
      await new Promise(resolve => setTimeout(resolve, 2000))

      let result
      if (accountType === "wallet") {
        result = await createWallet(userId, accountData)
        console.log("지갑 생성 결과:", result)
      } else {
        result = await createInvestmentAccount(userId, accountData)
        console.log("투자 계좌 생성 결과:", result)
      }

      console.log("API 응답 상세:", result)
      console.log("계좌번호 확인:", result?.accountNumber)
      
      if (result && result.accountNumber) {
        console.log("계좌 생성 성공, 계좌번호:", result.accountNumber)
        setAccountInfo({ accountNumber: result.accountNumber })
        setIsCompleted(true)
        
        toast.success(
          accountType === "wallet" ? "디지털 지갑이 생성되었습니다!" : "모의 투자 계좌가 생성되었습니다!",
          {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
            className: "group border-emerald-100 bg-emerald-50/90 text-emerald-900"
          }
        )
        
        // 계좌 생성 성공 - 사용자가 명시적으로 행동할 때까지 모달 유지
        onAccountCreated()
      } else {
        console.error("API 응답에 계좌번호가 없음:", result)
        throw new Error(`계좌번호를 받지 못했습니다. 응답: ${JSON.stringify(result)}`)
      }
    } catch (error: any) {
      console.error("계좌 생성 오류:", error)
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || "계좌 생성에 실패했습니다"
      toast.error(errorMessage, {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        className: "group border-red-100 bg-red-50/90 text-red-900"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const copyAccountNumber = () => {
    if (accountInfo?.accountNumber) {
      const formattedNumber = formatAccountNumber(accountInfo.accountNumber, accountType)
      navigator.clipboard.writeText(formattedNumber)
      toast.success("계좌번호가 복사되었습니다", {
        icon: <Copy className="w-4 h-4" />
      })
    }
  }

  console.log("CompletionStep 렌더링 상태:", { 
    isCompleted, 
    accountInfo, 
    hasAccountNumber: !!accountInfo?.accountNumber,
    accountNumber: accountInfo?.accountNumber 
  })

  // 계좌 생성 완료 화면
  if (isCompleted && accountInfo?.accountNumber) {
    console.log("완료 화면 렌더링 - 계좌번호:", accountInfo.accountNumber)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 mx-auto bg-teal-100 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-teal-500" />
        </motion.div>

        <div>
                  <h2 className="text-2xl font-bold text-teal-500 mb-2">
          {accountType === "wallet" ? "디지털 지갑" : "모의 투자 계좌"} 개설 완료!
        </h2>
          <p className="text-gray-600">
            {accountType === "wallet" 
              ? "이제 안전하게 용돈을 관리할 수 있습니다" 
              : "모의 투자로 투자 경험을 쌓아보세요"
            }
          </p>
        </div>

        <Card className="bg-gradient-to-r from-slate-50 to-stone-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">새로운 계좌번호</h3>
              <Button variant="ghost" size="sm" onClick={copyAccountNumber}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-base font-mono font-bold text-center p-2 bg-white rounded-lg border">
              {formatAccountNumber(accountInfo.accountNumber, accountType)}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="flex-1" onClick={copyAccountNumber}>
            <Download className="w-4 h-4 mr-2" />
            계좌정보 복사
          </Button>
          <Button 
            className="flex-1 bg-teal-500 hover:bg-teal-600"
            onClick={() => {
              // 시작하기 버튼 클릭 시 마이페이지에 반영하고 모달 닫기
              onSuccess()
            }}
          >
            시작하기
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center">
          {accountType === "wallet" ? (
            <Wallet className="w-8 h-8 text-white" />
          ) : (
            <TrendingUp className="w-8 h-8 text-white" />
          )}
        </div>
        <h2 className="text-xl font-bold mb-2">
          {accountType === "wallet" ? "디지털 지갑" : "모의 투자 계좌"} 개설
        </h2>
        <p className="text-gray-600">입력하신 정보를 확인하고 계좌를 생성합니다</p>
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
            입력 정보 확인
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
            <span className="text-sm text-gray-600">계좌 유형</span>
            <span className="font-medium text-sm text-slate-800">
              {accountType === "wallet" ? "디지털 지갑" : "모의 투자 계좌"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
            <span className="text-sm text-gray-600">비밀번호</span>
            <span className="font-mono text-sm text-slate-800">{"●".repeat(4)}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
            <span className="text-sm text-gray-600">약관 동의</span>
            <span className="text-teal-500 text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              완료
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} disabled={isCreating} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" /> 이전
        </Button>
        <Button onClick={createAccount} disabled={isCreating} className="flex-1 bg-teal-500 hover:bg-teal-600">
          {isCreating ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
              생성 중...
            </>
          ) : (
            <>
              계좌 생성 <CheckCircle2 className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

export default function AccountCreationModal({
  isOpen,
  onClose,
  userId,
  accountType,
  onSuccess,
}: AccountCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    accountPassword: "",
    confirmPassword: "",
    termsAgreed: false,
    privacyAgreed: false,
    serviceAgreed: false,
  })
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [termsModalType, setTermsModalType] = useState<"service" | "privacy" | "financial">("service")
  const [isAccountCreated, setIsAccountCreated] = useState(false)

  const handleClose = () => {
    // 계좌가 생성된 상태라면 onSuccess 호출하여 마이페이지에 반영
    if (isAccountCreated) {
      onSuccess()
    }
    
    // 모달 상태 초기화
    setCurrentStep(1)
    setFormData({
      accountPassword: "",
      confirmPassword: "",
      termsAgreed: false,
      privacyAgreed: false,
      serviceAgreed: false,
    })
    setTermsModalOpen(false)
    setIsAccountCreated(false)
    onClose()
  }

  const handleOpenTerms = (type: "service" | "privacy" | "financial") => {
    setTermsModalType(type)
    setTermsModalOpen(true)
  }

  const renderStep = () => {
    const stepProps = {
      onNext: () => setCurrentStep(currentStep + 1),
      onPrev: () => setCurrentStep(currentStep - 1),
      data: formData,
      setData: setFormData,
      accountType,
      onOpenTerms: handleOpenTerms,
    }

    switch (currentStep) {
      case 1:
        return <ProductIntroStep {...stepProps} />
      case 2:
        return <TermsStep {...stepProps} />
      case 3:
        return <PasswordStep {...stepProps} />
      case 4:
        return <CompletionStep {...stepProps} userId={userId} onSuccess={onSuccess} onAccountCreated={() => setIsAccountCreated(true)} />
      default:
        return <ProductIntroStep {...stepProps} />
    }
  }

  return (
          <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
              {accountType === "wallet" ? (
                <Wallet className="w-6 h-6 text-teal-500" />
              ) : (
                <TrendingUp className="w-6 h-6 text-teal-500" />
              )}
            {accountType === "wallet" ? "디지털 지갑 개설" : "모의 투자 계좌 개설"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? "bg-teal-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-teal-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-500">
              {currentStep}단계 / {steps.length}단계 - {steps[currentStep - 1]?.name}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="py-6">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </DialogContent>
      
      {/* 약관 모달 */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        type={termsModalType}
        accountType={accountType}
      />
    </Dialog>
  )
}