"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  Plus,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
  Zap,
  Users,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  BatteryCharging,
} from "lucide-react"
import AccountCreationModal from "@/components/mypage/account-creation-modal"
import { toast } from "sonner"
import { getWallet, getInvestmentAccount, rechargeInvestmentAccount } from "@/lib/api/wallet"
import { formatAccountNumber } from "@/lib/utils"
import { getInvestmentRechargeAmount } from "@/lib/levels"

interface User {
  id: number
  name: string
  nickname: string | null
  email: string
  phone: string
  joinDate: string
  level: number
  currentExp: number
  nextLevelExp: number
  totalPoints: number
  hasWallet: boolean
  hasInvestmentAccount: boolean
  userType: "TEEN" | "PARENT"
  hasParentRelation?: boolean
}

interface AccountStatusCardsProps {
  user: User
  onAccountCreated: () => void
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: "easeOut" },
}

interface WalletInfo {
  accountNumber: string
  balance: number
  status: string
}

interface InvestmentAccountInfo {
  accountNumber: string
  balance: number
  totalProfitLoss: number
  status: string
}

export default function AccountStatusCards({
  user,
  onAccountCreated,
}: AccountStatusCardsProps) {
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false)
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [investmentInfo, setInvestmentInfo] = useState<InvestmentAccountInfo | null>(null)
  const [showWalletBalance, setShowWalletBalance] = useState(false)
  const [showInvestmentBalance, setShowInvestmentBalance] = useState(false)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [loadingInvestment, setLoadingInvestment] = useState(false)
  const [recharging, setRecharging] = useState(false)

  const canCreateAccount = user.userType === "PARENT" || user.hasParentRelation

  // 계좌 정보 로드
  useEffect(() => {
    if (user.hasWallet) {
      loadWalletInfo()
    } else {
      setWalletInfo(null)
    }
    
    if (user.hasInvestmentAccount) {
      loadInvestmentInfo()
    } else {
      setInvestmentInfo(null)
    }
  }, [user.hasWallet, user.hasInvestmentAccount])

  const loadWalletInfo = async () => {
    setLoadingWallet(true)
    try {
      const wallet = await getWallet(user.id)
      setWalletInfo({
        accountNumber: wallet.accountNumber,
        balance: wallet.balance,
        status: wallet.status
      })
    } catch (error) {
      console.error("지갑 정보 로드 실패:", error)
    } finally {
      setLoadingWallet(false)
    }
  }

  const handleRechargeInvestment = async () => {
    if (!user?.id) return
    const allowed = getInvestmentRechargeAmount(user.level)
    if (allowed <= 0) {
      toast.error("레벨 2 이상부터 재충전이 가능합니다")
      return
    }
    try {
      setRecharging(true)
      const res = await rechargeInvestmentAccount(user.id)
      const newBalance: number = Number(res?.balance ?? 0)
      setInvestmentInfo((prev) => (prev ? { ...prev, balance: newBalance } : prev))
      toast.success(`투자금 ${formatCurrency(allowed)}원이 충전되었습니다`)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "재충전에 실패했습니다"
      toast.error(msg)
    } finally {
      setRecharging(false)
    }
  }

  const loadInvestmentInfo = async () => {
    setLoadingInvestment(true)
    try {
      const account = await getInvestmentAccount(user.id)
      setInvestmentInfo({
        accountNumber: account.accountNumber,
        balance: account.balance,
        totalProfitLoss: account.totalProfitLoss,
        status: account.status
      })
    } catch (error) {
      console.error("투자 계좌 정보 로드 실패:", error)
    } finally {
      setLoadingInvestment(false)
    }
  }

  const copyAccountNumber = (accountNumber: string, type: 'wallet' | 'investment') => {
    const formattedNumber = formatAccountNumber(accountNumber, type)
    navigator.clipboard.writeText(formattedNumber)
    toast.success("계좌번호가 복사되었습니다", {
      icon: <Copy className="w-4 h-4" />
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const handleCreateWallet = () => {
    if (user.userType === "TEEN" && !user.hasParentRelation) {
      toast.error("부모님과의 관계 승인이 필요합니다", {
        icon: <Users className="w-5 h-5 text-amber-500" />,
        description: "마이페이지 > 설정 > 관계 정보 관리에서 부모님을 연결해주세요",
        className: "group border-amber-100 bg-amber-50/90 text-amber-900"
      })
      return
    }
    setWalletModalOpen(true)
  }

  const handleCreateInvestmentAccount = () => {
    if (user.userType === "TEEN" && !user.hasParentRelation) {
      toast.error("부모님과의 관계 승인이 필요합니다", {
        icon: <Users className="w-5 h-5 text-amber-500" />,
        description: "마이페이지 > 설정 > 관계 정보 관리에서 부모님을 연결해주세요",
        className: "group border-amber-100 bg-amber-50/90 text-amber-900"
      })
      return
    }
    setInvestmentModalOpen(true)
  }

  return (
    <>
      {/* 계좌 생성 모달들 */}
      <AccountCreationModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        userId={user.id}
        accountType="wallet"
        onSuccess={() => {
          setWalletModalOpen(false)
          setLoadingWallet(true) // 로딩 상태 시작
          onAccountCreated()
          // 새로 생성된 계좌 정보 로드
          setTimeout(() => {
            if (user.hasWallet) loadWalletInfo()
          }, 1000)
        }}
      />
      
      <AccountCreationModal
        isOpen={investmentModalOpen}
        onClose={() => setInvestmentModalOpen(false)}
        userId={user.id}
        accountType="investment"
        onSuccess={() => {
          setInvestmentModalOpen(false)
          setLoadingInvestment(true) // 로딩 상태 시작
          onAccountCreated()
          // 새로 생성된 계좌 정보 로드
          setTimeout(() => {
            if (user.hasInvestmentAccount) loadInvestmentInfo()
          }, 1000)
        }}
      />

      <motion.div variants={fadeInUp} className="mb-10">
        <div className="grid md:grid-cols-2 gap-6">
        {/* Wallet Status */}
        <motion.div variants={scaleIn} whileHover={{ y: -2 }}>
          <Card className="relative overflow-hidden shadow-lg border-0 bg-white/95 backdrop-blur-sm h-[280px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-200/20 to-stone-200/20 rounded-full -translate-y-12 translate-x-12" />
            <CardContent className="p-6 relative h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                    className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-md"
                  >
                    <Wallet className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1">
                      {user.userType === "PARENT" ? "하나은행" : "디지털 지갑"}
                    </h3>
                    {!user.hasWallet && (
                      <p className="text-slate-500 text-sm">
                        아직 {user.userType === "PARENT" ? "계좌" : "지갑"}이 없어요
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <img src="/hana-logo.png" alt="하나로고" className="w-8 h-8 opacity-60" />
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                {user.hasWallet ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-full space-y-3"
                  >
                    {loadingWallet ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-center text-slate-500"
                      >
                        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">계좌 정보 로딩중...</p>
                      </motion.div>
                    ) : walletInfo ? (
                      <div className="space-y-3">
                        <motion.div 
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.1, 
                            duration: 0.4, 
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                          className="bg-slate-50 rounded-lg p-4 border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-600 font-medium">계좌번호</span>
                            <button
                              onClick={() => copyAccountNumber(walletInfo.accountNumber, 'wallet')}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm font-mono text-slate-800">
                            {formatAccountNumber(walletInfo.accountNumber, 'wallet')}
                          </p>
                        </motion.div>
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.15, 
                            duration: 0.4, 
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                          className="bg-slate-50 rounded-lg p-4 border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-600 font-medium">잔액</span>
                            <button
                              onClick={() => setShowWalletBalance(!showWalletBalance)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showWalletBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                          <p className="text-lg font-semibold text-slate-800">
                            {showWalletBalance ? `${formatCurrency(walletInfo.balance)}원` : '••••••원'}
                          </p>
                        </motion.div>
                      </div>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-center"
                  >
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Wallet className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm mb-4">
                        {user.userType === "PARENT" ? "하나은행 계좌를 개설하고" : "디지털 지갑을 개설하고"}<br />
                        편리한 금융 서비스를 이용해보세요
                      </p>
                    </div>
                    <Button 
                      onClick={handleCreateWallet}
                      className="bg-teal-600 hover:bg-teal-700 shadow-md px-6 py-2 rounded-lg font-medium text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      개설하기
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Investment Account Status */}
        <motion.div variants={scaleIn} whileHover={{ y: -2 }}>
          <Card className="relative overflow-hidden shadow-lg border-0 bg-white/95 backdrop-blur-sm h-[280px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-stone-200/20 to-slate-200/20 rounded-full -translate-y-12 translate-x-12" />
            <CardContent className="p-6 relative h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                    className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-md"
                  >
                    <TrendingUp className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1">
                      {user.userType === "PARENT" ? "하나증권" : "모의 투자 계좌"}
                    </h3>
                    {!user.hasInvestmentAccount && (
                      <p className="text-slate-500 text-sm">
                        아직 {user.userType === "PARENT" ? "증권 계좌" : "투자 계좌"}가 없어요
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.hasInvestmentAccount && investmentInfo && investmentInfo.balance === 0 && (
                    <Button
                      onClick={handleRechargeInvestment}
                      disabled={getInvestmentRechargeAmount(user.level) === 0 || recharging}
                      className="h-9 px-3 rounded-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                    >
                      <BatteryCharging className="w-4 h-4" />
                      <span className="text-sm font-medium">  
                        {recharging
                          ? "충전 중..."
                          : getInvestmentRechargeAmount(user.level) === 0
                            ? "레벨 2부터"
                            : "재충전"}
                      </span>
                    </Button>
                  )}
                  <img src="/hana-logo.png" alt="하나로고" className="w-8 h-8 opacity-60" />
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                {user.hasInvestmentAccount ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-full space-y-3"
                  >
                    {loadingInvestment ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-center text-slate-500"
                      >
                        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">계좌 정보 로딩중...</p>
                      </motion.div>
                    ) : investmentInfo ? (
                      <div className="space-y-3">
                        <motion.div 
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.1, 
                            duration: 0.4, 
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                          className="bg-stone-50 rounded-lg p-4 border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-stone-600 font-medium">계좌번호</span>
                            <button
                              onClick={() => copyAccountNumber(investmentInfo.accountNumber, 'investment')}
                              className="text-stone-400 hover:text-stone-600 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm font-mono text-stone-800">
                            {formatAccountNumber(investmentInfo.accountNumber, 'investment')}
                          </p>
                        </motion.div>
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.15, 
                            duration: 0.4, 
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                          className="bg-stone-50 rounded-lg p-4 border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-stone-600 font-medium">투자금</span>
                            <button
                              onClick={() => setShowInvestmentBalance(!showInvestmentBalance)}
                              className="text-stone-400 hover:text-stone-600 transition-colors"
                            >
                              {showInvestmentBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                          <p className="text-lg font-semibold text-stone-800">
                            {showInvestmentBalance ? `${formatCurrency(investmentInfo.balance)}원` : '••••••원'}
                          </p>
                        </motion.div>
                      </div>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-center"
                  >
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-8 h-8 text-stone-400" />
                      </div>
                      <p className="text-slate-500 text-sm mb-4">
                        {user.userType === "PARENT" ? "하나증권 계좌를 개설하고" : "모의 투자 계좌를 개설하고"}<br />
                        투자 경험을 쌓아보세요
                      </p>
                    </div>
                    <Button 
                      onClick={handleCreateInvestmentAccount}
                      className="bg-teal-600 hover:bg-teal-700 shadow-md px-6 py-2 rounded-lg font-medium text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      개설하기
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
    </>
  )
} 