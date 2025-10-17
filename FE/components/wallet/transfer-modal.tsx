"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Send, User, Phone, CreditCard, ChevronRight, CheckCircle, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn, formatPhoneNumber, formatAccountNumberInput, formatAccountNumber } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth"
import { searchRecipient, transferMoney, validateWalletPassword } from "@/lib/api/wallet"

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onTransferComplete?: () => void
}

interface UserInfo {
  id: number
  name: string
  phone: string
  accountNumber?: string
}

export default function TransferModal({ isOpen, onClose, onTransferComplete }: TransferModalProps) {
  const [step, setStep] = useState<"recipient" | "amount" | "memo" | "password" | "confirm">("recipient")
  const [recipientType, setRecipientType] = useState<"phone" | "account">("phone")
  const [recipientInput, setRecipientInput] = useState("")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [recipientInfo, setRecipientInfo] = useState<UserInfo | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const { user, token } = useAuthStore()



  useEffect(() => {
    if (isOpen) {
      loadWalletBalance()
    }
  }, [isOpen])

  const loadWalletBalance = async () => {
    try {
      if (!user?.id) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/${user.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWalletBalance(data.balance)
      }
    } catch (error) {
      console.error("잔액 로드 실패:", error)
    }
  }

  const searchRecipientUser = async () => {
    if (!recipientInput.trim()) {
      toast.error("전화번호 또는 계좌번호를 입력해주세요.", {
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
      return
    }

    try {
      setSearching(true)
      
      // 하이픈 제거 후 API 호출
      const cleanInput = recipientInput.replace(/[^0-9]/g, '')
      const userData = await searchRecipient(recipientType, cleanInput)
      
      setRecipientInfo(userData)
      
    } catch (error) {
      console.error("수신자 검색 실패:", error)
      toast.error("수신자를 찾을 수 없습니다.", {
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
      setRecipientInfo(null)
    } finally {
      setSearching(false)
    }
  }

  const handleKeypadInput = (value: string) => {
    if (value === 'backspace') {
      setPassword(prev => prev.slice(0, -1))
    } else if (password.length < 4) {
      setPassword(prev => prev + value)
    }
  }

  const handleNextStep = async () => {
    if (step === "recipient") {
      if (!recipientInfo) {
        toast.error("수신자를 먼저 검색해주세요.", {
          style: {
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '15px',
            fontWeight: '600',
          },
          className: 'font-medium',
        })
        return
      }
      setStep("amount")
    } else if (step === "amount") {
      if (!amount || parseInt(amount) <= 0) {
        toast.error("송금 금액을 입력해주세요.", {
          style: {
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '15px',
            fontWeight: '600',
          },
          className: 'font-medium',
        })
        return
      }
      if (parseInt(amount) > walletBalance) {
        toast.error("잔액이 부족합니다.", {
          style: {
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '15px',
            fontWeight: '600',
          },
          className: 'font-medium',
        })
        return
      }
      setStep("memo")
    } else if (step === "memo") {
      setStep("password")
    } else if (step === "password") {
      if (password.length !== 4) {
        toast.error("4자리 비밀번호를 입력해주세요.", {
          style: {
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '15px',
            fontWeight: '600',
          },
          className: 'font-medium',
        })
        return
      }
      
      // 비밀번호 검증
      try {
        setLoading(true)
        
        // 실제 검증 전에 1.5초 지연 추가
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const isValid = await validateWalletPassword(password)
        
        if (isValid) {
          setStep("confirm")
        } else {
          toast.error("비밀번호가 일치하지 않습니다.", {
            description: "올바른 비밀번호를 입력해주세요.",
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              fontSize: '15px',
              fontWeight: '600',
            },
            className: 'font-medium',
          })
          setPassword("")
        }
      } catch (error) {
        console.error("비밀번호 검증 실패:", error)
        toast.error("비밀번호가 일치하지 않습니다.", {
          description: "올바른 비밀번호를 입력해주세요.",
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '15px',
            fontWeight: '600',
          },
          className: 'font-medium',
        })
        setPassword("")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleTransfer = async () => {
    if (!recipientInfo) {
      toast.error("수신자 정보가 없습니다.", {
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
      return
    }

    try {
      setLoading(true)
      
      // 실제 API 호출
      await transferMoney({
        recipientId: recipientInfo.id,
        amount: parseInt(amount),
        password: password,
        description: memo.trim() ? `${recipientInfo.name}님에게 송금 - ${memo}` : `${recipientInfo.name}님에게 송금`
      })
      
      // 용돈 요청 모달과 비슷한 로딩 시간을 위해 지연 추가
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("송금이 완료되었습니다!", {
        description: `${recipientInfo.name}님에게 ${parseInt(amount).toLocaleString()}원을 송금했습니다.`,
        duration: 5000,
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
      
      // 모달 초기화 및 닫기
      resetModal()
      onTransferComplete?.()
      onClose()
      
    } catch (error) {
      console.error("송금 실패:", error)
      toast.error("송금에 실패했습니다.", {
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep("recipient")
    setRecipientType("phone")
    setRecipientInput("")
    setAmount("")
    setMemo("")
    setPassword("")
    setRecipientInfo(null)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const formatAmount = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '')
    return numValue ? parseInt(numValue).toLocaleString() : ''
  }

  const parseAmount = (value: string) => {
    return value.replace(/[^0-9]/g, '')
  }

  // 입력값 포맷팅 처리
  const handleRecipientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    let formattedValue = ''
    
    if (recipientType === 'phone') {
      formattedValue = formatPhoneNumber(value)
    } else {
      formattedValue = formatAccountNumberInput(value, 'wallet')
    }
    
    setRecipientInput(formattedValue)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-teal-500" />
            송금하기
          </DialogTitle>
          <DialogDescription>
            전화번호 또는 계좌번호로 송금할 수 있습니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <AnimatePresence mode="wait">
            {step === "recipient" && (
              <motion.div
                key="recipient"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 단계 표시 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-sm font-medium text-teal-600">수신자</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-sm font-medium text-gray-500">금액</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-sm font-medium text-gray-500">메모</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <span className="text-sm font-medium text-gray-500">확인</span>
                  </div>
                </div>

                {/* 수신자 타입 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">수신자 검색 방법</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRecipientType("phone")
                        setRecipientInput("")
                        setRecipientInfo(null)
                      }}
                      className={cn(
                        "flex-1",
                        recipientType === "phone" 
                          ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-600 hover:border-teal-600 hover:text-white" 
                          : ""
                      )}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      전화번호
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRecipientType("account")
                        setRecipientInput("")
                        setRecipientInfo(null)
                      }}
                      className={cn(
                        "flex-1",
                        recipientType === "account" 
                          ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-600 hover:border-teal-600 hover:text-white" 
                          : ""
                      )}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      계좌번호
                    </Button>
                  </div>
                </div>

                {/* 수신자 입력 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {recipientType === "phone" ? "전화번호" : "계좌번호"}
                  </label>
                  <div className="flex gap-2">
                                         <Input
                       placeholder={recipientType === "phone" ? "010-1234-5678" : "620-123456-78901"}
                       value={recipientInput}
                       onChange={handleRecipientInputChange}
                       className="flex-1"
                     />
                    <Button
                      onClick={searchRecipientUser}
                      disabled={!recipientInput.trim() || searching}
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600 hover:border-teal-700 transition-all duration-200"
                    >
                      {searching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        "검색"
                      )}
                    </Button>
                  </div>
                </div>

                {/* 수신자 정보 표시 */}
                {recipientInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-teal-100">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="bg-teal-500 text-white font-semibold text-sm">
                          {recipientInfo.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-grow space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base text-gray-800">{recipientInfo.name}</p>
                          <div className="flex items-center gap-1 px-2 py-1 bg-teal-100 rounded-full">
                            <CheckCircle className="w-3 h-3 text-teal-600" />
                            <span className="text-xs font-medium text-teal-700">확인됨</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="w-3 h-3 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">전화번호</p>
                              <p className="text-xs font-semibold text-gray-700">{formatPhoneNumber(recipientInfo.phone)}</p>
                            </div>
                          </div>
                          
                          {recipientInfo.accountNumber && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                <CreditCard className="w-3 h-3 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">계좌번호</p>
                                <p className="text-xs font-semibold text-gray-700 font-mono">{formatAccountNumber(recipientInfo.accountNumber, 'wallet')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === "amount" && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 단계 표시 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-sm font-medium text-gray-500">수신자</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-sm font-medium text-teal-600">금액</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-sm font-medium text-gray-500">메모</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <span className="text-sm font-medium text-gray-500">확인</span>
                  </div>
                </div>

                {/* 수신자 정보 */}
                {recipientInfo && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">송금 대상</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{recipientInfo.name}</p>
                  </div>
                )}

                {/* 금액 입력 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">송금 금액</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="0"
                      value={formatAmount(amount)}
                      onChange={(e) => setAmount(parseAmount(e.target.value))}
                      className="text-right text-lg font-bold pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      원
                    </span>
                  </div>
                </div>

                {/* 잔액 정보 */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">현재 잔액</span>
                    <span className="text-sm font-semibold text-blue-800">
                      {walletBalance.toLocaleString()}원
                    </span>
                  </div>
                  {amount && parseInt(amount) > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-blue-700">송금 후 잔액</span>
                      <span className="text-sm font-semibold text-blue-800">
                        {(walletBalance - parseInt(amount)).toLocaleString()}원
                      </span>
                    </div>
                  )}
                </div>

                {/* 빠른 금액 버튼 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">빠른 금액</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5000, 10000, 20000, 30000, 40000, 50000].map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="text-xs"
                      >
                        {quickAmount.toLocaleString()}원
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === "memo" && (
              <motion.div
                key="memo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 단계 표시 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-sm font-medium text-gray-500">수신자</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-sm font-medium text-gray-500">금액</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-sm font-medium text-teal-600">메모</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <span className="text-sm font-medium text-gray-500">확인</span>
                  </div>
                </div>

                {/* 송금 정보 요약 */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">수신자</span>
                        <span className="text-sm font-medium">{recipientInfo?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">송금 금액</span>
                        <span className="text-sm font-bold text-red-600">
                          {parseInt(amount).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 메모 입력 */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">송금 메모 (선택사항)</label>
                  <textarea
                    placeholder="송금 목적이나 메모를 입력하세요 (예: 생일선물, 용돈, 점심값 등)"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    rows={3}
                    maxLength={100}
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>거래 내역에서 확인할 수 있습니다</span>
                    <span>{memo.length}/100</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 단계 표시 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-sm font-medium text-gray-500">수신자</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-sm font-medium text-gray-500">금액</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-sm font-medium text-gray-500">메모</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <span className="text-sm font-medium text-teal-600">확인</span>
                  </div>
                </div>

                {/* 송금 정보 요약 */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">수신자</span>
                        <span className="text-sm font-medium">{recipientInfo?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">송금 금액</span>
                        <span className="text-sm font-bold text-red-600">
                          {parseInt(amount).toLocaleString()}원
                        </span>
                      </div>
                      {memo.trim() && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">메모</span>
                          <span className="text-sm text-gray-700 max-w-[200px] truncate">
                            {memo}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 비밀번호 입력 상태 */}
                <div className="text-center space-y-4">
                  <div className="text-sm text-gray-500">
                    전자지갑 비밀번호 ({password.length}/4)
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                          index < password.length ? 'bg-teal-600 border-teal-600' : 'border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 키패드 */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-4 w-fit">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <motion.button
                        key={num}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          handleKeypadInput(num.toString())
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
                        setPassword("")
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
                        handleKeypadInput("0")
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
                        handleKeypadInput('backspace')
                        if (navigator.vibrate) {
                          navigator.vibrate(30)
                        }
                      }}
                      className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-lg font-medium hover:bg-orange-50 hover:border-orange-300 hover:shadow-lg active:bg-orange-100 transition-all flex items-center justify-center"
                    >
                      ⌫
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 최종 확인 */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                    <Send className="w-8 h-8 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">송금 확인</h3>
                    <p className="text-sm text-gray-600">아래 정보로 송금하시겠습니까?</p>
                  </div>
                </div>

                <Card className="bg-gray-50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">수신자</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback className="text-xs">
                            {recipientInfo?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{recipientInfo?.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">송금 금액</span>
                      <span className="text-lg font-bold text-red-600">
                        {parseInt(amount).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">수수료</span>
                      <span className="text-sm text-gray-600">무료</span>
                    </div>
                    {memo.trim() && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">메모</span>
                        <span className="text-sm text-gray-700 max-w-[200px] truncate">
                          {memo}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">송금 후 잔액</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {(walletBalance - parseInt(amount)).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex gap-2">
          {step === "recipient" ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!recipientInfo}
                className="bg-teal-500 hover:bg-teal-600"
              >
                다음
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : step === "amount" ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep("recipient")}
              >
                이전
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!amount || parseInt(amount) <= 0 || parseInt(amount) > walletBalance}
                className="bg-teal-500 hover:bg-teal-600"
              >
                다음
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : step === "memo" ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep("amount")}
              >
                이전
              </Button>
              <Button 
                onClick={handleNextStep}
                className="bg-teal-500 hover:bg-teal-600"
              >
                다음
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : step === "password" ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep("memo")}
              >
                이전
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={password.length !== 4 || loading}
                className="bg-teal-500 hover:bg-teal-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    검증 중...
                  </>
                ) : (
                  <>
                    다음
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep("password")}
                disabled={loading}
              >
                이전
              </Button>
              <Button 
                onClick={handleTransfer}
                disabled={loading}
                className="bg-teal-500 hover:bg-teal-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    송금 중...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    송금하기
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 