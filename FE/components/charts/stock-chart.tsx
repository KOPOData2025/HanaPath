"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         ComposedChart, Bar, Area, AreaChart } from "recharts"
import { createChart, ISeriesApi, CandlestickData, CandlestickSeries } from "lightweight-charts"
import { Activity, TrendingUp, TrendingDown, Wifi, WifiOff, HelpCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"



interface CandleData {
  date: string
  time?: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  ticker: string
}

interface RealtimeData {
  ticker: string
  price: number
  volume: number
  askPrices: number[]
  bidPrices: number[]
  askVolumes: number[]
  bidVolumes: number[]
  timestamp: number
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
  per: number
  pbr: number
  eps: number
  bps: number
  sector: string
  listingShares: number
}



// 용어 설명 데이터 (배열)
const chartTermSlides = [
  {
    key: 'daily',
    title: '일봉 (Daily Candle / 일일 차트)',
    color: 'text-blue-600',
    border: 'border-blue-400',
    desc: '하루 동안의 주가 흐름을 하나의 봉으로 나타낸 차트예요. 각 일봉에는 시가, 고가, 저가, 종가가 담겨 있어요.'
  },
  {
    key: 'weekly',
    title: '주봉 (Weekly Candle / 주간 차트)',
    color: 'text-purple-600',
    border: 'border-purple-400',
    desc: '한 주(월~금, 5거래일 기준)의 주가 흐름을 하나의 봉으로 표현한 차트예요. 일봉보다 긴 흐름을 볼 수 있어서 중장기 추세를 파악할 때 유용해요.'
  },
  {
    key: 'open',
    title: '시가 (Opening Price)',
    color: 'text-yellow-500',
    border: 'border-yellow-400',
    desc: '장 시작 시 처음 거래된 가격이에요.'
  },
  {
    key: 'highlow',
    title: '고가 / 저가 (High / Low)',
    color: '',
    border: 'border-red-400',
    desc: '거래일 또는 주간 동안 가장 높았던/낮았던 주가를 의미해요.',
    sub: [
      { label: '고가', color: 'text-red-500', value: '가장 높았던 주가' },
      { label: '저가', color: 'text-blue-500', value: '가장 낮았던 주가' }
    ]
  },
  {
    key: 'close',
    title: '종가 (Closing Price)',
    color: 'text-emerald-600',
    border: 'border-emerald-500',
    desc: '해당 거래일 또는 주간의 마지막으로 체결된 가격이에요.'
  }
]

// 용어 설명 데이터
const termExplanations = {
  dailyCandle: {
    term: "일봉 (Daily Candle / 일일 차트)",
    explanation: "하루 동안의 주가 흐름을 하나의 봉으로 나타낸 차트예요.\n각 일봉에는 시가(장 시작 가격), 고가, 저가, 종가가 담겨 있어요."
  },
  weeklyCandle: {
    term: "주봉 (Weekly Candle / 주간 차트)",
    explanation: "한 주(월~금, 5거래일 기준)의 주가 흐름을 하나의 봉으로 표현한 차트예요.\n일봉보다 긴 흐름을 볼 수 있어서 중장기 추세를 파악할 때 유용해요."
  },
  chartTerms: {
    term: "차트 주요 용어 설명",
    explanation: `시가 (Opening Price)\n장 시작 시 처음 거래된 가격이에요.\n\n고가 / 저가 (High / Low)\n거래일 또는 주간 동안 가장 높았던/낮았던 주가를 의미해요.\n\n종가 (Closing Price)\n해당 거래일 또는 주간의 마지막으로 체결된 가격이에요.`
  }
}

interface StockChartProps {
  ticker: string
  stockName?: string
}

export default function StockChart({ ticker, stockName = ticker }: StockChartProps) {
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chartType, setChartType] = useState<"daily" | "weekly">("daily")

  const [chartPeriod, setChartPeriod] = useState<string>("1m") // 차트 기간 추가
  const [chartDisplay, setChartDisplay] = useState<"line" | "candle">("line") // 차트 표시 타입 추가
  const [error, setError] = useState<string | null>(null)
  

  
  // 차트 용어 슬라이드 팝업 상태
  const [showChartTermPopup, setShowChartTermPopup] = useState(false)
  const [chartTermSlideIndex, setChartTermSlideIndex] = useState(0)
  
  const wsRef = useRef<WebSocket | null>(null)
  const stompClientRef = useRef<any>(null)
  const candleChartRef = useRef<HTMLDivElement>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick">>()

  // 기간 옵션 정의
  const periodOptions = [
    { value: "1w", label: "1주", days: 7 },
    { value: "1m", label: "1개월", days: 30 },
    { value: "1y", label: "1년", days: 365 }
  ]

  // 차트 데이터 조회
  const fetchChartData = async (type: "daily" | "weekly") => {
    try {
      setIsLoading(true)
      setError(null)
      
      let endpoint: string

      if (type === "daily") {
        // 일봉 데이터 - predefined API 사용으로 더 긴 기간 지원
        endpoint = `/api/stock/chart/${ticker}/daily/predefined?period=${chartPeriod}`
      } else {
        // 주봉 데이터 - 3년(156주)로 설정
        endpoint = `/api/stock/chart/${ticker}/weekly/predefined?period=3y`
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`차트 데이터 조회 실패: ${response.status}`)
      }
      
      const data: CandleData[] = await response.json()
      setChartData(data)
      
    } catch (err) {
      console.error("차트 데이터 조회 오류:", err)
      setError(err instanceof Error ? err.message : "알 수 없는 오류")
    } finally {
      setIsLoading(false)
    }
  }

  // 주봉용 기간 매핑 함수 (일봉 탭에서 주봉으로 전환할 때 사용)
  const getWeeklyPeriod = (dailyPeriod: string): string => {
    switch (dailyPeriod) {
      case "1w": return "1m" // 1주 -> 1개월 (4주)
      case "1m": return "1y" // 1개월 -> 1년 (52주)
      case "1y": return "2y" // 1년 -> 2년 (104주)
      default: return "1m"
    }
  }

  // 종목 정보 조회
  const fetchStockInfo = async () => {
    try {
      console.log(`${ticker} 종목 정보 조회 시작...`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/chart/${ticker}/info`)
      
      if (response.ok) {
        const data: StockInfo = await response.json()
        console.log(`${ticker} 종목 정보 조회 성공:`, data)
        
        // 종목명이 없으면 기본 종목명 설정
        const stockInfoWithName = {
          ...data,
          name: data.name || getStockNameByCode(ticker)
        }
        
        setStockInfo(stockInfoWithName)
      } else {
        console.error(`${ticker} API 오류: ${response.status} ${response.statusText}`)
        // API 실패 시 기본 정보로 설정
        const defaultStockInfo: StockInfo = {
          ticker: ticker,
          name: getStockNameByCode(ticker),
          currentPrice: 0,
          changeAmount: 0,
          changeRate: 0,
          openPrice: 0,
          highPrice: 0,
          lowPrice: 0,
          volume: 0,
          tradingValue: 0,
          marketCap: 0,
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
      console.error(`${ticker} 네트워크 오류:`, err)
      // 네트워크 오류 시 기본 정보로 설정
      const defaultStockInfo: StockInfo = {
        ticker: ticker,
        name: getStockNameByCode(ticker),
        currentPrice: 0,
        changeAmount: 0,
        changeRate: 0,
        openPrice: 0,
        highPrice: 0,
        lowPrice: 0,
        volume: 0,
        tradingValue: 0,
        marketCap: 0,
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

  // 웹소켓 연결
  const connectWebSocket = () => {
    try {
      if (typeof window === 'undefined') return

      // SockJS와 STOMP 라이브러리가 없으면 기본 WebSocket 사용
      const ws = new WebSocket(`ws://${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('https://', '')}/ws`)
      
      ws.onopen = () => {
        console.log("WebSocket 연결 성공")
        setIsConnected(true)
        
        // 종목별 실시간 데이터 구독 시뮬레이션
        ws.send(JSON.stringify({
          type: "subscribe",
          ticker: ticker
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("실시간 데이터:", data)
          
          if (data.ticker === ticker) {
            setRealtimeData(data)
          }
        } catch (err) {
          console.error("메시지 파싱 오류:", err)
        }
      }

      ws.onclose = () => {
        console.log("WebSocket 연결 종료")
        setIsConnected(false)
        
        // 재연결 시도
        setTimeout(connectWebSocket, 5000)
      }

      ws.onerror = (error) => {
        console.error("WebSocket 오류:", error)
        setIsConnected(false)
      }

      wsRef.current = ws

    } catch (err) {
      console.error("WebSocket 연결 실패:", err)
      setIsConnected(false)
    }
  }

  useEffect(() => {
    fetchChartData(chartType)
    fetchStockInfo()
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [ticker, chartType, chartType === "daily" ? chartPeriod : null])

  // 캔들 차트 초기화
  useEffect(() => {
    if (chartDisplay === "candle" && candleChartRef.current && chartData.length > 0) {
      const chart = createChart(candleChartRef.current, {
        width: candleChartRef.current.clientWidth,
        height: 320,
        layout: {
          background: { color: "#ffffff" },
          textColor: "#333333",
        },
        grid: {
          vertLines: { color: "#f0f0f0" },
          horzLines: { color: "#f0f0f0" },
        },
        rightPriceScale: {
          borderColor: '#e0e0e0',
        },
        timeScale: {
          borderColor: '#e0e0e0',
          timeVisible: true,
          secondsVisible: false,
        },
      })

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#ef4444',
        downColor: '#3b82f6',
        borderVisible: false,
        wickUpColor: '#ef4444',
        wickDownColor: '#3b82f6',
      })

      candleSeriesRef.current = candlestickSeries

      // 날짜 형식 변환 함수 (YYYYMMDD -> YYYY-MM-DD)
      const formatDateForLightweight = (dateStr: string) => {
        if (dateStr.length === 8) {
          return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        }
        return dateStr
      }

      const candleData: CandlestickData[] = chartData.map(item => ({
        time: formatDateForLightweight(item.date),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))
      
      candlestickSeries.setData(candleData)
      
      // 초기 표시 범위를 최근 4-50개 캔들로 제한
      if (candleData.length > 0) {
        const visibleCandles = Math.min(50, Math.max(4, candleData.length))
        const startIndex = Math.max(0, candleData.length - visibleCandles)
        const startTime = candleData[startIndex].time
        const endTime = candleData[candleData.length - 1].time
        
        chart.timeScale().setVisibleRange({
          from: startTime,
          to: endTime
        })
      } else {
        chart.timeScale().fitContent()
      }

      const handleResize = () => {
        if (candleChartRef.current) {
          chart.applyOptions({
            width: candleChartRef.current.clientWidth,
          })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
      }
    }
  }, [chartDisplay, chartData])

  // 차트 데이터 변환
  const chartDataWithRealtime = [...chartData]
  if (realtimeData && chartData.length > 0) {
    const lastCandle = chartData[chartData.length - 1]
    const realtimeCandle = {
      ...lastCandle,
      close: realtimeData.price,
      high: Math.max(lastCandle.high, realtimeData.price),
      low: Math.min(lastCandle.low, realtimeData.price),
      volume: realtimeData.volume,
      date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      time: new Date().toLocaleTimeString()
    }
    chartDataWithRealtime[chartDataWithRealtime.length - 1] = realtimeCandle
  }

  // 호가 데이터
  const orderbookData = realtimeData ? [
    ...realtimeData.askPrices.slice(0, 5).reverse().map((price, index) => ({
      price,
      type: 'ask',
      level: 5 - index
    })),
    ...realtimeData.bidPrices.slice(0, 5).map((price, index) => ({
      price,
      type: 'bid',
      level: index + 1
    }))
  ] : []

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#009178]/20 border-t-[#009178] rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">차트 데이터 로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <p className="font-medium">오류 발생</p>
            <p className="text-sm">{error}</p>
            <Button 
              onClick={() => fetchChartData(chartType)} 
              className="mt-2"
              size="sm"
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <Card>
        <CardHeader className="py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 주식 로고 */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm  overflow-hidden relative">
                <img
                  src={`/stock-logos/${ticker}.png`}
                  alt={stockInfo?.name || getStockNameByCode(ticker)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 이미지 로드 실패 시 기본 텍스트 표시
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm bg-black/20 hidden">
                  {(stockInfo?.name || getStockNameByCode(ticker)).substring(0, 2)}
                </div>
              </div>
              <CardTitle className="text-xl font-bold">
                {stockInfo?.name || getStockNameByCode(ticker)} ({ticker})
              </CardTitle>
              <div className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium",
                isConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? "실시간" : "연결 끊김"}
              </div>
              {stockInfo?.sector && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {stockInfo.sector}
                </span>
              )}
            </div>

            <div className="flex items-center text-right">
              {stockInfo ? (
                <>
                  {/*<div className={cn(*/}
                  {/*  "text-2xl font-bold",*/}
                  {/*  stockInfo.changeAmount >= 0 ? "text-red-600" : "text-blue-600"*/}
                  {/*)}>*/}
                  {/*  {stockInfo.currentPrice.toLocaleString()}원*/}
                  {/*</div>*/}
                  {/*<div className={cn(*/}
                  {/*  "text-sm font-medium flex items-center gap-1 justify-end",*/}
                  {/*  stockInfo.changeAmount >= 0 ? "text-red-500" : "text-blue-500"*/}
                  {/*)}>*/}
                  {/*  {stockInfo.changeAmount >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}*/}
                  {/*  <span>*/}
                  {/*    {stockInfo.changeAmount >= 0 ? "+" : ""}{stockInfo.changeAmount.toLocaleString()}원 */}
                  {/*    ({stockInfo.changeAmount >= 0 ? "+" : ""}{stockInfo.changeRate.toFixed(2)}%)*/}
                  {/*  </span>*/}
                  {/*</div>*/}
                  <div className="text-base text-gray-500">
                    거래량: {stockInfo.volume.toLocaleString()}
                  </div>
                </>
              ) : realtimeData ? (
                <>
                  <div className="text-2xl font-bold">
                    {realtimeData.price.toLocaleString()}원
                  </div>
                  <div className="text-base text-gray-500">
                    거래량: {realtimeData.volume.toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="text-gray-400">로딩 중...</div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 차트 탭 */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as "daily" | "weekly")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span>일봉</span>
                    <button
                      onClick={() => { setChartTermSlideIndex(0); setShowChartTermPopup(true); }}
                      className="text-gray-400 hover:text-[#009178] transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </div>
                  {/*<span className="text-xs opacity-70">최대 1년</span>*/}
                </div>
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span>주봉</span>
                    <button
                      onClick={() => { setChartTermSlideIndex(1); setShowChartTermPopup(true); }}
                      className="text-gray-400 hover:text-[#009178] transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </div>
                  {/* <span className="text-xs opacity-70">1년</span> */}
                </div>
              </TabsTrigger>
            </TabsList>
            
            {/* 컴팩트 차트 설정 */}
            {chartType === "daily" && (
              <div className="mt-4">
                <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">

                    {/* 기간 선택 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">기간</span>
                      <div className="flex gap-1">
                        {[
                          { value: "1w", label: "1주" },
                          { value: "1m", label: "1개월" },
                          { value: "1y", label: "1년" }
                        ].map((period) => (
                            <button
                                key={period.value}
                                onClick={() => setChartPeriod(period.value)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
                                    chartPeriod === period.value
                                        ? "bg-[#009178] text-white border border-[#009178]"
                                        : "bg-white text-gray-600 hover:bg-[#009178]/10 hover:text-[#009178] border border-gray-200"
                                )}
                            >
                              {period.label}
                            </button>
                        ))}
                      </div>
                    </div>

                    {/* 구분선 */}
                    <div className="w-px h-6 bg-gray-200"></div>

                    {/* 차트 타입 선택 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">타입</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setChartDisplay("line")}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                            chartDisplay === "line"
                              ? "bg-blue-500 text-white border border-blue-500"
                              : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                          )}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M3 17L9 11L13 15L21 7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          라인
                        </button>
                        
                        <button
                          onClick={() => setChartDisplay("candle")}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                            chartDisplay === "candle"
                              ? "bg-red-500 text-white border border-red-500"
                              : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200"
                          )}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="8" width="6" height="8" fill="currentColor" rx="1"/>
                            <line x1="12" y1="4" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
                            <line x1="12" y1="16" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          캔들
                        </button>
                      </div>
                    </div>

                    {/* 상태 표시 */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="whitespace-nowrap">실시간</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 주봉 차트 설정 */}
            {chartType === "weekly" && (
              <div className="mt-4">
                <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">

                    {/* 차트 타입 선택 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">타입</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setChartDisplay("line")}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                            chartDisplay === "line"
                              ? "bg-blue-500 text-white border border-blue-500"
                              : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                          )}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M3 17L9 11L13 15L21 7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          라인
                        </button>
                        
                        <button
                          onClick={() => setChartDisplay("candle")}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                            chartDisplay === "candle"
                              ? "bg-red-500 text-white border border-red-500"
                              : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200"
                          )}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="8" width="6" height="8" fill="currentColor" rx="1"/>
                            <line x1="12" y1="4" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
                            <line x1="12" y1="16" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          캔들
                        </button>
                      </div>
                    </div>

                    {/* 상태 표시 */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="whitespace-nowrap">실시간</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Tabs>
        </CardHeader>
        
        <CardContent>
          <div className="h-80">
            {chartDisplay === "candle" ? (
              <div ref={candleChartRef} className="w-full h-full" />
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartDisplay === "line" ? (
                // 라인 차트 (기존)
                <ComposedChart data={chartDataWithRealtime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => {
                      if (chartType === "daily") {
                        return value.slice(4, 6) + "/" + value.slice(6, 8)
                      } else if (chartType === "weekly") {
                        // 주봉 날짜 형식: YYYYMMDD -> MM/DD (일봉과 동일)
                        return value.slice(4, 6) + "/" + value.slice(6, 8)
                      }
                      return value
                    }}
                  />
                  <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (name === 'volume') {
                        return [value?.toLocaleString() + '주', '거래량']
                      }
                      return [value?.toLocaleString() + '원', 
                        name === 'open' ? '시가' : 
                        name === 'high' ? '고가' : 
                        name === 'low' ? '저가' : 
                        name === 'close' ? '종가' : name
                      ]
                    }}
                    labelFormatter={(label) => {
                      if (chartType === "daily") {
                        return `${label.slice(0,4)}-${label.slice(4,6)}-${label.slice(6,8)}`
                      } else if (chartType === "weekly") {
                        // 주봉 툴팁 날짜 형식: YYYYMMDD -> YYYY-MM-DD (일봉과 동일)
                        return `${label.slice(0,4)}-${label.slice(4,6)}-${label.slice(6,8)}`
                      }
                      return `날짜: ${label}`
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  
                  {/* 고가-저가 선 */}
                  <Line
                    type="monotone"
                    dataKey="high"
                    stroke="#ef4444"
                    strokeWidth={1}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="low"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dot={false}
                    connectNulls={false}
                  />
                  
                  {/* 종가 영역 차트 */}
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#009178"
                    fill="#009178"
                    fillOpacity={0.15}
                    strokeWidth={3}
                  />
                  
                  {/* 시가 점선 */}
                  <Line
                    type="monotone"
                    dataKey="open"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    connectNulls={false}
                  />
                  
                  {/* 거래량 */}
                  <Bar 
                    dataKey="volume" 
                    fill="#e5e7eb" 
                    opacity={0.2}
                    yAxisId="volume"
                  />
                </ComposedChart>
              ) : (
                // 캔들 차트 (시각적 근사)
                <ComposedChart data={chartDataWithRealtime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => {
                      if (chartType === "daily") {
                        return value.slice(4, 6) + "/" + value.slice(6, 8)
                      } else if (chartType === "weekly") {
                        // 주봉 날짜 형식: YYYYMMDD -> MM/DD (일봉과 동일)
                        return value.slice(4, 6) + "/" + value.slice(6, 8)
                      }
                      return value
                    }}
                  />
                  <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (name === 'volume') {
                        return [value?.toLocaleString() + '주', '거래량']
                      }
                      return [value?.toLocaleString() + '원', 
                        name === 'open' ? '시가' : 
                        name === 'high' ? '고가' : 
                        name === 'low' ? '저가' : 
                        name === 'close' ? '종가' : name
                      ]
                    }}
                    labelFormatter={(label) => {
                      if (chartType === "daily") {
                        return `${label.slice(0,4)}-${label.slice(4,6)}-${label.slice(6,8)}`
                      } else if (chartType === "weekly") {
                        // 주봉 툴팁 날짜 형식: YYYYMMDD -> YYYY-MM-DD (일봉과 동일)
                        return `${label.slice(0,4)}-${label.slice(4,6)}-${label.slice(6,8)}`
                      }
                      return `날짜: ${label}`
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  
                  {/* 고가-저가 선 (심지) */}
                  <Line
                    type="monotone"
                    dataKey="high"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 1 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="low"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 1 }}
                    connectNulls={false}
                  />
                  
                  {/* 시가 선 */}
                  <Line
                    type="monotone"
                    dataKey="open"
                    stroke="#f59e0b"
                    strokeWidth={4}
                    dot={{ fill: '#f59e0b', strokeWidth: 0, r: 2 }}
                    connectNulls={false}
                    strokeDasharray="8 4"
                  />
                  
                  {/* 종가 선 (강조) */}
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#009178"
                    strokeWidth={5}
                    dot={{ fill: '#009178', strokeWidth: 2, stroke: '#ffffff', r: 3 }}
                    connectNulls={false}
                  />
                  
                  {/* 거래량 */}
                  <Bar 
                    dataKey="volume" 
                    fill="#e5e7eb" 
                    opacity={0.2}
                    yAxisId="volume"
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 차트 용어 설명 ? 아이콘 (차트 하단) */}
      <div className="flex justify-end mt-2">
        <button
          onClick={() => { setChartTermSlideIndex(2); setShowChartTermPopup(true); }}
          className="flex items-center gap-1 text-gray-400 hover:text-[#009178] transition-colors text-xs"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="underline">차트 용어</span>
        </button>
      </div>

      {/* 차트 용어 슬라이드 팝업 */}
      <ChartTermSlidesPopup
        slides={chartTermSlides}
        slideIndex={chartTermSlideIndex}
        setSlideIndex={setChartTermSlideIndex}
        isVisible={showChartTermPopup}
        onClose={() => setShowChartTermPopup(false)}
      />
    </div>
  )
}

// ChartTermSlidesPopup 컴포넌트 구현 (framer-motion으로 슬라이드 애니메이션)
function ChartTermSlidesPopup({ slides, slideIndex, setSlideIndex, isVisible, onClose }: ChartTermSlidesPopupProps) {
  if (!isVisible) return null
  const slide = slides[slideIndex]
  return (
    <div className="fixed z-50 bg-black/20 flex items-center justify-center" style={{ top: '0px', left: '0px', right: '0px', bottom: '0px', margin: '0px' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 ${slide.border}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#009178] transition-all duration-900 rounded-full p-1 hover:bg-gray-100 hover:rotate-90"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
        {/* 제목 */}
                 {slide.key === 'highlow' ? (
           <h3 className="text-base font-bold mb-3">
             <span className="text-red-500">고가(High)</span>
             <span className="text-gray-500"> / </span>
             <span className="text-blue-500">저가(Low)</span>
           </h3>
         ) : (
          <h3 className={`text-base font-bold mb-3 ${slide.color || ''}`}>{slide.title}</h3>
        )}
        {/* 설명 */}
        <div className="text-sm leading-relaxed text-gray-700 space-y-2 mb-2">
          <p>{slide.desc}</p>
        </div>
        {/* 네비게이션 */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setSlideIndex((i: number) => Math.max(0, i - 1))}
            disabled={slideIndex === 0}
            className="px-3 py-1 rounded bg-gray-100 text-gray-500 transition-colors duration-200 hover:bg-[#009178]/10 hover:text-[#009178] disabled:opacity-50 disabled:cursor-not-allowed"
          >이전</button>
          <div className="text-xs text-gray-400">{slideIndex + 1} / {slides.length}</div>
          <button
            onClick={() => setSlideIndex((i: number) => Math.min(slides.length - 1, i + 1))}
            disabled={slideIndex === slides.length - 1}
            className="px-3 py-1 rounded bg-gray-100 text-gray-500 transition-colors duration-200 hover:bg-[#009178]/10 hover:text-[#009178] disabled:opacity-50 disabled:cursor-not-allowed"
          >다음</button>
        </div>
      </motion.div>
    </div>
  )
}

// ChartTermSlidesPopupProps 타입 정의
type ChartTermSlide = {
  key: string
  title: string
  color: string
  border: string
  desc: string
  sub?: { label: string; color: string; value: string }[]
}

interface ChartTermSlidesPopupProps {
  slides: ChartTermSlide[]
  slideIndex: number
  setSlideIndex: React.Dispatch<React.SetStateAction<number>>
  isVisible: boolean
  onClose: () => void
}