"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, TrendingUp, TrendingDown, Activity, ChevronLeft, ChevronRight, Search, Filter, Target, BarChart3, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
// import { useToast } from "@/hooks/use-toast"
import { getFavorites, addFavorite, removeFavorite } from "@/lib/api/investment"

// 애니메이션 정의
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
}

// 주식 종목
const koreanStocks = [
  { rank: 1, name: "삼성전자", code: "005930" },
  { rank: 2, name: "SK하이닉스", code: "000660" },
  { rank: 3, name: "LG에너지솔루션", code: "373220" },
  { rank: 4, name: "삼성바이오로직스", code: "207940" },
  { rank: 5, name: "NAVER", code: "035420" },
  { rank: 6, name: "삼성SDI", code: "006400" },
  { rank: 7, name: "현대차", code: "005380" },
  { rank: 8, name: "카카오", code: "035720" },
  { rank: 9, name: "POSCO홀딩스", code: "005490" },
  { rank: 10, name: "기아", code: "000270" },
  { rank: 11, name: "LG화학", code: "051910" },
  { rank: 12, name: "셀트리온", code: "068270" },
  { rank: 13, name: "한화에어로스페이스", code: "012450" },
  { rank: 14, name: "HMM", code: "011200" },
  { rank: 15, name: "대한항공", code: "003490" },
  { rank: 16, name: "SK이노베이션", code: "096770" },
  { rank: 17, name: "현대모비스", code: "012330" },
  { rank: 18, name: "아모레퍼시픽", code: "090430" },
  { rank: 19, name: "KT&G", code: "033780" },
  { rank: 20, name: "LG전자", code: "066570" },
  { rank: 21, name: "두산에너빌리티", code: "034020" },
  { rank: 22, name: "카카오페이", code: "377300" },
  { rank: 23, name: "크래프톤", code: "259960" },
  { rank: 24, name: "SK텔레콤", code: "017670" },
  { rank: 25, name: "한국전력", code: "015760" },
  { rank: 26, name: "CJ제일제당", code: "097950" },
  { rank: 27, name: "F&F", code: "383220" },
  { rank: 28, name: "제일기획", code: "030000" },
  { rank: 29, name: "하나금융지주", code: "086790" },
  { rank: 30, name: "DB손해보험", code: "005830" },
  { rank: 31, name: "KB금융", code: "105560" },
  { rank: 32, name: "신한지주", code: "055550" },
  { rank: 33, name: "삼성전기", code: "009150" },
  { rank: 34, name: "에코프로비엠", code: "247540" },
  { rank: 35, name: "한화", code: "000880" },
  { rank: 36, name: "현대제철", code: "004020" },
  { rank: 37, name: "한화솔루션", code: "009830" },
  { rank: 38, name: "현대글로비스", code: "086280" },
  { rank: 39, name: "SK바이오팜", code: "326030" },
  { rank: 40, name: "GS", code: "078930" },
  { rank: 41, name: "S-Oil", code: "010950" },
  { rank: 42, name: "HD현대", code: "267250" },
  { rank: 43, name: "두산밥캣", code: "241560" },
  { rank: 44, name: "삼성화재", code: "000810" },
  { rank: 45, name: "NH투자증권", code: "005940" },
  { rank: 46, name: "LG", code: "003550" },
  { rank: 47, name: "현대엘리베이터", code: "017800" },
  { rank: 48, name: "미래에셋증권", code: "006800" },
  { rank: 49, name: "HDC현대EP", code: "089470" },
  { rank: 50, name: "유한양행", code: "000100" },
  { rank: 51, name: "삼양식품", code: "003230" },
  { rank: 52, name: "삼성E&A", code: "028050" },
  { rank: 53, name: "삼성카드", code: "029780" },
  { rank: 54, name: "한화오션", code: "042660" },
  { rank: 55, name: "GS건설", code: "006360" },
  { rank: 56, name: "현대해상", code: "001450" },
  { rank: 57, name: "LG유플러스", code: "032640" },
  { rank: 58, name: "SK", code: "034730" },
  { rank: 59, name: "아모레퍼시픽홀딩스", code: "002790" },
  { rank: 60, name: "NICE", code: "034310" },
  { rank: 61, name: "현대건설", code: "000720" },
  { rank: 62, name: "대웅제약", code: "069620" },
  { rank: 63, name: "녹십자", code: "006280" },
  { rank: 64, name: "OCI홀딩스", code: "010060" },
  { rank: 65, name: "코웨이", code: "021240" },
  { rank: 66, name: "포스코인터내셔널", code: "047050" },
  { rank: 67, name: "금호타이어", code: "073240" },
  { rank: 68, name: "BGF리테일", code: "282330" },
  { rank: 69, name: "금호석유화학", code: "011780" },
  { rank: 70, name: "한솔케미칼", code: "014680" },
  { rank: 71, name: "한미반도체", code: "042700" },
  { rank: 72, name: "오뚜기", code: "007310" },
  { rank: 73, name: "DB하이텍", code: "000990" },
  { rank: 74, name: "삼성증권", code: "016360" },
  { rank: 75, name: "진에어", code: "272450" },
  { rank: 76, name: "덴티움", code: "145720" },
  { rank: 77, name: "NHN", code: "181710" },
  { rank: 78, name: "엔씨소프트", code: "036570" },
  { rank: 79, name: "넷마블", code: "251270" },
  { rank: 80, name: "대한전선", code: "001440" },
  { rank: 81, name: "KT", code: "030200" },
  { rank: 82, name: "LG디스플레이", code: "034220" },
  { rank: 83, name: "메리츠금융지주", code: "138040" },
  { rank: 84, name: "우리금융지주", code: "316140" },
  { rank: 85, name: "BNK금융지주", code: "138930" },
  { rank: 86, name: "iM금융지주", code: "139130" },
  { rank: 87, name: "롯데지주", code: "004990" },
  { rank: 88, name: "롯데케미칼", code: "011170" },
  { rank: 89, name: "한국항공우주", code: "047810" },
  { rank: 90, name: "LS", code: "006260" },
  { rank: 91, name: "HD현대일렉트릭", code: "267260" },
  { rank: 92, name: "한화시스템", code: "272210" },
  { rank: 93, name: "KCC", code: "002380" },
  { rank: 94, name: "에스엠", code: "041510" },
  { rank: 95, name: "JYP Ent.", code: "035900" },
  { rank: 96, name: "에코프로", code: "086520" },
  { rank: 97, name: "동아쏘시오홀딩스", code: "000640" },
  { rank: 98, name: "LIG넥스원", code: "079550" },
  { rank: 99, name: "풍산", code: "103140" },
  { rank: 100, name: "경동나비엔", code: "009450" },
]

