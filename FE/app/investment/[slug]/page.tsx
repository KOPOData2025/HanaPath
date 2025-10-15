"use client"

import { useState, useEffect, useRef } from "react"
import { flushSync } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Clock,
  X,
  CheckCircle2,
  Tag,
  Hash,
  Calculator,
  BarChart3,
  DollarSign,
  Users,
  Building2,
  Calendar,
  Target,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { motion } from "framer-motion"
import StockChart from "@/components/charts/stock-chart"

import { useWebSocket } from "@/hooks/use-websocket"
import { useAuthStore } from "@/store/auth"
import { addFavorite, buyStock, removeFavorite, sellStock, getFavorites, getHoldings, getTransactions } from "@/lib/api/investment"
import type { HoldingResponse } from "@/lib/api/investment"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Toaster } from "@/components/ui/toaster"
import { AnimatedPrice } from "../../../components/ui/animated-price"
import VolumeBar from "../../../components/ui/volume-bar"

// 용어 설명 팝업 컴포넌트
const TermExplanationPopup = ({ 
  term, 
  explanation, 
  isVisible, 
  onClose, 
  position 
}: { 
  term: string
  explanation: string
  isVisible: boolean
  onClose: () => void
  position: { x: number; y: number }
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute bg-white text-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 51
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 화살표 */}
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
          style={{ zIndex: 52 }}
        >
          <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
            <path d="M8 0L0 8H16L8 0Z" fill="white"/>
          </svg>
        </div>
        
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#009178] transition-all duration-900 rounded-full p-1 hover:bg-gray-100 hover:rotate-90"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 제목 */}
        <h3 className="text-base font-bold mb-3 text-gray-900">{term}</h3>

        {/* 설명 */}
        <div className="text-sm leading-relaxed text-gray-700 space-y-2">
          {explanation.split('\n').map((line, index) => {
            // 매수/매도 텍스트 색상 처리
            const processedLine = line
              .replace(/매수/g, '<span class="text-red-600 font-semibold">매수</span>')
              .replace(/매도/g, '<span class="text-blue-600 font-semibold">매도</span>')
            
            return (
              <p 
                key={index} 
                dangerouslySetInnerHTML={{ __html: processedLine }}
              />
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

// 용어 설명 데이터
const termExplanations = {
  PER: {
    term: "PER (주가수익비율)",
    explanation: "주가를 주당순이익(EPS)으로 나눈 값이에요. PER이 낮을수록 기업이 벌어들이는 이익에 비해 주가가 낮게 평가되고 있다는 의미예요."
  },
  PBR: {
    term: "PBR (주가순자산비율)",
    explanation: "주가를 주당순자산(BPS)으로 나눈 지표예요. PBR이 낮다는 건 기업의 자산가치에 비해 주가가 저렴하게 거래되고 있다는 뜻이에요."
  },
  EPS: {
    term: "EPS (주당순이익)",
    explanation: "기업이 한 주당 벌어들인 순이익을 나타내는 지표예요. EPS가 높을수록 수익성이 좋고, 배당 여력이나 기업 가치도 높다고 평가돼요."
  },
  BPS: {
    term: "BPS (주당순자산)",
    explanation: "회사가 모든 자산을 청산할 때, 주주들에게 한 주당 얼마씩 돌아가는지를 계산한 값이에요. '청산가치'라고도 불려요. BPS가 높을수록 재무 상태가 건전하다고 볼 수 있어요."
  },
  listingShares: {
    term: "상장주식수",
    explanation: "주식시장에서 자유롭게 거래 가능한 주식의 총 수량이에요. 상장주식수가 많을수록 유통량이 커지고, 거래도 더 활발해질 수 있어요."
  },
  marketCap: {
    term: "시가총액",
    explanation: "회사의 전체 주식 가치, 즉 기업의 시장에서의 평가 금액을 의미해요. 주가에 상장주식 수를 곱해서 계산해요."
  },
  capital: {
    term: "자본금",
    explanation: "주식의 액면가에 발행 주식 수를 곱한 금액으로, 회사의 가장 기본이 되는 종잣돈(seed money)이에요. 법적으로 회사의 기본 재산을 의미해요."
  },
  orderQuote: {
    term: "호가 (Order Quote)",
    explanation: "투자자가 주식을 사고팔기 위해 제시한 가격이에요.\n매수 호가는 \"이 가격에 사고 싶다\"\n 매도 호가는 \"이 가격에 팔고 싶다\"는 뜻이에요."
  },
  // orderbook: {
  //   term: "호가창 (Order Book)",
  //   explanation: "매수와 매도 주문이 쌓여있는 현황을 보여주는 화면이에요.\n매도 호가는 위쪽에, 매수 호가는 아래쪽에 표시되며,\n잔량에 따라 시각적으로 표현되어 시장의 수급 상황을 한눈에 파악할 수 있어요."
  // },
  tradeExecution: {
    term: "체결 (Trade Execution)",
    explanation: "매수자와 매도자의 가격이 일치해서\n 실제로 거래가 이루어진 상태를 말해요."
  }
}

const SimulatedStockChart = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [currentPeriod, setCurrentPeriod] = useState("1D")
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 5

  const periods = [
    { label: "1일", value: "1D" },
    { label: "1주", value: "1W" },
    { label: "1개월", value: "1M" },
    { label: "3개월", value: "3M" },
    { label: "1년", value: "1Y" },
  ]

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [currentPeriod, currentPage])

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#009178]/20 border-t-[#009178] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">차트 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Chart Period Selector */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={currentPeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPeriod(period.value)}
              className={cn(
                "transition-all duration-300",
                currentPeriod === period.value
                  ? "bg-[#009178] hover:bg-[#004E42] text-white shadow-lg"
                  : "hover:bg-[#009178]/10 hover:border-[#009178]",
              )}
            >
              {period.label}
            </Button>
          ))}
        </div>

        {/* Chart Pagination */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="hover:bg-[#009178]/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="hover:bg-[#009178]/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chart Display */}
      <div className="w-full h-96 bg-white flex items-center justify-center rounded-xl shadow-inner relative overflow-hidden border">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
        
        {/* Simulated Chart */}
        <div className="relative z-10 w-full h-full p-6">
          <svg viewBox="0 0 800 300" className="w-full h-full">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Sample price line */}
            <path
              d="M 50 200 Q 150 180 250 160 T 450 140 T 650 120 T 750 100"
              fill="none"
              stroke="#009178"
              strokeWidth="3"
              className="drop-shadow-sm"
            />
            
            {/* Price points */}
            {[
              { x: 50, y: 200 },
              { x: 250, y: 160 },
              { x: 450, y: 140 },
              { x: 650, y: 120 },
              { x: 750, y: 100 }
            ].map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#009178"
                className="drop-shadow-sm"
              />
            ))}
          </svg>
        </div>

        {/* Chart Info Overlay */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-700">{currentPeriod} 차트</p>
          <p className="text-xs text-gray-500">페이지 {currentPage}</p>
        </div>
      </div>
    </div>
  )
}

