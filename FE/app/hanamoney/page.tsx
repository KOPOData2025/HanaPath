"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowRight, Award, CalendarCheck, ShoppingCart, Banknote, ChevronLeft, PiggyBank, Search, ChevronRight, Filter, Calendar, AlertCircle, CheckCircle, X, List, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn, formatAccountNumber } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { hanaMoneyApi } from "@/lib/api/hanamoney"
import { HanaMoneyDto, HanaMoneyTransactionDto } from "@/types/hanamoney"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const categoryColors: Record<string, string> = {
  출석: "bg-blue-100 text-blue-800",
  퀴즈: "bg-purple-100 text-purple-800",
  스토어: "bg-amber-100 text-amber-800",
  이벤트: "bg-green-100 text-green-800",
  이체: "bg-rose-100 text-rose-800",
  카페: "bg-emerald-100 text-emerald-800",
  상품권: "bg-indigo-100 text-indigo-800",
  영화: "bg-pink-100 text-pink-800",
  디저트: "bg-orange-100 text-orange-800",
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

interface WalletInfo {
  accountNumber: string
  balance: number
  status: string
}

export default function HanaMoneyPage() {
  const [activeTab, setActiveTab] = useState("history")
  const [transferAmount, setTransferAmount] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [hanaMoney, setHanaMoney] = useState<HanaMoneyDto | null>(null)
  const [transactions, setTransactions] = useState<HanaMoneyTransactionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [pageSize] = useState(10)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [transferLoading, setTransferLoading] = useState(false)
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [transferResult, setTransferResult] = useState<{amount: string, newBalance: string} | null>(null)
  const { toast } = useToast()
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()

  // 출석 체크 핸들러
  const handleAttendanceCheck = () => {
    router.push('/')
  }

  // 스토어 페이지 이동 핸들러
  const handleStoreClick = () => {
    router.push('/store')
  }

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
  }, [isLoggedIn, router])

  const userId = user?.id

  useEffect(() => {
    if (userId) {
      loadHanaMoneyData()
      loadWalletInfo()
    }
  }, [userId, currentPage, pageSize])

  const loadHanaMoneyData = async () => {
    try {
      setLoading(true)
      
      // 하나머니 정보 로드
      const hanaMoneyResponse = await hanaMoneyApi.getHanaMoney()
      if (hanaMoneyResponse.data) {
        setHanaMoney(hanaMoneyResponse.data)
      } else if (hanaMoneyResponse.error) {
        toast({
          title: "오류",
          description: hanaMoneyResponse.error,
          variant: "destructive",
        })
      }

      // 거래 내역 로드
      const transactionsResponse = await hanaMoneyApi.getTransactions(currentPage, pageSize)
      if (transactionsResponse.data) {
        setTransactions(transactionsResponse.data.content)
        setTotalPages(transactionsResponse.data.totalPages)
        setTotalElements(transactionsResponse.data.totalElements)
      } else if (transactionsResponse.error) {
        toast({
          title: "오류",
          description: transactionsResponse.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("하나머니 데이터 로드 실패:", error)
      toast({
        title: "오류",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadWalletInfo = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token || !userId) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/${userId}/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWalletInfo(data)
      }
    } catch (error) {
      console.error("전자 지갑 정보 로드 실패:", error)
    }
  }

  // 전액 버튼 클릭 핸들러
  const handleFullAmount = () => {
    if (hanaMoney) {
      setTransferAmount(hanaMoney.balance.toString())
    }
  }

  // 이체 확인 모달 열기
  const handleTransferClick = () => {
    console.log("이체 버튼 클릭됨")
    console.log("walletInfo:", walletInfo)
    
    if (!walletInfo) {
      toast({
        title: "전자 지갑 없음",
        description: "전자 지갑을 먼저 생성해주세요.",
        variant: "destructive",
      })
      return
    }

    // 이체 금액 초기화
    setTransferAmount("")
    setShowTransferModal(true)
    console.log("이체 모달 열기 완료")
  }

  // 실제 이체 실행
  const handleTransferConfirm = async () => {
    if (!userId) {
      toast({
        title: "사용자 정보 없음",
        description: "사용자 정보를 찾을 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    if (!walletInfo) {
      toast({
        title: "전자 지갑 없음",
        description: "전자 지갑을 먼저 생성해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!transferAmount || parseFloat(transferAmount) < 1000) {
      toast({
        title: "오류",
        description: "최소 1,000P부터 이체 가능합니다.",
        variant: "destructive",
      })
      return
    }

    if (hanaMoney && parseFloat(transferAmount) > parseFloat(hanaMoney.balance)) {
      toast({
        title: "잔액 부족",
        description: "보유한 포인트보다 많은 금액을 이체할 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    try {
      setTransferLoading(true)
      
      // 지연 추가 (2.5초)
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      const response = await hanaMoneyApi.processAccountTransfer({
        userId,
        amount: transferAmount,
        accountNumber: walletInfo.accountNumber,
        bankCode: "088",
        accountHolder: user?.name || "사용자"
      })

      if (response.data) {
        // 이체 결과 정보 설정
        setTransferResult({
          amount: transferAmount,
          newBalance: (totalPoints - parseFloat(transferAmount)).toLocaleString()
        })
        setTransferAmount("")
        setShowTransferModal(false)
        setShowSuccessModal(true)
        loadHanaMoneyData() // 데이터 새로고침
        loadWalletInfo() // 전자 지갑 정보 새로고침
      } else if (response.error) {
        toast({
          title: "이체 실패",
          description: response.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("이체 실패:", error)
      toast({
        title: "이체 실패",
        description: "이체 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setTransferLoading(false)
    }
  }

  // 월별 필터링 및 검색 필터링
  const filteredTransactions = transactions.filter((tx) => {
    // 검색어 필터링
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // 월별 필터링
    if (selectedMonth && selectedMonth !== "all") {
      const txDate = new Date(tx.createdAt)
      const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
      if (txMonth !== selectedMonth) {
        return false
      }
    }
    
    return true
  })

  // 월별 옵션 생성 (최근 5개월)
  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`
      options.push({ value, label })
    }
    
    return options
  }

  const monthOptions = generateMonthOptions()

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 월별 필터 변경 핸들러
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    setCurrentPage(0) // 월 변경 시 첫 페이지로
  }

  const totalPoints = hanaMoney ? parseFloat(hanaMoney.balance) : 0

  // 이번 달 적립/사용 내역 계산
  const getCurrentMonthStats = () => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    const currentMonthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt)
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth
    })
    
    const monthlyEarned = currentMonthTransactions
      .filter(tx => parseFloat(tx.amount) > 0)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    
    const monthlyUsed = Math.abs(currentMonthTransactions
      .filter(tx => parseFloat(tx.amount) < 0)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0))
    
    return { monthlyEarned, monthlyUsed }
  }

  const { monthlyEarned, monthlyUsed } = getCurrentMonthStats()

  // 사용자 정보가 없거나 로딩 중일 때 로딩 화면 표시
  if (loading || !userId) {
    return (
      <div className="bg-gradient-to-br from-gray-50 via-white to-teal-50 min-h-full">
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {!userId ? "사용자 정보를 불러오는 중..." : "하나머니 정보를 불러오는 중..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-teal-50 min-h-full">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
          <motion.div variants={itemVariants}>
            <Link href="/" className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              대시보드로 돌아가기
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">하나머니</h1>
          </motion.div>

          {/* 포인트 카드 */}
          <motion.div variants={itemVariants}>
            <Card className="w-full shadow-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white mb-8 overflow-hidden border-0 relative">
              <CardContent className="relative z-10 p-4">
                <div className="flex items-center justify-between">
                  {/* 왼쪽: 이미지와 포인트 정보 */}
                  <div className="flex items-center gap-4">
                    {/* 이미지 */}
                    <div className="flex-shrink-0">
                      <img 
                        src="/hana-money.png" 
                        alt="하나머니 캐릭터" 
                        className="w-32 h-32 object-contain drop-shadow-lg"
                      />
                    </div>
                    
                    {/* 포인트 정보 */}
                    <div>
                      <p className="text-teal-100 text-sm mb-1">나의 하나머니</p>
                      <div className="flex items-end gap-2">
                        <h2 className="text-4xl font-bold tracking-tight">{totalPoints.toLocaleString()}</h2>
                        <span className="text-xl mb-1">P</span>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 이번 달 적립/사용 정보 */}
                  <div className="flex gap-6">
                    {/* 이번 달 적립 */}
                    <div className="text-center">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <p className="text-xs text-teal-100 mb-1">이번 달 적립</p>
                      <p className="text-base font-semibold text-white">
                        +{monthlyEarned.toLocaleString()}P
                      </p>
                    </div>

                    {/* 이번 달 사용 */}
                    <div className="text-center">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      </div>
                      <p className="text-xs text-teal-100 mb-1">이번 달 사용</p>
                      <p className="text-base font-semibold text-white">
                        {monthlyUsed.toLocaleString()}P
                      </p>
                    </div>
                  </div>
                </div>

                {/* 하단 버튼들 */}
                <div className="grid grid-cols-3 gap-4 text-center mt-6 pt-4 border-t border-white/20">
                  <Button 
                    variant="ghost" 
                    className="flex flex-col h-auto text-white hover:bg-white/10"
                    onClick={handleTransferClick}
                  >
                    <Banknote className="w-6 h-6 mb-1" />
                    <span className="text-xs">이체</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex flex-col h-auto text-white hover:bg-white/10"
                    onClick={handleAttendanceCheck}
                    disabled={loading}
                  >
                    <CalendarCheck className="w-6 h-6 mb-1" />
                    <span className="text-xs">출석</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex flex-col h-auto text-white hover:bg-white/10"
                    onClick={handleStoreClick}
                  >
                    <ShoppingCart className="w-6 h-6 mb-1" />
                    <span className="text-xs">스토어</span>
                  </Button>
                </div>
              </CardContent>

              {/* 배경 장식 */}
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
            </Card>
          </motion.div>

          {/* 이용 내역 섹션 */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <List className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-800">이용 내역</CardTitle>
                      <CardDescription className="text-gray-600">하나머니 적립 및 사용 내역을 확인하세요</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white text-gray-600 border-gray-300">
                    총 {totalElements}건
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* 필터 및 검색 섹션 */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* 월별 필터 */}
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">월별 필터</label>
                      <Select value={selectedMonth} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="전체 기간" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체 기간</SelectItem>
                          {monthOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 검색 */}
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">내역 검색</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="내역 검색 (설명, 카테고리)"
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 거래 내역 목록 */}
                <div className="space-y-2 mb-6">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-200"
                      >
                        <div
                          className={cn(
                            "p-3 rounded-full mr-3",
                            parseFloat(tx.amount) > 0 
                              ? "bg-green-100" 
                              : "bg-orange-100"
                          )}
                        >
                          {parseFloat(tx.amount) > 0 ? (
                            <Award className="h-5 w-5 text-green-600 font-bold" />
                          ) : (
                            <ShoppingCart className="h-5 w-5 text-orange-600 font-bold" />
                          )}
                        </div>

                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800 text-sm">
                              {tx.category === '이체' && tx.description.includes('계좌 이체: ') 
                                ? `계좌 이체(${formatAccountNumber(tx.description.replace('계좌 이체: ', ''), 'wallet')})`
                                : tx.description
                              }
                            </p>
                            <div
                              className="text-[10px] py-0.5 px-2 h-5 font-semibold inline-flex items-center justify-center"
                              style={{ 
                                backgroundColor: tx.category === '출석' ? '#dbeafe' : 
                                               tx.category === '퀴즈' ? '#f3e8ff' :
                                               tx.category === '스토어' ? '#fef3c7' :
                                               tx.category === '이벤트' ? '#dcfce7' :
                                               tx.category === '이체' ? '#fce7f3' :
                                               tx.category === '뉴스' ? '#e0e7ff' : '#f3f4f6',
                                color: tx.category === '출석' ? '#1e40af' : 
                                       tx.category === '퀴즈' ? '#7c3aed' :
                                       tx.category === '스토어' ? '#d97706' :
                                       tx.category === '이벤트' ? '#16a34a' :
                                       tx.category === '이체' ? '#e11d48' :
                                       tx.category === '뉴스' ? '#4338ca' : '#374151',
                                borderRadius: '9999px',
                                minWidth: 'fit-content'
                              }}
                            >
                              {tx.category}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={cn(
                            "font-bold text-sm",
                            parseFloat(tx.amount) > 0 ? "text-green-600" : "text-orange-600"
                          )}>
                            {parseFloat(tx.amount) > 0 ? "+" : ""}
                            {parseFloat(tx.amount).toLocaleString()}P
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg font-medium">검색 결과가 없습니다</p>
                      <p className="text-gray-400 text-sm mt-1">다른 검색어나 기간을 선택해보세요</p>
                    </div>
                  )}
                </div>

                {/* 페이징 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} / {totalElements}건
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="h-9 px-4 rounded-xl shadow"
                      >
                        ← 이전
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i
                          return (
                            <Button
                              key={pageNum}
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`h-9 px-4 rounded-xl shadow transition-all duration-300 ${
                                currentPage === pageNum
                                  ? 'bg-[#009178] text-white scale-[1.05]'
                                  : 'bg-white text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum + 1}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="h-9 px-4 rounded-xl shadow"
                      >
                        다음 →
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

                    {/* 이체 확인 모달 */}
          <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-teal-500" />
                  계좌로 이체하기
                </DialogTitle>
                <DialogDescription>
                  하나머니를 내 전자 지갑으로 이체할 수 있어요
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* 잔액 정보 */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">이체 가능 포인트</span>
                    <span className="text-lg font-bold text-teal-600">{totalPoints.toLocaleString()}P</span>
                  </div>
                </div>

                {/* 전자 지갑 정보 */}
                {walletInfo ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">전자 지갑 계좌</span>
                        <span className="text-sm font-mono text-blue-600">{formatAccountNumber(walletInfo.accountNumber, 'wallet')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">현재 잔액</span>
                        <span className="text-sm font-bold text-blue-600">{walletInfo.balance.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">전자 지갑이 없습니다</span>
                    </div>
                    <p className="text-xs text-red-500 mt-1">전자 지갑을 먼저 생성해주세요.</p>
                  </div>
                )}

                {/* 이체 금액 입력 */}
                <div className="space-y-3">
                  <label htmlFor="transfer-amount" className="text-sm font-medium text-gray-700">
                    이체할 금액
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="transfer-amount"
                      type="number"
                      placeholder="이체할 포인트 입력"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="flex-grow"
                      min="1000"
                      max={totalPoints}
                      disabled={!walletInfo}
                    />
                    <Button 
                      variant="outline"
                      onClick={handleFullAmount}
                      className="whitespace-nowrap"
                      disabled={!walletInfo}
                    >
                      전액
                    </Button>
                  </div>
                  
                  {/* 입력 금액 검증 */}
                  {transferAmount && (
                    <div className="text-sm">
                      {parseFloat(transferAmount) < 1000 ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          최소 1,000P부터 이체 가능합니다.
                        </div>
                      ) : parseFloat(transferAmount) > totalPoints ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          보유한 포인트보다 많은 금액을 이체할 수 없습니다.
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          이체 가능한 금액입니다.
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">최소 1,000P부터 이체 가능합니다.</p>
                </div>

                {/* 이체 정보 미리보기 */}
                {transferAmount && parseFloat(transferAmount) >= 1000 && parseFloat(transferAmount) <= totalPoints && walletInfo && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    className="bg-gray-50 p-3 rounded-lg border"
                  >
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Banknote className="w-2.5 h-2.5 text-gray-600" />
                      </div>
                      이체 정보
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-600 font-medium">이체 금액</span>
                        </div>
                        <span className="font-bold text-gray-800">{parseInt(transferAmount).toLocaleString()}P</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                          <span className="text-gray-600 font-medium">이체 후 하나머니 잔액</span>
                        </div>
                        <span className="font-semibold text-gray-800">{(totalPoints - parseFloat(transferAmount)).toLocaleString()}P</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-600 font-medium">이체 후 전자 지갑 잔액</span>
                        </div>
                        <span className="font-semibold text-gray-800">{(walletInfo.balance + parseFloat(transferAmount)).toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                          <span className="text-gray-600 font-medium">이체 계좌</span>
                        </div>
                        <span className="font-medium font-mono text-gray-800">{formatAccountNumber(walletInfo.accountNumber, 'wallet')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTransferModal(false)}
                  disabled={transferLoading}
                >
                  취소
                </Button>
                <Button 
                  onClick={handleTransferConfirm}
                  disabled={transferLoading || !transferAmount || parseFloat(transferAmount) < 1000 || parseFloat(transferAmount) > totalPoints || !walletInfo}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  {transferLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      이체 중...
                    </>
                  ) : (
                    <>
                      이체하기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 이체 완료 모달 */}
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-teal-600">
                  <CheckCircle className="h-5 w-5" />
                  이체 완료!
                </DialogTitle>
                <DialogDescription>
                  하나머니가 성공적으로 전자 지갑으로 이체되었습니다
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-100 relative overflow-hidden">
                  {/* 배경 장식 */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-200/30 rounded-full"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-emerald-200/30 rounded-full"></div>
                  
                  <div className="flex items-center justify-between">
                    {/* 왼쪽: 이체 완료 정보 */}
                    <div className="text-left">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="w-6 h-6 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-bold text-teal-800 mb-1">
                        {transferResult?.amount && parseInt(transferResult.amount).toLocaleString()}P
                      </h3>
                      <p className="text-base font-semibold text-teal-700 mb-1">이체 완료</p>
                      <p className="text-sm text-teal-600">
                        하나머니 잔액: {transferResult?.newBalance}P
                      </p>
                    </div>
                    
                    {/* 오른쪽: 하나머니 캐릭터 이미지 */}
                    <div className="flex items-center justify-center">
                      <img 
                        src="/hana-money.png" 
                        alt="하나머니 캐릭터" 
                        className="w-24 h-24 object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Banknote className="w-3 h-3 text-blue-600" />
                    이체 내역
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-600">이체 금액</span>
                      </div>
                      <span className="font-semibold text-blue-700">{transferResult?.amount && parseInt(transferResult.amount).toLocaleString()}P</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <span className="text-gray-600">이체 계좌</span>
                      </div>
                      <span className="font-medium font-mono text-indigo-700">{walletInfo && formatAccountNumber(walletInfo.accountNumber, 'wallet')}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="text-gray-600">이체 시간</span>
                      </div>
                      <span className="font-medium text-gray-800">{new Date().toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  onClick={() => setShowSuccessModal(false)}
                  className="bg-teal-500 hover:bg-teal-600 w-full"
                >
                  확인
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  )
}