interface StockInfo {
  ticker: string
  name: string
  currentPrice: number
  changeAmount: number
  changeRate: number
  volume: number
  tradingValue: number
  marketCap?: number
}

export default function InvestmentPage() {
  const [stocksData, setStocksData] = useState<{ [key: string]: StockInfo }>({})
  const [loadingStocks, setLoadingStocks] = useState<{ [key: string]: boolean }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [updateAnimation, setUpdateAnimation] = useState<{ [key: string]: boolean }>({})
  const [lastFetchTime, setLastFetchTime] = useState<{ [key: string]: number }>({})
  const [cycleInfo, setCycleInfo] = useState<{ current: number; total: number; currentStock: string } | null>(null)
  const [activeTab, setActiveTab] = useState("volume")
  const [searchQuery, setSearchQuery] = useState("")
  
  // 새로운 상태 추가
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRealtimeUpdateActive, setIsRealtimeUpdateActive] = useState(false)
  const [favoriteTickers, setFavoriteTickers] = useState<Set<string>>(new Set())
  const { user } = useAuthStore()
  // const { toast } = useToast()

  const STOCKS_PER_PAGE = 10
  
  // 현재 페이지의 종목들
  const getCurrentPageStocks = () => {
    const startIndex = (currentPage - 1) * STOCKS_PER_PAGE
    const endIndex = startIndex + STOCKS_PER_PAGE
    return koreanStocks.slice(startIndex, endIndex)
  }

  // 즐겨찾기 초기 로딩
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.id) return
      try {
        const favs = await getFavorites(user.id)
        setFavoriteTickers(new Set(favs.map((f) => f.ticker)))
      } catch (e) {
        // ignore
      }
    }
    loadFavorites()
  }, [user?.id])

  const toggleFavorite = async (ticker: string, name: string) => {
    if (!user?.id) {
      // no toast for favorites
      return
    }
    const isFav = favoriteTickers.has(ticker)
    try {
      if (isFav) {
        await removeFavorite(user.id, ticker)
        const next = new Set(favoriteTickers)
        next.delete(ticker)
        setFavoriteTickers(next)
      } else {
        await addFavorite(user.id, ticker, name)
        const next = new Set(favoriteTickers)
        next.add(ticker)
        setFavoriteTickers(next)
      }
    } catch (e: any) {
      // no toast for favorites
    }
  }

  // 개별 종목 데이터 조회 (캐싱 적용)
  const fetchStockData = async (stock: typeof koreanStocks[0], isRealtimeUpdate = false) => {
    const now = Date.now()
    const lastFetch = lastFetchTime[stock.code] || 0
    const CACHE_DURATION = 30000 // 30초 캐시

    // 캐시된 데이터가 있고 30초 이내면 재사용
    if (stocksData[stock.code] && stocksData[stock.code].currentPrice > 0 && (now - lastFetch) < CACHE_DURATION) {
      return
    }

    setLoadingStocks(prev => ({ ...prev, [stock.code]: true }))
    
    try {
      console.log(`${stock.name}(${stock.code}) 데이터 조회 시작...`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/chart/${stock.code}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10초 타임아웃
      })
      
      if (response.ok) {
        const responseText = await response.text()
        console.log(`📄 ${stock.name}(${stock.code}) 응답:`, responseText)
        
        if (!responseText || responseText.trim() === '') {
          throw new Error('빈 응답')
        }
        
        let data: StockInfo
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`❌ ${stock.name}(${stock.code}) JSON 파싱 오류:`, parseError, '응답:', responseText)
          throw new Error('JSON 파싱 실패')
        }
        
        console.log(`✅ ${stock.name}(${stock.code}): ${data.currentPrice}원`)
        
        const stockInfo = {
          ...data,
          name: data.name || stock.name,
          rank: stock.rank
        }
        setStocksData(prev => ({ ...prev, [stock.code]: stockInfo }))
        setLastFetchTime(prev => ({ ...prev, [stock.code]: now }))
      } else {
        console.error(`❌ ${stock.name}(${stock.code}) API 오류: ${response.status} ${response.statusText}`)
        
        // 실시간 업데이트 중에는 기존 데이터 유지, 초기 로딩 중에만 기본값 설정
        if (!isRealtimeUpdate) {
          const defaultStock = {
            ticker: stock.code,
            name: stock.name,
            currentPrice: 0,
            changeAmount: 0,
            changeRate: 0,
            volume: 0,
            tradingValue: 0,
            rank: stock.rank
          }
          setStocksData(prev => ({ ...prev, [stock.code]: defaultStock }))
        }
      }
    } catch (error) {
      console.error(`❌ ${stock.name}(${stock.code}) 네트워크 오류:`, error)
      
      // 실시간 업데이트 중에는 기존 데이터 유지, 초기 로딩 중에만 기본값 설정
      if (!isRealtimeUpdate) {
        const defaultStock = {
          ticker: stock.code,
          name: stock.name,
          currentPrice: 0,
          changeAmount: 0,
          changeRate: 0,
          volume: 0,
          tradingValue: 0,
          rank: stock.rank
        }
        setStocksData(prev => ({ ...prev, [stock.code]: defaultStock }))
      }
    } finally {
      setLoadingStocks(prev => ({ ...prev, [stock.code]: false }))
    }
  }

  // 초기 로딩: 배치로 나누어 로딩
  useEffect(() => {
    if (isInitialLoading) {
      console.log(`초기 로딩 시작(배치 처리)`)
      
      const initializeStocks = async () => {
        const BATCH_SIZE = 5 // 한 번에 처리할 종목 수
        let totalProcessed = 0
        
        // 5개씩 배치로 처리
        for (let i = 0; i < koreanStocks.length; i += BATCH_SIZE) {
          const batch = koreanStocks.slice(i, i + BATCH_SIZE)
          console.log(`📦 배치 처리: ${i + 1}-${i + batch.length} (${batch.length}개 종목)`)
          
          // 현재 배치의 종목들을 병렬로 처리
          const promises = batch.map(stock => fetchStockData(stock))
          await Promise.allSettled(promises)
          
          totalProcessed += batch.length
          console.log(`✅ 배치 완료: ${totalProcessed}/${koreanStocks.length} 종목 처리됨`)
          
          // 배치 간 1초 간격 (서버 부하 방지)
          if (i + BATCH_SIZE < koreanStocks.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        
        console.log(`✅ 초기 로딩 완료: 모든 ${totalProcessed}개 종목`)
        setIsInitialLoading(false)
        
        // 초기 로딩 완료 후 실시간 업데이트 시작
        if (!isRealtimeUpdateActive) {
          console.log(`🔄 실시간 업데이트 시작`)
          setIsRealtimeUpdateActive(true)
        }
      }
      
      initializeStocks()
    } else {
      // 초기 로딩 완료 후에는 페이지 변경 시 빠른 로딩만
      const currentStocks = getCurrentPageStocks()
      console.log(`📊 페이지 ${currentPage} 빠른 로딩: ${currentStocks.length}개 종목`)
      
      const promises = currentStocks.map(stock => {
        if (!stocksData[stock.code] || stocksData[stock.code].currentPrice === 0) {
          return fetchStockData(stock)
        }
        return Promise.resolve()
      })
      
      Promise.allSettled(promises).then(() => {
        console.log(`✅ 페이지 ${currentPage} 빠른 로딩 완료`)
      })
    }
  }, [currentPage, isInitialLoading])

  // 실시간 업데이트: 초기 로딩 완료 후에만 시작
  useEffect(() => {
    if (!isRealtimeUpdateActive) return

    let currentIndex = 0
    const allStocks = koreanStocks // 모든 종목
    
    const updateNextStock = () => {
      if (currentIndex >= allStocks.length) {
        currentIndex = 0 // 처음부터 다시 시작
      }
      
      const stock = allStocks[currentIndex]
      console.log(`🔄 실시간 업데이트: ${currentIndex + 1}/${allStocks.length} - ${stock.name}(${stock.code})`)
      
      // 사이클 정보 업데이트
      setCycleInfo({
        current: currentIndex + 1,
        total: allStocks.length,
        currentStock: stock.name
      })
      
      fetchStockData(stock, true) // 실시간 업데이트 시 기존 데이터 유지
      setUpdateAnimation(prev => ({ ...prev, [stock.code]: true }))
      
      currentIndex++
    }
    
    // 첫 번째 종목 즉시 업데이트
    updateNextStock()
    
    // 3초마다 다음 종목 업데이트
    const interval = setInterval(updateNextStock, 3000)
    
    // 애니메이션 제거 (1초 후)
    const animationInterval = setInterval(() => {
      setUpdateAnimation({})
    }, 1000)
    
    return () => {
      clearInterval(interval)
      clearInterval(animationInterval)
    }
  }, [isRealtimeUpdateActive]) // isRealtimeUpdateActive 의존성만

  // 검색어 기반 필터링
  const getFilteredStocks = () => {
    const query = searchQuery.trim().toLowerCase()
    const sorted = getSortedStocks()

    if (!query) return sorted

    return sorted.filter(stock =>
        stock.name.toLowerCase().includes(query) ||
        stock.ticker.includes(query)
    )
  }

  // 정렬된 종목 배열 생성
  const getSortedStocks = () => {
    const allStocksWithData = koreanStocks.map(stock => {
      const apiData = stocksData[stock.code] || {}
      return {
        ...stock, // 기본 종목 정보 (name, code, rank)
        ...apiData, // API 데이터 (currentPrice, changeAmount 등)
        name: stock.name, // 기본 종목명을 항상 사용
        ticker: stock.code, // 종목 코드 보장
      }
    })

    // 데이터가 있는 종목들만 필터링
    const stocksWithData = allStocksWithData.filter(stock => stock.currentPrice > 0)
    
    // 탭에 따른 정렬
    switch (activeTab) {
      case "volume":
        // 거래량 기준 내림차순 정렬
        return stocksWithData.sort((a, b) => (b.volume || 0) - (a.volume || 0))
      
      case "market-cap":
        // 시가총액 기준 내림차순 정렬
        return stocksWithData.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      
      case "rising":
        // 상승 종목만 필터링 후 등락률 기준 내림차순 정렬
        return stocksWithData
          .filter(stock => (stock.changeRate || 0) > 0) // 상승 종목만
          .sort((a, b) => (b.changeRate || 0) - (a.changeRate || 0))
      
      case "falling":
        // 하락 종목만 필터링 후 등락률 기준 오름차순 정렬
        return stocksWithData
          .filter(stock => (stock.changeRate || 0) < 0) // 하락 종목만
          .sort((a, b) => (a.changeRate || 0) - (b.changeRate || 0))
      
      case "popular":
        // 거래대금 기준 내림차순 정렬 (인기)
        return stocksWithData.sort((a, b) => (b.tradingValue || 0) - (a.tradingValue || 0))
      
      default:
        return stocksWithData
    }
  }

  // 현재 페이지 표시용 종목 배열
  const currentPageStocksArray = () => {
    const filtered = getFilteredStocks()
    const startIndex = (currentPage - 1) * STOCKS_PER_PAGE
    const endIndex = startIndex + STOCKS_PER_PAGE
    return filtered.slice(startIndex, endIndex)
  }

  // 거래량 포맷 함수 (안전한 타입 처리)
  const formatVolume = (volume: number | string | undefined) => {
    // undefined, null, 빈 문자열 체크
    if (volume === undefined || volume === null || volume === '') {
      return '-';
    }
    
    // 문자열을 숫자로 변환
    const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
    
    // NaN 체크
    if (isNaN(numVolume) || numVolume <= 0) {
      return '-';
    }
    
    // 단위 변환
    if (numVolume >= 1000000000) {
      return `${(numVolume / 1000000000).toFixed(0)}억`;
    } else if (numVolume >= 10000000) {
      return `${(numVolume / 10000000).toFixed(0)}천만`;
    } else if (numVolume >= 1000000) {
      return `${(numVolume / 1000000).toFixed(0)}백만`;
    } else if (numVolume >= 100000) {
      return `${(numVolume / 100000).toFixed(0)}만`;
    } else if (numVolume >= 10000) {
      return `${(numVolume / 10000).toFixed(0)}만`;
    } else {
      return `${numVolume.toLocaleString()}`;
    }
  };

  // 시가총액 포맷 함수
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000000) { // 천조
      return `${(marketCap / 1000000000000000).toFixed(1)}천조`;
    } else if (marketCap >= 100000000000000) { // 백조
      return `${(marketCap / 100000000000000).toFixed(1)}백조`;
    } else if (marketCap >= 10000000000000) { // 십조
      return `${(marketCap / 10000000000000).toFixed(1)}십조`;
    } else if (marketCap >= 1000000000000) { // 조
      return `${(marketCap / 1000000000000).toFixed(1)}조`;
    } else if (marketCap >= 100000000000) { // 천억
      return `${(marketCap / 100000000000).toFixed(1)}천억`;
    } else if (marketCap >= 10000000000) { // 백억
      return `${(marketCap / 10000000000).toFixed(1)}백억`;
    } else if (marketCap >= 1000000000) { // 십억
      return `${(marketCap / 1000000000).toFixed(1)}십억`;
    } else if (marketCap >= 100000000) { // 억
      return `${(marketCap / 100000000).toFixed(1)}억`;
    } else if (marketCap >= 10000000) { // 천만
      return `${(marketCap / 10000000).toFixed(1)}천만`;
    } else if (marketCap >= 1000000) { // 백만
      return `${(marketCap / 1000000).toFixed(1)}백만`;
    } else if (marketCap >= 100000) { // 십만
      return `${(marketCap / 100000).toFixed(1)}십만`;
    } else if (marketCap >= 10000) { // 만
      return `${(marketCap / 10000).toFixed(1)}만`;
    } else {
      return `${marketCap.toLocaleString()}`;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-full">
      <div className="container mx-auto p-6">
        {/* Hero Section with Animation */}
        <div className="mb-8 relative">
          <Card className="overflow-hidden shadow-xl bg-gradient-to-r from-[#009178] to-[#004E42] text-white transform hover:scale-[1.02] transition-all duration-300">
            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-8 h-8 animate-pulse" />
                  <h1 className="text-3xl font-bold">실시간 차트</h1>
                </div>
                <p className="text-white/80 text-lg mb-2">
                  오늘 {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 기준
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>
                    {isInitialLoading ? "초기 로딩 중..." : "실시간 업데이트 중"}
                  </span>
                  {cycleInfo && !isInitialLoading && (
                    <span className="text-white/70">
                      ({cycleInfo.current}/{cycleInfo.total} - {cycleInfo.currentStock})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 검색창 */}
        <motion.div variants={fadeInUp} className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="종목명 또는 종목코드로 검색하세요"
                  className="w-full pl-12 h-12 bg-white shadow-lg border-0 rounded-2xl text-base focus:ring-2 focus:ring-[#009178]/20 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl bg-white shadow-lg border-0 hover:bg-gray-50">
                <Filter className="w-4 h-4 mr-2"/>
                필터
              </Button>
              <Button variant="outline" className="rounded-xl bg-white shadow-lg border-0 hover:bg-gray-50">
                <Target className="w-4 h-4 mr-2"/>
                정렬
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tabs */}
        <Card className="overflow-hidden shadow-lg bg-white/80 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value)
            setCurrentPage(1) // 탭 변경 시 첫 페이지로 이동
          }} className="px-6 py-6">
            <TabsList className="grid grid-cols-5 bg-gray-100/60 p-1 rounded-lg gap-1 h-auto">
              <TabsTrigger
                value="volume"
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:transform data-[state=active]:scale-102 data-[state=active]:translate-y-[-1px] data-[state=active]:opacity-90 rounded-lg px-3 py-2 font-medium transition-all duration-300 hover:shadow-none hover:transform hover:scale-101 hover:translate-y-[-0.5px] hover:bg-slate-600/20 hover:text-slate-600 flex items-center gap-1.5 active:opacity-50 active:bg-slate-600/50"
              >
                <BarChart3 className="w-4 h-4" />
                거래량
              </TabsTrigger>
              <TabsTrigger
                value="market-cap"
                className="data-[state=active]:bg-[#009178] data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:transform data-[state=active]:scale-102 data-[state=active]:translate-y-[-1px] data-[state=active]:opacity-90 rounded-lg px-3 py-2 font-medium transition-all duration-300 hover:shadow-none hover:transform hover:scale-101 hover:translate-y-[-0.5px] hover:bg-[#009178]/20 hover:text-[#009178] flex items-center gap-1.5 active:opacity-50 active:bg-[#009178]/50"
              >
                <DollarSign className="w-4 h-4" />
                시가총액
              </TabsTrigger>
              <TabsTrigger
                value="rising"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:transform data-[state=active]:scale-102 data-[state=active]:translate-y-[-1px] data-[state=active]:opacity-90 rounded-lg px-3 py-2 font-medium transition-all duration-300 hover:shadow-none hover:transform hover:scale-101 hover:translate-y-[-0.5px] hover:bg-red-600/20 hover:text-red-600 flex items-center gap-1.5 active:opacity-50 active:bg-red-600/50"
              >
                <TrendingUp className="w-4 h-4" />
                급상승
              </TabsTrigger>
              <TabsTrigger
                value="falling"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:transform data-[state=active]:scale-102 data-[state=active]:translate-y-[-1px] data-[state=active]:opacity-90 rounded-lg px-3 py-2 font-medium transition-all duration-300 hover:shadow-none hover:transform hover:scale-101 hover:translate-y-[-0.5px] hover:bg-blue-600/20 hover:text-blue-600 flex items-center gap-1.5 active:opacity-50 active:bg-blue-600/50"
              >
                <TrendingDown className="w-4 h-4" />
                급하락
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:transform data-[state=active]:scale-102 data-[state=active]:translate-y-[-1px] data-[state=active]:opacity-90 rounded-lg px-3 py-2 font-medium transition-all duration-300 hover:shadow-none hover:transform hover:scale-101 hover:translate-y-[-0.5px] hover:bg-amber-500/20 hover:text-amber-500 flex items-center gap-1.5 active:opacity-50 active:bg-amber-500/50"
              >
                <Heart className="w-4 h-4" />
                인기
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <CardContent className="p-0">
            <div className="overflow-hidden rounded-b-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 text-sm text-gray-700">
                    <TableHead className="text-center w-[80px] font-bold pl-16">순위</TableHead>
                    <TableHead className="text-center w-[200px] font-bold pl-4">종목</TableHead>
                    <TableHead className="text-center w-[140px] font-bold">현재가</TableHead>
                    <TableHead className="text-center w-[120px] font-bold">거래량</TableHead>
                    <TableHead className="text-center w-[140px] font-bold pr-16">시가총액</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentPageStocksArray().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-gray-500 text-lg">
                          <div className="flex items-center justify-center gap-2">
                            <Search className="w-5 h-5" />
                            검색 결과가 없습니다.
                          </div>
                        </TableCell>
                      </TableRow>
                  ) : (
                      currentPageStocksArray().map((stock, index) => (
                          <TableRow
                              key={stock.ticker}
                              className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group border-b border-gray-100"
                              style={{ animationDelay: `${index * 100}ms` }}
                          >
                      <TableCell className="text-center pl-16">
                        <div className="flex items-center justify-center">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                              (() => {
                                const rank = (currentPage - 1) * STOCKS_PER_PAGE + index + 1;
                                if (rank === 1) return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"; // 금
                                if (rank === 2) return "bg-gradient-to-r from-gray-400 to-gray-500 text-white"; // 은
                                if (rank === 3) return "bg-gradient-to-r from-amber-700 to-amber-800 text-white"; // 동
                                return "bg-gray-100 text-gray-600 group-hover:bg-gray-200";
                              })()
                            )}
                          >
                            {(currentPage - 1) * STOCKS_PER_PAGE + index + 1}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="pl-4">
                        <Link href={`/investment/${stock.ticker}`} className="flex items-center gap-8 group">
                          <div className="relative pl-8">
                            <button
                              aria-label="즐겨찾기 토글"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(stock.ticker, stock.name); }}
                              className="cursor-pointer"
                              title={favoriteTickers.has(stock.ticker) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                            >
                              <Heart
                                className={cn(
                                  "w-5 h-5 transition-all duration-300 hover:scale-110",
                                  favoriteTickers.has(stock.ticker)
                                    ? "text-red-500 fill-red-500"
                                    : "text-gray-300 hover:text-red-500"
                                )}
                              />
                            </button>
                          </div>
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-all duration-300 overflow-hidden">
                                {/* 주식 로고 이미지 표시 */}
                                <img
                                  src={`/stock-logos/${stock.ticker}.png`}
                                  alt={stock.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // 이미지 로드 실패 시 기본 텍스트 표시
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm bg-black/20 hidden">
                                  {stock.name.substring(0, 2)}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                                  stock.changeAmount >= 0 ? "bg-red-500" : "bg-blue-500",
                                )}
                              >
                                {stock.changeAmount >= 0 ? (
                                  <TrendingUp className="w-2 h-2 text-white" />
                                ) : (
                                  <TrendingDown className="w-2 h-2 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="pl-2">
                              <span className="font-bold text-gray-800 group-hover:text-[#009178] transition-colors duration-300">
                                {stock.name}
                              </span>
                              <div className="text-xs text-gray-500">{stock.ticker}</div>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {loadingStocks[stock.code] ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-[#009178]/20 border-t-[#009178] rounded-full animate-spin"></div>
                            <span className="text-gray-400 text-sm">업데이트 중...</span>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "font-bold text-base transition-all duration-300 text-center",
                              updateAnimation[stock.ticker] ? "text-[#009178] scale-110" : "text-gray-800",
                              stock.currentPrice === 0 ? "text-gray-400" : ""
                            )}
                          >
                            {stock.currentPrice > 0 ? `${stock.currentPrice.toLocaleString()}원` : 
                              <span className="flex items-center justify-center gap-1">
                                <span className="text-gray-400">준비 중</span>
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                              </span>
                            }
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {loadingStocks[stock.code] ? (
                          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                        ) : (
                          <div className="font-medium text-gray-700 text-center">
                            {formatVolume(stock.volume)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center pr-16">
                        {loadingStocks[stock.code] ? (
                          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                        ) : (
                          <div className="font-medium text-gray-700 text-center">
                            {stock.marketCap && stock.marketCap > 0 ? formatMarketCap(stock.marketCap) : "-"}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* 페이지네이션 */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                총 {getFilteredStocks().length}개 종목 • 페이지 {currentPage} / {Math.ceil(getFilteredStocks().length / STOCKS_PER_PAGE)}
              </div>
              
              <div className="flex items-center gap-1">
                {/* 처음 페이지 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hover:bg-[#009178]/10 border-gray-200"
                >
                  처음
                </Button>
                
                {/* 이전 페이지 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="hover:bg-[#009178]/10 border-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {/* 페이지 번호들 (최대 5개만 표시) */}
                {(() => {
                  const totalPages = Math.ceil(getFilteredStocks().length / STOCKS_PER_PAGE)
                  const maxVisiblePages = 5
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                  
                  // 끝쪽에서 시작 페이지 조정
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1)
                  }
                  
                  const pages = []
                  
                  // 첫 페이지가 1이 아니면 "..." 표시
                  if (startPage > 1) {
                    pages.push(
                      <div
                        key="first-ellipsis"
                        className="flex items-center justify-center w-10 h-8 text-gray-400"
                      >
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    )
                  }
                  
                  // 페이지 번호들
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={i === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i)}
                        className={cn(
                          "min-w-[2.5rem] transition-all duration-200",
                          i === currentPage
                            ? "bg-[#009178] hover:bg-[#004E42] text-white shadow-lg scale-105"
                            : "hover:bg-[#009178]/10 border-gray-200"
                        )}
                      >
                        {i}
                      </Button>
                    )
                  }
                  
                  // 마지막 페이지가 totalPages가 아니면 "..." 표시
                  if (endPage < totalPages) {
                    pages.push(
                      <div
                        key="last-ellipsis"
                        className="flex items-center justify-center w-10 h-8 text-gray-400"
                      >
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    )
                  }
                  
                  return pages
                })()}
                
                {/* 다음 페이지 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(Math.ceil(getFilteredStocks().length / STOCKS_PER_PAGE), currentPage + 1))}
                  disabled={currentPage === Math.ceil(getFilteredStocks().length / STOCKS_PER_PAGE)}
                  className="hover:bg-[#009178]/10 border-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                {/* 마지막 페이지 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.ceil(getFilteredStocks().length / STOCKS_PER_PAGE))}
                  disabled={currentPage === Math.ceil(getFilteredStocks().length / STOCKS_PER_PAGE)}
                  className="hover:bg-[#009178]/10 border-gray-200"
                >
                  마지막
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}