interface StockInfo {
  ticker: string
  name: string
  currentPrice: number
  changeAmount: number
  changeRate: number
  openPrice: number
  highPrice: number
  lowPrice: number
  volume: number
  tradingValue: number
  marketCap: number
  capital: number
  per: number
  pbr: number
  eps: number
  bps: number
  sector: string
  listingShares: number
}

export default function StockDetailPage({ params }: { params: { slug: string } }) {
  const [price, setPrice] = useState(81200)
  const [quantity, setQuantity] = useState(1)
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [orderType, setOrderType] = useState("buy")
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [accountPassword, setAccountPassword] = useState("")
  const pendingOrderRef = useRef<"buy" | "sell">("buy")
  const [isVerifying, setIsVerifying] = useState(false)
  const [centerToast, setCenterToast] = useState<{ open: boolean; title: string; description?: string; variant: 'success' | 'error' }>({ open: false, title: '', description: '', variant: 'success' })
  const [holding, setHolding] = useState<HoldingResponse | null>(null)
  const [priceType, setPriceType] = useState<'limit' | 'market'>('limit')
  const [lastBuyPrice, setLastBuyPrice] = useState<number | null>(null)
  
  // 용어 설명 팝업 상태
  const [popupState, setPopupState] = useState<{
    isVisible: boolean
    term: string
    explanation: string
    position: { x: number; y: number }
  }>({
    isVisible: false,
    term: "",
    explanation: "",
    position: { x: 0, y: 0 }
  })
  
  // WebSocket 연결
  const { isConnected, stockData, executions, subscribeToStock, unsubscribeFromStock } = useWebSocket()

  // 실제 종목 정보 조회
  const fetchStockInfo = async () => {
    try {
      console.log(`${params.slug} 종목 정보 조회 시작...`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/chart/${params.slug}/info`)
      if (response.ok) {
        const data: StockInfo = await response.json()
        console.log(`✅ ${params.slug} 종목 정보 조회 성공:`, data)
        
        // 종목명이 없으면 기본 종목명 설정
        const stockInfoWithName = {
          ...data,
          name: data.name || getStockNameByCode(params.slug)
        }
        
        setStockInfo(stockInfoWithName)
        // 주문 가격을 현재가로 초기화
        setPrice(data.currentPrice)
      } else {
        console.error(`❌ ${params.slug} API 오류: ${response.status} ${response.statusText}`)
        // API 실패 시 기본 정보로 설정
        const defaultStockInfo: StockInfo = {
          ticker: params.slug,
          name: getStockNameByCode(params.slug),
          currentPrice: 0,
          changeAmount: 0,
          changeRate: 0,
          openPrice: 0,
          highPrice: 0,
          lowPrice: 0,
          volume: 0,
          tradingValue: 0,
          marketCap: 0,
          capital: 0,
          per: 0,
          pbr: 0,
          eps: 0,
          bps: 0,
          sector: "정보 없음",
          listingShares: 0
        }
        setStockInfo(defaultStockInfo)
      }
    } catch (err) {
      console.error(`❌ ${params.slug} 네트워크 오류:`, err)
      // 네트워크 오류 시 기본 정보로 설정
      const defaultStockInfo: StockInfo = {
        ticker: params.slug,
        name: getStockNameByCode(params.slug),
        currentPrice: 0,
        changeAmount: 0,
        changeRate: 0,
        openPrice: 0,
        highPrice: 0,
        lowPrice: 0,
        volume: 0,
        tradingValue: 0,
        marketCap: 0,
        capital: 0,
        per: 0,
        pbr: 0,
        eps: 0,
        bps: 0,
        sector: "정보 없음",
        listingShares: 0
      }
      setStockInfo(defaultStockInfo)
    }
  }

  // 용어 설명 팝업 열기 함수
  const openTermExplanation = (termKey: keyof typeof termExplanations, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const explanation = termExplanations[termKey]
    
    // 화면 크기 고려하여 팝업 위치 조정
    const popupWidth = 320
    const popupHeight = 200
    
    let x = rect.left + rect.width / 2 - popupWidth / 2
    let y = rect.bottom + 10
    
    // 화면 경계 체크
    if (x + popupWidth > window.innerWidth) {
      x = window.innerWidth - popupWidth - 20
    }
    if (x < 20) {
      x = 20
    }
    if (y + popupHeight > window.innerHeight) {
      y = rect.top - popupHeight - 10
    }
    
    setPopupState({
      isVisible: true,
      term: explanation.term,
      explanation: explanation.explanation,
      position: { x, y }
    })
  }

  // 용어 설명 팝업 호버 함수
  const handleTermHover = (termKey: keyof typeof termExplanations, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const explanation = termExplanations[termKey]
    
    // 화면 크기 고려하여 팝업 위치 조정
    const popupWidth = 320
    const popupHeight = 200
    
    let x = rect.left + rect.width / 2 - popupWidth / 2
    let y = rect.bottom + 10
    
    // 화면 경계 체크
    if (x + popupWidth > window.innerWidth) {
      x = window.innerWidth - popupWidth - 20
    }
    if (x < 20) {
      x = 20
    }
    if (y + popupHeight > window.innerHeight) {
      y = rect.top - popupHeight - 10
    }
    
    setPopupState({
      isVisible: true,
      term: explanation.term,
      explanation: explanation.explanation,
      position: { x, y }
    })
  }

  // 용어 설명 팝업 닫기 함수
  const closeTermExplanation = () => {
    setPopupState(prev => ({ ...prev, isVisible: false }))
  }

  // 종목 코드로 종목명 조회하는 함수
  const getStockNameByCode = (code: string): string => {
    const stockMap: { [key: string]: string } = {
      "005930": "삼성전자",
      "000660": "SK하이닉스",
      "373220": "LG에너지솔루션",
      "207940": "삼성바이오로직스",
      "035420": "NAVER",
      "006400": "삼성SDI",
      "005380": "현대차",
      "035720": "카카오",
      "005490": "POSCO홀딩스",
      "000270": "기아",
      "051910": "LG화학",
      "068270": "셀트리온",
      "012450": "한화에어로스페이스",
      "011200": "HMM",
      "003490": "대한항공",
      "096770": "SK이노베이션",
      "012330": "현대모비스",
      "090430": "아모레퍼시픽",
      "033780": "KT&G",
      "066570": "LG전자",
      "034020": "두산에너빌리티",
      "377300": "카카오페이",
      "259960": "크래프톤",
      "017670": "SK텔레콤",
      "015760": "한국전력",
      "097950": "CJ제일제당",
      "383220": "F&F",
      "030000": "제일기획",
      "086790": "하나금융지주",
      "005830": "DB손해보험",
      "105560": "KB금융",
      "055550": "신한지주",
      "009150": "삼성전기",
      "247540": "에코프로비엠",
      "000880": "한화",
      "004020": "현대제철",
      "009830": "한화솔루션",
      "086280": "현대글로비스",
      "326030": "SK바이오팜",
      "078930": "GS",
      "010950": "S-Oil",
      "267250": "HD현대",
      "241560": "두산밥캣",
      "000810": "삼성화재",
      "005940": "NH투자증권",
      "003550": "LG",
      "017800": "현대엘리베이터",
      "006800": "미래에셋증권",
      "089470": "HDC현대EP",
      "000100": "유한양행",
      "003230": "삼양식품",
      "028050": "삼성E&A",
      "029780": "삼성카드",
      "042660": "한화오션",
      "006360": "GS건설",
      "001450": "현대해상",
      "032640": "LG유플러스",
      "034730": "SK",
      "002790": "아모레퍼시픽홀딩스",
      "034310": "NICE",
      "000720": "현대건설",
      "069620": "대웅제약",
      "006280": "녹십자",
      "010060": "OCI홀딩스",
      "021240": "코웨이",
      "047050": "포스코인터내셔널",
      "073240": "금호타이어",
      "282330": "BGF리테일",
      "011780": "금호석유화학",
      "014680": "한솔케미칼",
      "042700": "한미반도체",
      "007310": "오뚜기",
      "000990": "DB하이텍",
      "016360": "삼성증권",
      "272450": "진에어",
      "145720": "덴티움",
      "181710": "NHN",
      "036570": "엔씨소프트",
      "251270": "넷마블",
      "001440": "대한전선",
      "030200": "KT",
      "034220": "LG디스플레이",
      "138040": "메리츠금융지주",
      "316140": "우리금융지주",
      "138930": "BNK금융지주",
      "139130": "iM금융지주",
      "004990": "롯데지주",
      "011170": "롯데케미칼",
      "047810": "한국항공우주",
      "006260": "LS",
      "267260": "HD현대일렉트릭",
      "272210": "한화시스템",
      "002380": "KCC",
      "041510": "에스엠",
      "035900": "JYP Ent.",
      "086520": "에코프로",
      "000640": "동아쏘시오홀딩스",
      "079550": "LIG넥스원",
      "103140": "풍산",
      "009450": "경동나비엔"
    }
    return stockMap[code] || `${code} 종목`
  }

  useEffect(() => {
    fetchStockInfo()
    // WebSocket 구독 시작
    subscribeToStock(params.slug)
    // 즐겨찾기 초기 상태 동기화
    const syncFavorite = async () => {
      if (!user?.id) return
      try {
        const favs = await getFavorites(user.id)
        setIsLiked(!!favs.find(f => f.ticker === params.slug))
      } catch (_) {}
    }
    syncFavorite()
    const syncHolding = async () => {
      if (!user?.id) return
      try {
        const list = await getHoldings(user.id)
        const found = list.find((h) => h.ticker === params.slug)
        setHolding(found ?? null)
      } catch (_) {
        setHolding(null)
      }
    }
    syncHolding()
    const syncLastBuyPrice = async () => {
      if (!user?.id) return
      try {
        const { transactions } = await getTransactions(user.id, 0, 100)
        const latestBuy = transactions
          .filter(t => t.ticker === params.slug && t.type === 'BUY')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        setLastBuyPrice(latestBuy ? latestBuy.pricePerShare : null)
      } catch (_) {
        setLastBuyPrice(null)
      }
    }
    syncLastBuyPrice()
    
    // 30초마다 정보 업데이트
    const interval = setInterval(fetchStockInfo, 30000)
    
    return () => {
      clearInterval(interval)
      unsubscribeFromStock()
    }
  }, [params.slug, user?.id])

  const isPositive = stockInfo ? stockInfo.changeAmount >= 0 : false
  // 실시간 틱 거래량(일시적인 체결 수량)이 누적 거래량을 덮어쓰며 흔들리는 현상 방지: 더 큰 값을 표시
  const displayVolume = Math.max(stockData?.volume ?? 0, stockInfo?.volume ?? 0)

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

  const handleSubmitOrder = async () => {
    if (!user?.id || !stockInfo) {
      toast({ title: "로그인이 필요해요", description: "주문하려면 먼저 로그인하세요.", variant: "destructive" })
      return
    }
    // 비밀번호 모달 오픈 후 처리
    pendingOrderRef.current = orderType === 'buy' ? 'buy' : 'sell'
    setIsPasswordOpen(true)
  }

  const actuallySubmitOrder = async () => {
    if (!user?.id || !stockInfo) return
    const currentTradePrice = stockData?.price ?? stockInfo.currentPrice ?? 0
    if (priceType === 'market' && currentTradePrice <= 0) {
      toast({ title: '시장가 사용 불가', description: '현재가 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.', variant: 'destructive' })
      return
    }
    if (priceType === 'limit') {
      const minLimitPrice = Math.max(1, Math.floor(currentTradePrice * 0.9))
      const maxLimitPrice = Math.max(minLimitPrice, Math.ceil(currentTradePrice * 1.1))
      if (price < minLimitPrice || price > maxLimitPrice) {
        toast({
          title: '허용 범위를 벗어난 가격',
          description: `지정가는 현재가 기준 ±10% 이내로만 주문할 수 있어요. (${minLimitPrice.toLocaleString()}원 ~ ${maxLimitPrice.toLocaleString()}원)`,
          variant: 'destructive',
        })
        return
      }
    }
    setIsVerifying(true)
    // 확인 중... 표시
    await new Promise((r) => setTimeout(r, 700))
    const effectivePrice = priceType === 'market'
      ? (stockData?.price ?? stockInfo.currentPrice)
      : price
    const payload = {
      ticker: params.slug,
      name: stockInfo.name || getStockNameByCode(params.slug),
      quantity,
      price: effectivePrice,
      accountPassword,
    }
    try {
      const res = (pendingOrderRef.current === 'buy')
        ? await buyStock(user.id, payload)
        : await sellStock(user.id, payload)
      // 성공 토스트: 센터 커스텀 토스트로 표시
      setCenterToast({
        open: true,
        title: `${pendingOrderRef.current === 'buy' ? '매수 체결이 성공적으로 완료되었습니다' : '매도 체결이 성공적으로 완료되었습니다'}`,
        description: `${res.quantity}주 @ ${res.pricePerShare.toLocaleString()}원`,
        variant: 'success'
      })
      setTimeout(() => setCenterToast((t) => ({ ...t, open: false })), 1800)
      setIsPasswordOpen(false)
      setAccountPassword("")
      // 체결 후 보유 수량 갱신
      try {
        if (user?.id) {
          const list = await getHoldings(user.id)
          const found = list.find((h) => h.ticker === params.slug)
          setHolding(found ?? null)
        }
      } catch (_) {}
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || '주문 실패'
      toast({ title: '주문 오류', description: msg, variant: 'destructive' })
      setAccountPassword("")
    }
    setIsVerifying(false)
  }

  // 키패드 UX 핸들러 (진동 포함)
  const handleKeypadNumber = (digit: string) => {
    setAccountPassword(prev => (prev + digit).slice(0, 4))
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      ;(navigator as any).vibrate?.(50)
    }
  }

  const handleClearPin = () => {
    setAccountPassword("")
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      ;(navigator as any).vibrate?.(100)
    }
  }

  const handleBackspacePin = () => {
    setAccountPassword(prev => prev.slice(0, Math.max(0, prev.length - 1)))
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      ;(navigator as any).vibrate?.(30)
    }
  }

  const toggleFavorite = async () => {
    if (!user?.id || !stockInfo) return
    try {
      if (isLiked) {
        await removeFavorite(user.id, params.slug)
        setIsLiked(false)
      } else {
        await addFavorite(user.id, params.slug, stockInfo.name)
        setIsLiked(true)
      }
    } catch (e: any) {
      // no toast for favorites
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-full">
      <div className="container mx-auto p-6 max-w-7xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Back Button */}
          <motion.div variants={itemVariants}>
            <Link href="/investment">
              <Button variant="ghost" className="mb-6 hover:bg-white/80 group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                투자 목록으로
              </Button>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Stock Header */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-xl bg-gradient-to-r from-white to-gray-50 border-0 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                                              <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden relative">
                            {/* 주식 로고 이미지 표시 */}
                            <img
                              src={`/stock-logos/${params.slug}.png`}
                              alt={stockInfo?.name || getStockNameByCode(params.slug)}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // 이미지 로드 실패 시 기본 텍스트 표시
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl bg-black/20 hidden">
                              {(stockInfo?.name || getStockNameByCode(params.slug)).substring(0, 2)}
                            </div>
                          </div>
                        <div>
                          <h1 className="text-3xl font-bold text-gray-800 mb-1">
                            {stockInfo?.name || "로딩 중..."}
                            <span className="text-gray-500 font-normal text-lg ml-2">{params.slug}</span>
                          </h1>
                          <div className="flex items-center gap-4">
                            {stockInfo ? (
                              <>
                                <motion.div
                                  key={stockInfo.currentPrice}
                                  initial={{ scale: 1.1 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3 }}
                                  className={cn(
                                    "text-4xl font-bold transition-all duration-300",
                                    isPositive ? "text-red-600" : "text-blue-600",
                                  )}
                                >
                                  {stockInfo.currentPrice.toLocaleString()}원
                                </motion.div>
                                <div
                                  className={cn(
                                    "flex items-center gap-2 text-lg font-medium transition-all duration-300",
                                    isPositive ? "text-red-500" : "text-blue-500",
                                  )}
                                >
                                  {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                  <span>
                                    어제보다 {isPositive ? "+" : ""}
                                    {stockInfo.changeAmount.toLocaleString()}원 ({isPositive ? "+" : ""}
                                    {stockInfo.changeRate.toFixed(2)}%)
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400">로딩 중...</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFavorite}
                        className="hover:bg-red-50 transition-all duration-300"
                      >
                        <Heart
                          className={cn(
                            "w-6 h-6 transition-all duration-300",
                            isLiked ? "text-red-500 fill-current scale-110" : "text-gray-400 hover:text-red-500",
                          )}
                        />
                      </Button>
                    </div>
                    <StockChart ticker={params.slug} stockName={stockInfo?.name || getStockNameByCode(params.slug)} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stock Info Tabs */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
                  <Tabs defaultValue="realtime">
                    <TabsList className="px-6 pt-12 pb-6 w-full justify-start rounded-none bg-transparent gap-2 pl-8">
                      <TabsTrigger
                        value="realtime"
                        className="data-[state=active]:bg-[#009178] data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-[#009178]/40 data-[state=active]:transform data-[state=active]:scale-105 data-[state=active]:translate-y-[-2px] rounded-full px-5 py-2.5 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#009178]/20 hover:transform hover:scale-102 hover:translate-y-[-1px] hover:bg-[#009178]/10 hover:text-[#009178]"
                      >
                        실시간 시세
                      </TabsTrigger>
                      <TabsTrigger
                        value="info"
                        className="data-[state=active]:bg-[#009178] data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-[#009178]/40 data-[state=active]:transform data-[state=active]:scale-105 data-[state=active]:translate-y-[-2px] rounded-full px-5 py-2.5 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#009178]/20 hover:transform hover:scale-102 hover:translate-y-[-1px] hover:bg-[#009178]/10 hover:text-[#009178]"
                      >
                        종목 정보
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="realtime" className="p-8">
                      <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-gray-800">실시간 호가</h3>
                              <button
                                onClick={(e) => openTermExplanation('orderQuote', e)}
                                className="text-gray-400 hover:text-[#009178] transition-colors"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              실시간 업데이트
                            </div>
                          </div>
                          
                          {/* 호가 테이블 */}
                          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* 헤더 */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b">
                              <div className="grid grid-cols-3 text-sm font-semibold text-gray-600">
                                <span className="text-center">매수잔량</span>
                                <span className="text-center">가격</span>
                                <span className="text-center">매도잔량</span>
                              </div>                         
                            </div>
                            
                            <div>
                              {/* 매도 호가 (5개, 역순) */}
                              {[4, 3, 2, 1, 0].map((i) => {
                                const askPrice = stockData?.askPrices?.[i] || 0;
                                const askVolume = stockData?.askVolumes?.[i] || 0;
                                
                                return (
                                  <div key={`ask-${i}`} className="group relative overflow-hidden px-4 py-3 transition-all duration-300 hover:shadow-sm">
                                    {/* 잔량 바 애니메이션 - 매도잔량 컬럼 내에서만 (왼쪽에서 시작) */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 flex justify-start">
                                      <VolumeBar 
                                        volume={askVolume} 
                                        maxVolume={Math.max(
                                          ...(stockData?.askVolumes || []).filter(v => v > 0),
                                          ...(stockData?.bidVolumes || []).filter(v => v > 0),
                                          1
                                        )}
                                        type="ask"
                                        className="h-7 w-full"
                                      />
                                    </div>
                                    
                                    <div className="relative grid grid-cols-3 items-center text-sm z-10">
                                      <span className="text-center text-gray-400">-</span>
                                      <div className="text-center">
                                        <AnimatedPrice 
                                          price={askPrice}
                                          className="font-semibold text-blue-600"
                                        />
                                      </div>
                                      <div className="text-left pl-2">
                                        <span className="text-xs font-medium text-blue-600 transition-all duration-300 group-hover:scale-105">
                                          {askVolume > 0 ? askVolume.toLocaleString() : "-"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* 현재가 구분선 */}
                              <div className="px-4 py-3">
                                <div className="flex items-center justify-center gap-3">
                                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-gray-400"></div>
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-medium text-gray-600">현재가</span>
                                    <span className="text-base font-bold text-gray-800">
                                      {stockData?.price?.toLocaleString() || stockInfo?.currentPrice?.toLocaleString() || "0"}원
                                    </span>
                                  </div>
                                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-400 to-gray-400"></div>
                                </div>
                              </div>
                              
                              {/* 매수 호가 (5개) */}
                              {[0, 1, 2, 3, 4].map((i) => {
                                const bidPrice = stockData?.bidPrices?.[i] || 0;
                                const bidVolume = stockData?.bidVolumes?.[i] || 0;
                                
                                return (
                                  <div key={`bid-${i}`} className="group relative overflow-hidden px-4 py-3 transition-all duration-300 hover:shadow-sm">
                                    {/* 잔량 바 애니메이션 - 매수잔량 컬럼 내에서만 (오른쪽에서 시작) */}
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 flex justify-end">
                                      <VolumeBar 
                                        volume={bidVolume} 
                                        maxVolume={Math.max(
                                          ...(stockData?.askVolumes || []).filter(v => v > 0),
                                          ...(stockData?.bidVolumes || []).filter(v => v > 0),
                                          1
                                        )}
                                        type="bid"
                                        className="h-7 w-full"
                                      />
                                    </div>
                                    
                                    <div className="relative grid grid-cols-3 items-center text-sm z-10">
                                      <div className="text-right pr-2">
                                        <span className="text-xs font-medium text-red-600 transition-all duration-300 group-hover:scale-105">
                                          {bidVolume > 0 ? bidVolume.toLocaleString() : "-"}
                                        </span>
                                      </div>
                                      <div className="text-center">
                                        <AnimatedPrice 
                                          price={bidPrice}
                                          className="font-semibold text-red-600"
                                        />
                                      </div>
                                      <span className="text-center text-gray-400">-</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-gray-800">실시간 체결</h3>
                              <button
                                onClick={(e) => openTermExplanation('tradeExecution', e)}
                                className="text-gray-400 hover:text-[#009178] transition-colors"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              최근 10건
                            </div>
                          </div>
                          
                          {/* 체결가 테이블 */}
                          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* 헤더 */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b">
                              <div className="grid grid-cols-4 text-sm font-semibold text-gray-600">
                                <span>구분</span>
                                <span className="text-center">체결가</span>
                                <span className="text-center">수량</span>
                                <span className="text-right">시간</span>
                              </div>                           
                            </div>
                            
                            {/* 체결 목록 */}
                            <div className="max-h-96 overflow-y-auto">
                              {executions.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                  {executions.slice(0, 10).map((execution, index) => (
                                    <motion.div
                                      key={`${execution.timestamp}-${execution.price}-${execution.volume}-${execution.tradeType}`}
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className={cn(
                                        "px-6 py-4 hover:bg-gray-50 transition-colors",
                                        execution.tradeType === "BUY" 
                                          ? "border-l-4 border-red-400 bg-red-50/30" 
                                          : "border-l-4 border-blue-400 bg-blue-50/30"
                                      )}
                                    >
                                      <div className="grid grid-cols-4 items-center">
                                        <span className={cn(
                                          "text-sm font-medium",
                                          execution.tradeType === "BUY" ? "text-red-600" : "text-blue-600"
                                        )}>
                                          {execution.tradeType === "BUY" ? "매수" : "매도"}
                                        </span>
                                        <span className="text-center font-mono font-semibold text-gray-800">
                                          {execution.price.toLocaleString()}
                                        </span>
                                        <span className="text-center text-sm text-gray-600">
                                          {execution.volume.toLocaleString()}
                                        </span>
                                        <div className="text-right">
                                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                            {execution.time}
                                          </span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-12 text-gray-500">
                                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-gray-400" />
                                  </div>
                                  <p className="font-medium">체결 대기 중</p>
                                  <p className="text-sm mt-1">곧 체결 정보가 표시됩니다</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 거래 현황 카드 */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-100">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                <span className="text-sm font-medium text-indigo-700">거래량</span>
                              </div>
                              
                              <p className="text-xl font-bold text-indigo-800">
                                {/* 기존 코드(주석 처리): 실시간 값이 순간 체결 수량일 때 작은 값이 표시되는 문제 발생 */}
                                {/*
                              {stockData ? `${(stockData.volume / 10000).toFixed(0)}만주` : 
                               stockInfo ? `${(stockInfo.volume / 10000).toFixed(0)}만주` : "0만주"}
                              */}
                                {`${(displayVolume / 10000).toFixed(0)}만주`}
                              </p>
                            </div>
                            
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-100">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                <span className="text-sm font-medium text-emerald-700">현재가</span>
                              </div>
                              <p className="text-xl font-bold text-emerald-800">
                                {stockData ? `${stockData.price.toLocaleString()}원` :
                                 stockInfo ? `${stockInfo.currentPrice.toLocaleString()}원` : "0원"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="info" className="p-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-gray-800 mb-4">기본 정보</h3>
                          {[
                            { label: "업종", value: stockInfo?.sector || "정보 없음", hasExplanation: false },
                            { label: "상장주수", value: stockInfo ? `${(stockInfo.listingShares / 100000000).toFixed(0)}억주` : "정보 없음", hasExplanation: true, termKey: "listingShares" as keyof typeof termExplanations },
                            { label: "시가총액", value: stockInfo ? `${(stockInfo.marketCap / 1000000000000).toFixed(1)}조원` : "정보 없음", hasExplanation: true, termKey: "marketCap" as keyof typeof termExplanations },
                            { label: "자본금", value: stockInfo ? `${(stockInfo.capital / 100000000).toFixed(0)}억원` : "정보 없음", hasExplanation: true, termKey: "capital" as keyof typeof termExplanations },
                          ].map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium">{item.label}</span>
                                {item.hasExplanation && (
                                  <button
                                    onClick={(e) => openTermExplanation(item.termKey!, e)}
                                    className="text-gray-400 hover:text-[#009178] transition-colors"
                                  >
                                    <HelpCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <span className="font-semibold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-gray-800 mb-4">재무 정보</h3>
                          {stockInfo ? [
                            { label: "PER", value: `${stockInfo.per.toFixed(1)}배`, termKey: "PER" as keyof typeof termExplanations },
                            { label: "PBR", value: `${stockInfo.pbr.toFixed(1)}배`, termKey: "PBR" as keyof typeof termExplanations },
                            { label: "EPS", value: `${stockInfo.eps.toLocaleString()}원`, termKey: "EPS" as keyof typeof termExplanations },
                            { label: "BPS", value: `${stockInfo.bps.toLocaleString()}원`, termKey: "BPS" as keyof typeof termExplanations },
                          ].map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium">{item.label}</span>
                                <button
                                  onClick={(e) => openTermExplanation(item.termKey, e)}
                                  className="text-gray-400 hover:text-[#009178] transition-colors"
                                >
                                  <HelpCircle className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="font-semibold">{item.value}</span>
                            </div>
                          )) : (
                            <div className="text-center py-4 text-gray-500">로딩 중...</div>
                          )}
                        </div>
                      </div>
                    </TabsContent>                                                     
                  </Tabs>
                </Card>
              </motion.div>
            </div>

            {/* Order Panel */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <Card className="sticky top-20 shadow-2xl bg-white border-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100/40 rounded-full -translate-y-16 translate-x-16"></div>

                <CardHeader className="relative z-10">
                  <CardTitle className="text-2xl font-bold text-gray-800">주문하기</CardTitle>
                </CardHeader>

                <CardContent className="relative z-10">
                  <Tabs value={orderType} onValueChange={setOrderType} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger
                        value="buy"
                          className="data-[state=active]:bg-red-500 data-[state=active]:hover:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg font-bold transition-all duration-300"
                      >
                        매수
                      </TabsTrigger>
                      <TabsTrigger
                        value="sell"
                          className="data-[state=active]:bg-blue-500 data-[state=active]:hover:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg font-bold transition-all duration-300"
                      >
                        매도
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="buy" className="mt-6 space-y-6">
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                        <p className="text-sm text-rose-700 font-medium">주식을 신중하게 매수하세요</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Tag className="w-4 h-4 text-rose-500" /> 구매 가격</label>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => flushSync(() => setPriceType('limit'))}
                                className={cn("font-medium", priceType === 'limit' ? "text-rose-600 bg-rose-50 hover:bg-rose-50 hover:text-rose-600" : "text-gray-500 hover:bg-gray-100")}
                              >
                                지정가
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => flushSync(() => setPriceType('market'))}
                                className={cn("font-medium", priceType === 'market' ? "text-rose-600 bg-rose-50 hover:bg-rose-50 hover:text-rose-600" : "text-gray-500 hover:bg-gray-100")}
                              >
                                시장가
                              </Button>
                            </div>
                          </div>
                          {priceType === 'limit' ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPrice((p) => Math.max(0, p - 100))}
                                className="hover:bg-rose-50 hover:border-rose-300 transition-all duration-300"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="text"
                                value={`${price.toLocaleString()} 원`}
                                className="text-center font-bold text-lg bg-gradient-to-r from-gray-50 to-white border-2 focus:border-rose-500 transition-all duration-300"
                                readOnly
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPrice((p) => p + 100)}
                                className="hover:bg-rose-50 hover:border-rose-300 transition-all duration-300"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">시장가 주문은 현재가로 즉시 체결돼요.</div>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-1.5"><Hash className="w-4 h-4 text-rose-500" /> 수량</label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                              className="hover:bg-rose-50 hover:border-rose-300 transition-all duration-300"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              className="text-center font-bold text-lg bg-gradient-to-r from-gray-50 to-white border-2 focus:border-rose-500 transition-all duration-300"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setQuantity((q) => q + 1)}
                              className="hover:bg-rose-50 hover:border-rose-300 transition-all duration-300"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border-t-4 border-rose-400">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-700">주문 금액</span>
                            <span className="font-bold text-xl text-rose-500">
                              {(price * quantity).toLocaleString()}원
                            </span>
                          </div>
                        </div>

                                <Button
                          size="lg"
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                          onClick={handleSubmitOrder}
                        >
                          {orderType === 'buy' ? '매수 주문하기' : '매도 주문하기'}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="sell" className="mt-6 space-y-6">
                      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
                        {holding && holding.quantity > 0 ? (
                          <div className="text-center space-y-2" aria-live="polite">
                            <div className="inline-flex flex-wrap justify-center gap-2">
                              <span className="rounded-full bg-white border border-sky-200 text-sky-700 text-sm font-medium px-3 py-1.5" aria-label={`보유 ${holding.quantity.toLocaleString()}주`}>
                                보유 {holding.quantity.toLocaleString()}주
                              </span>
                              {lastBuyPrice && (
                                <span className="rounded-full bg-white border border-sky-200 text-sky-700 text-sm font-medium px-3 py-1.5" aria-label={`매입가 ${lastBuyPrice.toLocaleString()}원`}>
                                  매입가 {lastBuyPrice.toLocaleString()}원
                                </span>
                              )}
                            </div>
                            {stockInfo && (stockInfo.currentPrice > 0 || (stockData?.price ?? 0) > 0) && holding.averagePrice > 0 && (
                              <div className="flex justify-center">
                                {(() => {
                                  const cur = (stockData?.price ?? stockInfo.currentPrice)
                                  const diffAmt = (cur - holding.averagePrice) * holding.quantity
                                  const diffRate = ((cur - holding.averagePrice) / holding.averagePrice) * 100
                                  const isGain = diffAmt >= 0
                                  return (
                                    <div className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                                      isGain ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                    )}>
                                      {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                      <span>{`${diffRate >= 0 ? '+' : ''}${diffRate.toFixed(1)}%`}</span>
                                      <span>·</span>
                                      <span>{`${diffAmt >= 0 ? '+' : ''}${Math.abs(diffAmt).toLocaleString()}원`}</span>
                                    </div>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center text-center">
                            <p className="text-sm text-sky-700 font-medium">보유 주식을 현명하게 매도하세요</p>
                            {/* <div className="text-xs text-gray-600">보유 없음</div> */}
                          </div>
                        )}
                      </div>

                      {holding && holding.quantity > 0 ? (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Tag className="w-4 h-4 text-sky-500" /> 매도 가격</label>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                onClick={() => flushSync(() => setPriceType('limit'))}
                                  className={cn("font-medium", priceType === 'limit' ? "text-sky-600 bg-sky-50 hover:bg-sky-50 hover:text-sky-600" : "text-gray-500 hover:bg-gray-100")}
                                >
                                  지정가
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => flushSync(() => setPriceType('market'))}
                                  className={cn("font-medium", priceType === 'market' ? "text-sky-600 bg-sky-50 hover:bg-sky-50 hover:text-sky-600" : "text-gray-500 hover:bg-gray-100")}
                                >
                                  시장가
                                </Button>
                              </div>
                            </div>
                            {priceType === 'limit' ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPrice((p) => Math.max(0, p - 100))}
                                className="hover:bg-sky-50 hover:border-sky-300 transition-all duration-300"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="text"
                                value={`${price.toLocaleString()} 원`}
                                className="text-center font-bold text-lg bg-gradient-to-r from-gray-50 to-white border-2 focus:border-sky-500 transition-all duration-300"
                                readOnly
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPrice((p) => p + 100)}
                                className="hover:bg-sky-50 hover:border-sky-300 transition-all duration-300"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            ) : (
                              <div className="text-sm text-gray-600">시장가 주문은 현재가로 즉시 체결돼요.</div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-1.5"><Hash className="w-4 h-4 text-sky-500" /> 수량</label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setQuantity((q) => Math.max(1, Math.min(holding.quantity, q - 1)))}
                                className="hover:bg-sky-50 hover:border-sky-300 transition-all duration-300"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="number"
                                value={Math.min(quantity, holding.quantity)}
                                onChange={(e) => {
                                  const next = Number(e.target.value)
                                  if (Number.isNaN(next)) return
                                  setQuantity(Math.max(1, Math.min(holding.quantity, next)))
                                }}
                                className="text-center font-bold text-lg bg-gradient-to-r from-gray-50 to-white border-2 focus:border-sky-500 transition-all duration-300"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setQuantity((q) => Math.max(1, Math.min(holding.quantity, q + 1)))}
                                className="hover:bg-sky-50 hover:border-sky-300 transition-all duration-300"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 text-right">최대 {holding.quantity.toLocaleString()}주</div>
                          </div>

                          <div className="p-4 bg-gray-50 rounded-xl border-t-4 border-sky-400">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">매도 금액</span>
                              <span className="font-bold text-xl text-sky-500">
                                {(price * Math.min(quantity, holding.quantity)).toLocaleString()}원
                              </span>
                            </div>
                          </div>

                          <Button
                            size="lg"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                            onClick={handleSubmitOrder}
                          >
                            매도 주문하기
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="font-medium">보유 주식이 없습니다</p>
                          <p className="text-sm mt-2">먼저 주식을 매수해보세요</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* 용어 설명 팝업 */}
      <TermExplanationPopup
        term={popupState.term}
        explanation={popupState.explanation}
        isVisible={popupState.isVisible}
        onClose={closeTermExplanation}
        position={popupState.position}
      />
      {/* 계좌 비밀번호 입력 모달 */}
      <Dialog open={isPasswordOpen} onOpenChange={(open) => { setIsPasswordOpen(open); if (!open) { setAccountPassword("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>계좌 비밀번호 입력</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-sm text-gray-600">모의 투자 계좌의 4자리 비밀번호를 입력하세요.</p>
            <div className="flex justify-center">
              <InputOTP maxLength={4} value={accountPassword} onChange={setAccountPassword}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-10 h-10 text-lg" />
                  <InputOTPSlot index={1} className="w-10 h-10 text-lg" />
                  <InputOTPSlot index={2} className="w-10 h-10 text-lg" />
                  <InputOTPSlot index={3} className="w-10 h-10 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className={cn("flex justify-center select-none", isVerifying && "pointer-events-none opacity-60")}> 
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3,4,5,6,7,8,9].map((num) => (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeypadNumber(String(num))}
                    className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-xl font-semibold hover:bg-slate-50 hover:border-slate-400 hover:shadow-lg active:bg-slate-100 transition-all"
                  >
                    {num}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearPin}
                  className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-300 hover:shadow-lg active:bg-red-100 transition-all"
                >
                  Clear
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleKeypadNumber("0")}
                  className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-xl font-semibold hover:bg-slate-50 hover:border-slate-400 hover:shadow-lg active:bg-slate-100 transition-all"
                >
                  0
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBackspacePin}
                  className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-lg font-medium hover:bg-orange-50 hover:border-orange-300 hover:shadow-lg active:bg-orange-100 transition-all flex items-center justify-center"
                >
                  ⌫
                </motion.button>
              </div>
            </div>
            <Button
              disabled={accountPassword.length !== 4}
              className="w-full h-10 bg-[#009178] hover:bg-[#004E42] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={actuallySubmitOrder}
            >
              {isVerifying ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  확인 중...
                </span>
              ) : (
                '확인'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Center custom toast */}
      {centerToast.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="pointer-events-auto flex items-center gap-4 rounded-3xl bg-white px-8 py-6 shadow-2xl border border-gray-200 min-w-[300px] max-w-[92vw]"
          >
            <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-600" />
            <div>
              <div className="text-base md:text-lg font-semibold text-slate-900">{centerToast.title}</div>
              {centerToast.description && (
                <div className="text-sm md:text-base text-slate-600 mt-1">{centerToast.description}</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      <Toaster />
    </div>
  )
}
