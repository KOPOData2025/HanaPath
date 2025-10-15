"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownLeft, Send, QrCode, PlusCircle, ChevronLeft, Search, Calendar, Banknote, TrendingUp, TrendingDown, Wallet, Edit3, PieChart } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn, formatAccountNumber } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth"
import AllowanceRequestModal from "@/components/wallet/allowance-request-modal"
import TransferModal from "@/components/wallet/transfer-modal"
import MemoEditModal from "@/components/wallet/memo-edit-modal"
import AnalysisTab from "@/components/wallet/analysis-tab"
import { getWalletTransactions } from "@/lib/api/wallet"

const categoryColors: Record<string, string> = {
  용돈: "bg-green-100 text-green-800",
  송금: "bg-blue-100 text-blue-800",
  입금: "bg-cyan-100 text-cyan-800",
  이체: "bg-purple-100 text-purple-800",
  스토어: "bg-orange-100 text-orange-800",
  교통: "bg-indigo-100 text-indigo-800",
  문화: "bg-pink-100 text-pink-800",
  쇼핑: "bg-emerald-100 text-emerald-800",
  음식: "bg-red-100 text-red-800",
  저축: "bg-teal-100 text-teal-800",
  기타: "bg-gray-100 text-gray-800",
}

const TransactionIcon = ({ type }: { type: string }) => {
  if (type === "INCOME") return <ArrowDownLeft className="w-5 h-5 text-green-500" />
  return <ArrowUpRight className="w-5 h-5 text-red-500" />
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

interface Transaction {
  id: number
  title: string
  category: string
  amount: number
  transactionDate: string
  description: string
  memo?: string
  relatedAccountNumber?: string
  type: string
  createdAt: string
}

interface TransactionSummary {
  totalIncome: number
  totalExpense: number
  monthlyIncome: number
  monthlyExpense: number
}

export default function WalletPage() {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllowanceModal, setShowAllowanceModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showMemoEditModal, setShowMemoEditModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [prevPage, setPrevPage] = useState(1)
  const itemsPerPage = 10
  const { user, isLoggedIn } = useAuthStore()

  // 페이지네이션 계산 함수
  const getVisiblePages = (current: number, total: number, maxVisible: number = 5) => {
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(current - half, 1)
    let end = start + maxVisible - 1

    if (end > total) {
      end = total
      start = Math.max(end - maxVisible + 1, 1)
    }

    const pages = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const pagesPerGroup = 5 // 한 번에 보여줄 페이지 수
  const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup)
  const prevGroup = Math.floor((prevPage - 1) / pagesPerGroup)
  const isGroupChanged = currentGroup !== prevGroup
  const isForward = currentPage > prevPage

  // 디바운싱을 위한 useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms 딜레이

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadWalletInfo()
      loadTransactions()
    }
  }, [isLoggedIn, user?.id, currentPage])

  useEffect(() => {
    setPrevPage(currentPage)
  }, [currentPage])

  const loadWalletInfo = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token || !user?.id) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/${user.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWalletInfo(data)
      } else {
        // 전자 지갑이 없는 경우 null로 설정
        setWalletInfo(null)
      }
    } catch (error) {
      console.error("전자 지갑 정보 로드 실패:", error)
      // 에러 시에도 null로 설정
      setWalletInfo(null)
    }
  }

  const loadTransactions = async () => {
    try {
      setLoading(true)
      if (!user?.id) return

      const response = await getWalletTransactions(0, 1000) // 모든 거래 내역을 한 번에 가져오기
      
      setTransactions(response.transactions)
    } catch (error) {
      console.error("거래 내역 로드 실패:", error)
    } finally {
      setLoading(false)
    }
  }



  // 클라이언트 사이드 필터링
  const filteredTransactions = transactions.filter((tx) => {
    // 검색어 필터링
    if (debouncedSearchQuery && !tx.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
      return false
    }

    // 탭 필터링
    if (filter === "income" && tx.amount <= 0) return false
    if (filter === "expense" && tx.amount >= 0) return false

    return true
  })

  // 페이징 계산
  const totalElements = filteredTransactions.length
  const totalPages = Math.ceil(totalElements / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  // 거래 내역을 날짜별로 그룹화
  const groupedTransactions = paginatedTransactions.reduce(
    (acc, tx) => {
      const date = new Date(tx.transactionDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      ;(acc[date] = acc[date] || []).push(tx)
      return acc
    },
    {} as Record<string, Transaction[]>,
  )

  // 이번 달 수입/지출 계산
  const getCurrentMonthStats = () => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    const currentMonthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.transactionDate)
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth
    })
    
    const monthlyIncome = currentMonthTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const monthlyExpense = Math.abs(currentMonthTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0))
    
    return { monthlyIncome, monthlyExpense }
  }

  const { monthlyIncome, monthlyExpense } = getCurrentMonthStats()

  const handleMemoEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowMemoEditModal(true)
  }

  const handleMemoUpdate = (transactionId: number, newMemo: string) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === transactionId 
          ? { ...tx, memo: newMemo }
          : tx
      )
    )
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 via-white to-teal-50 min-h-full">
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-gray-600">전자 지갑 정보를 불러오는 중...</p>
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">내 지갑</h1>
          </motion.div>

          {/* 잔액 및 빠른 실행 버튼 */}
          <motion.div variants={itemVariants}>
            <Card className="w-full shadow-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white mb-8 overflow-hidden border-0 relative">
              <CardContent className="relative z-20 p-4">
                <div className="flex items-center justify-between">
                  {/* 왼쪽: 이미지와 잔액 정보 */}
                  <div className="flex items-center gap-4">
                    {/* 이미지 */}
                    <div className="flex-shrink-0">
                      <img 
                        src="/wallet.png" 
                        alt="전자 지갑" 
                        className="w-32 h-32 object-contain drop-shadow-lg"
                      />
                    </div>
                    
                    {/* 잔액 정보 */}
                    <div>
                      {walletInfo ? (
                        <>
                          <p className="text-teal-100 text-sm mb-1">전자 지갑 잔액</p>
                          <div className="flex items-end gap-2">
                            <h2 className="text-4xl font-bold tracking-tight">{walletInfo.balance.toLocaleString()}</h2>
                            <span className="text-xl mb-1">원</span>
                          </div>
                          <p className="text-xs text-teal-200 mt-1 font-mono">
                            {formatAccountNumber(walletInfo.accountNumber, 'wallet')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-teal-100 text-sm mb-1">전자 지갑</p>
                          <div className="flex items-end gap-2">
                            <h2 className="text-2xl font-bold tracking-tight text-teal-200">아직 전자 지갑이 없습니다</h2>
                          </div>
                          <p className="text-xs text-teal-200 mt-1">
                            전자 지갑을 생성하여 서비스를 이용해보세요
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 이번 달 수입/지출 정보 */}
                  {walletInfo && (
                    <div className="flex gap-6">
                      {/* 이번 달 수입 */}
                      <div className="text-center">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-xs text-teal-100 mb-1">이번 달 수입</p>
                        <p className="text-base font-semibold text-white">
                          +{monthlyIncome.toLocaleString()}원
                        </p>
                      </div>

                      {/* 이번 달 지출 */}
                      <div className="text-center">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-xs text-teal-100 mb-1">이번 달 지출</p>
                        <p className="text-base font-semibold text-white">
                          {monthlyExpense.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 하단 버튼들 */}
                <div className="grid grid-cols-3 gap-4 text-center mt-6 pt-4 border-t border-white/20">
                  {walletInfo ? (
                    <>
                      <Button 
                        variant="ghost" 
                        className="flex flex-col h-auto text-white hover:bg-white/10"
                        onClick={() => setShowTransferModal(true)}
                      >
                        <Send className="w-6 h-6 mb-1" />
                        <span className="text-xs">송금</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="flex flex-col h-auto text-white hover:bg-white/10"
                        onClick={() => setShowAllowanceModal(true)}
                      >
                        <PlusCircle className="w-6 h-6 mb-1" />
                        <span className="text-xs">충전</span>
                      </Button>
                      <Button variant="ghost" className="flex flex-col h-auto text-white hover:bg-white/10">
                        <QrCode className="w-6 h-6 mb-1" />
                        <span className="text-xs">결제</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div></div>
                      <Button 
                        variant="ghost" 
                        className="flex flex-col h-auto text-white hover:bg-white/10"
                        onClick={() => window.location.href = '/mypage'}
                      >
                        <PlusCircle className="w-6 h-6 mb-1" />
                        <span className="text-xs">전자 지갑 생성</span>
                      </Button>
                      <div></div>
                    </>
                  )}
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
                className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full pointer-events-none"
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
                className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/5 rounded-full pointer-events-none"
              />
            </Card>
          </motion.div>

          {/* 거래 내역 */}
          {walletInfo && (
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-800">이용 내역</CardTitle>
                        <CardDescription className="text-gray-600">전자 지갑 거래 내역을 확인하세요</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white text-gray-600 border-gray-300">
                      총 {filteredTransactions.length}건
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <Tabs value={filter} onValueChange={(value) => {
                        setFilter(value)
                      }} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="all">전체</TabsTrigger>
                          <TabsTrigger value="income">입금</TabsTrigger>
                          <TabsTrigger value="expense">출금</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      
                      {/* 분석 버튼 - 원형 차트 아이콘 */}
                      <div
                        onClick={() => setFilter("analysis")}
                        onMouseEnter={(e) => {
                          const pieChartDiv = e.currentTarget.querySelector('[data-pie-chart]') as HTMLElement
                          if (pieChartDiv) {
                            pieChartDiv.style.transform = 'rotate(180deg)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          const pieChartDiv = e.currentTarget.querySelector('[data-pie-chart]') as HTMLElement
                          if (pieChartDiv) {
                            pieChartDiv.style.transform = 'rotate(0deg)'
                          }
                        }}
                        className={`group h-10 px-3 rounded-xl transition-all duration-300 border relative overflow-hidden hover:scale-[1.02] cursor-pointer flex items-center ${
                          filter === "analysis" 
                            ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 shadow-lg border-teal-400/50 backdrop-blur-sm" 
                            : "bg-white text-gray-700 border-gray-200/60 backdrop-blur-sm shadow-sm hover:bg-teal-500 hover:text-white hover:border-teal-400"
                        }`}
                        title="거래 내역 분석"
                      >
                        <div className="flex items-center gap-2 relative z-10">
                          <div
                            data-pie-chart
                            className="transition-transform duration-300 ease-in-out p-1"
                            style={{ transform: 'rotate(0deg)' }}
                          >
                            <PieChart className={`w-4 h-4 transition-colors duration-300 ${
                              filter === "analysis" 
                                ? "text-white" 
                                : "text-gray-600 group-hover:text-white"
                            }`} />
                          </div>
                          <span 
                            className={`text-sm font-semibold transition-colors duration-200 ${
                              filter === "analysis" 
                                ? "text-white" 
                                : "text-gray-700 group-hover:text-white"
                            }`}
                          >
                            분석
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 검색창 - 분석 탭에서는 숨김 */}
                    {filter !== "analysis" && (
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="거래내역 검색"
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              setDebouncedSearchQuery(searchQuery) // 즉시 검색 실행
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {filter === "analysis" ? (
                      <AnalysisTab transactions={transactions} />
                    ) : Object.keys(groupedTransactions).length > 0 ? (
                      Object.entries(groupedTransactions).map(([date, txs]) => (
                        <div key={date}>
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <h3 className="text-sm font-semibold text-gray-500">{date}</h3>
                          </div>
                          <div className="space-y-2">
                            {txs.map((tx, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center p-3 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <div className="p-2 bg-gray-100 rounded-full mr-4">
                                  <TransactionIcon type={tx.type} />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">
                                      {tx.category === '송금' && tx.relatedAccountNumber 
                                        ? `${tx.title}(${formatAccountNumber(tx.relatedAccountNumber, 'wallet')})`
                                        : tx.category === '스토어' && tx.title.includes(' 구매')
                                        ? tx.title
                                        : tx.title
                                      }
                                    </p>
                                    <Badge
                                      className={cn("text-[10px] py-1 px-2.5 border-0 pointer-events-none", categoryColors[tx.category] || "")}
                                    >
                                      {tx.category}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-500">
                                      {new Date(tx.transactionDate).toLocaleTimeString('ko-KR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    {/* 메모 표시 */}
                                    {tx.memo && (
                                      <p className="text-xs text-gray-400 italic">
                                        {tx.memo}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className={cn("font-bold text-sm", tx.amount > 0 ? "text-green-600" : "text-red-600")}>
                                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}원
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMemoEdit(tx)}
                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                  >
                                    <Edit3 className="h-3 w-3 text-gray-400" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">검색 결과가 없습니다</p>
                      </div>
                    )}

                    {/* 페이징 - 분석 탭에서는 숨김 */}
                    {filter !== "analysis" && totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-10 mb-6">
                        <Button
                          className="h-9 px-4 rounded-xl shadow"
                          variant="ghost"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          ← 이전
                        </Button>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={getVisiblePages(currentPage, totalPages).join("-")}
                            initial={
                              isGroupChanged
                                ? { opacity: 0, x: isForward ? 60 : -60, scale: 0.95 }
                                : { opacity: 0 }
                            }
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={
                              isGroupChanged
                                ? { opacity: 0, x: isForward ? -60 : 60, scale: 0.95 }
                                : { opacity: 0 }
                            }
                            transition={{
                              duration: isGroupChanged ? 0.4 : 0.2,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="flex gap-2"
                          >
                            {getVisiblePages(currentPage, totalPages).map((page) => (
                              <Button
                                key={page}
                                className={`h-9 px-4 rounded-xl shadow transition-all duration-300 ${
                                  currentPage === page
                                    ? 'bg-teal-500 text-white scale-[1.05]'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                                variant="ghost"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            ))}
                          </motion.div>
                        </AnimatePresence>

                        <Button
                          className="h-9 px-4 rounded-xl shadow"
                          variant="ghost"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          다음 →
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* 용돈 요청 모달 */}
      <AllowanceRequestModal 
        isOpen={showAllowanceModal}
        onClose={() => setShowAllowanceModal(false)}
      />

      {/* 송금 모달 */}
      <TransferModal 
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransferComplete={() => {
          loadWalletInfo()
          loadTransactions()
        }}
      />

      {/* 메모 편집 모달 */}
      <MemoEditModal
        isOpen={showMemoEditModal}
        onClose={() => {
          setShowMemoEditModal(false)
          setSelectedTransaction(null)
        }}
        transactionId={selectedTransaction?.id || 0}
        currentMemo={selectedTransaction?.memo || ""}
        onMemoUpdate={handleMemoUpdate}
      />
    </div>
  )
}

