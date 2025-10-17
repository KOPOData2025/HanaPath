"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {RotateCw, Star, Menu, X, ChevronLeft, Plus, ChevronRight, ChevronDown, ChevronUp, BarChart3, Heart, ChevronsLeft, ChevronsRight, TrendingUp, TrendingDown, Eye, EyeOff, CircleDollarSign, Wallet, Layers, Calendar, Banknote, Search, Share, Maximize2, Clover, FileText, FolderOpen, BriefcaseBusiness } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { PortfolioCharts } from "@/components/charts/portfolio-charts"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react"
import { getHoldings, getTransactions, type TransactionResponse, getFavorites, type FavoriteResponse, removeFavorite } from "@/lib/api/investment"
import { useAuthStore } from "@/store/auth"
import { Toaster } from "@/components/ui/toaster"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { getInvestmentAccount, getInvestmentAccountBalance } from "@/lib/api/wallet"
import { upsertClientSnapshot } from "@/lib/api/performance"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function PortfolioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [holdings, setHoldings] = useState<{ name: string; symbol: string; shares: number; avgPrice: number; currentPrice: number; value: number; profit: number; profitRate: number; logo?: string }[]>([])
  const [transactions, setTransactions] = useState<TransactionResponse[]>([])
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([])
  const [favPage, setFavPage] = useState(0)
  const favSize = 5
  const [txPage, setTxPage] = useState(0)
  const txSize = 4
  const [txTotal, setTxTotal] = useState(0)
  const [txLoading, setTxLoading] = useState(false)
  const [investmentBalance, setInvestmentBalance] = useState<number>(0)
  const [pagePostBalances, setPagePostBalances] = useState<number[]>([])
  const [realizedProfit, setRealizedProfit] = useState<number>(0)
  const [realizedCostBasis, setRealizedCostBasis] = useState<number>(0)
  const [lastTxDate, setLastTxDate] = useState<string | null>(null)
  const [initialPrincipalBackend, setInitialPrincipalBackend] = useState<number>(0)
  const { user } = useAuthStore()
  // const { toast } = useToast()
  // 데이터 준비 플래그들 + 초기 업서트 1회 실행 제어
  const [holdingsReady, setHoldingsReady] = useState(false)
  const [transactionsReady, setTransactionsReady] = useState(false)
  const [balanceReady, setBalanceReady] = useState(false)
  const [initialPrincipalReady, setInitialPrincipalReady] = useState(false)
  const [realizedReady, setRealizedReady] = useState(false)
  const didInitialUpsertRef = useRef(false)
  const [chartRefreshKey, setChartRefreshKey] = useState(0)

  // 수평 슬라이더 상태/제어
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [currentSlide, setCurrentSlide] = useState(() => {
    const param = searchParams.get('slide') ?? searchParams.get('section') ?? searchParams.get('tab')
    if (!param) return 0
    const normalized = param.toLowerCase()
    if (["transactions", "tx", "history"].includes(normalized)) return 3
    const n = Number(param)
    if (!Number.isNaN(n)) {
      // 사람 기준(1~4) 입력은 0-based로 변경, 0~3 입력은 그대로 사용
      if (n >= 1 && n <= 4) return n - 1
      if (n >= 0 && n <= 3) return n
    }
    return 0
  })
  const totalSlides = 4
  const isAnimatingRef = useRef(false)
  const [isWrapping, setIsWrapping] = useState(true)
  const [sliderReady, setSliderReady] = useState(false)
  const suppressScrollRef = useRef(true)
  // 부드러운 스크롤 애니메이션 (requestAnimationFrame + easing)
  const animateScrollLeft = (
    element: HTMLDivElement,
    to: number,
    duration = 450,
    onComplete?: () => void
  ) => {
    isAnimatingRef.current = true
    const start = element.scrollLeft
    const change = to - start
    if (change === 0 || duration <= 0) {
      element.scrollLeft = to
      onComplete?.()
      isAnimatingRef.current = false
      return
    }
    const startTime = performance.now()
    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const step = () => {
      const now = performance.now()
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = easeInOutCubic(progress)
      element.scrollLeft = start + change * eased
      if (progress < 1) requestAnimationFrame(step)
      else {
        onComplete?.()
        isAnimatingRef.current = false
      }
    }
    requestAnimationFrame(step)
  }
  const scrollToSlide = (idx: number, direction?: 1 | -1) => {
    const el = sliderRef.current
    if (!el) return
    // 순환 인덱스 (0..totalSlides-1)
    const target = ((idx % totalSlides) + totalSlides) % totalSlides
    const width = el.clientWidth
    const currentActual = currentSlide + 1 // 클론 앞단 1칸 보정

    // 경계 래핑 애니메이션 처리 (사용자 상호작용이 있을 때만 래핑)
    if (direction === 1 && currentSlide === totalSlides - 1 && target === 0) {
      // 마지막 -> 첫번째: 오른쪽 클론으로 이동 애니메이션 후 실제 첫번째로 점프
      const rightCloneIndex = totalSlides + 1
      setIsWrapping(true)
      animateScrollLeft(el, rightCloneIndex * width, 450, () => {
        // 스냅/스무스 비활성 상태에서 즉시 점프
        el.scrollLeft = 1 * width
        setCurrentSlide(0)
        // 다음 프레임에 래핑 종료하여 스냅/스무스 복구
        requestAnimationFrame(() => setIsWrapping(false))
      })
      return
    }
    if (direction === -1 && currentSlide === 0 && target === totalSlides - 1) {
      // 첫번째 -> 마지막: 왼쪽 클론으로 이동 애니메이션 후 실제 마지막으로 점프
      const leftCloneIndex = 0
      setIsWrapping(true)
      animateScrollLeft(el, leftCloneIndex * width, 450, () => {
        el.scrollLeft = totalSlides * width
        setCurrentSlide(totalSlides - 1)
        requestAnimationFrame(() => setIsWrapping(false))
      })
      return
    }

    // 일반 이동: 실제 인덱스 = target + 1
    const targetActual = target + 1
    animateScrollLeft(el, targetActual * width, 500, () => setCurrentSlide(target))
  }
  const handleSliderScroll = () => {
    const el = sliderRef.current
    if (!el) return
    if (!sliderReady || suppressScrollRef.current) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    // 초기 안정화 구간 동안 스크롤 이벤트 무시
    if (suppressScrollRef.current) return
    const totalWithClones = totalSlides + 2
    // 애니메이션 중에는 상태 업데이트를 건너뛰되, 경계 클론 위치에서는 즉시 보정
    if (idx <= 0) {
      const width = el.clientWidth
      setIsWrapping(true)
      el.scrollLeft = totalSlides * width
      setCurrentSlide(totalSlides - 1)
      requestAnimationFrame(() => setIsWrapping(false))
      return
    }
    if (idx >= totalWithClones - 1) {
      const width = el.clientWidth
      setIsWrapping(true)
      el.scrollLeft = 1 * width
      setCurrentSlide(0)
      requestAnimationFrame(() => setIsWrapping(false))
      return
    }
    if (isAnimatingRef.current) return
    const logical = idx - 1
    if (logical !== currentSlide) setCurrentSlide(logical)
  }

  // 초기 위치를 실제 첫번째(클론 보정)로 세팅, 리사이즈 시에도 보정
  useLayoutEffect(() => {
    const el = sliderRef.current
    if (!el) return
    // 한 슬라이드 이동 단위 = 컨테이너 너비 + column gap(슬라이드 간격)
    const readStep = () => {
      const width = el.clientWidth || el.getBoundingClientRect().width
      const cs = getComputedStyle(el)
      const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0
      return width + gap
    }
    const sync = () => {
      const step = readStep()
      el.scrollLeft = (currentSlide + 1) * step
    }
    const init = () => {
      const step = readStep()
      if (step > 0) {
        el.scrollLeft = (currentSlide + 1) * step
        // 스냅 비활성 상태에서 위치 고정 → 다음 프레임에 준비 완료 → 그 다음 프레임에 스냅 복구/스크롤 허용
        requestAnimationFrame(() => {
          setSliderReady(true)
          requestAnimationFrame(() => {
            suppressScrollRef.current = false
            setIsWrapping(false)
          })
        })
      } else {
        requestAnimationFrame(init)
      }
    }
    init()
    const ro = new ResizeObserver(() => {
      if (!sliderReady) return
      sync()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const getCachedPrice = (ticker: string): number | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(`price_cache_${ticker}`)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { price: number; ts: number }
      if (typeof parsed?.price === 'number' && parsed.price > 0) {
        return parsed.price
      }
      return null
    } catch {
      return null
    }
  }

  const setCachedPrice = (ticker: string, price: number) => {
    if (typeof window === 'undefined') return
    try {
      if (price > 0) {
        localStorage.setItem(`price_cache_${ticker}`, JSON.stringify({ price, ts: Date.now() }))
      }
    } catch {}
  }

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return
      try {
        const data = await getHoldings(user.id)
        // 각 종목 현재가 조회 (병렬)
        const withPrices = await Promise.all(
          data.map(async (h) => {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/chart/${h.ticker}/info`)
              if (!res.ok) throw new Error(String(res.status))
              const info = await res.json()
              const fetched = Number(info?.currentPrice) || 0
              const fromCache = getCachedPrice(h.ticker)
              const currentPrice = fetched > 0 ? fetched : (fromCache ?? 0)
              if (fetched > 0) setCachedPrice(h.ticker, fetched)
              const avgPrice = Number(h.averagePrice) || 0
              const shares = h.quantity
              const cost = avgPrice * shares
              const effectivePrice = currentPrice > 0 ? currentPrice : avgPrice
              const value = effectivePrice * shares
              const profit = value - cost
              const profitRate = cost > 0 ? (profit / cost) * 100 : 0
              return {
                name: h.name,
                symbol: h.ticker,
                shares,
                avgPrice,
                currentPrice: effectivePrice,
                value,
                profit,
                profitRate,
                logo: `/stock-logos/${h.ticker}.png`,
              }
            } catch (_) {
              const avgPrice = Number(h.averagePrice) || 0
              const shares = h.quantity
              const cost = avgPrice * shares
              const fromCache = getCachedPrice(h.ticker)
              const effectivePrice = fromCache && fromCache > 0 ? fromCache : avgPrice
              return {
                name: h.name,
                symbol: h.ticker,
                shares,
                avgPrice,
                currentPrice: effectivePrice,
                value: effectivePrice * shares,
                profit: effectivePrice * shares - cost,
                profitRate: cost > 0 ? (((effectivePrice * shares - cost) / cost) * 100) : 0,
                logo: `/stock-logos/${h.ticker}.png`,
              }
            }
          })
        )
        setHoldings(withPrices)

        const fav = await getFavorites(user.id)
        setFavorites(fav)
      } catch (e) {
        console.error(e)
      } finally {
        setHoldingsReady(true)
      }
    }
    run()
  }, [user?.id])

  // 최근 거래 내역 페이지네이션 로드
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        setTxLoading(true)
        const tx = await getTransactions(user.id, txPage, txSize)
        setTransactions(tx.transactions)
        setTxTotal(tx.total || 0)
      } catch (e) {
        // noop
      } finally {
        setTxLoading(false)
        setTransactionsReady(true)
      }
    }
    load()
  }, [user?.id, txPage])

  // 현재 페이지 항목별 "거래 직후 잔액" 계산 (investmentBalance가 준비된 후에도 재계산)
  useEffect(() => {
    const compute = async () => {
      if (!user?.id) return
      if (!transactions || transactions.length === 0) {
        setPagePostBalances([])
        setRealizedReady(true)
        return
      }
      const computeBalances = (txs: TransactionResponse[]): number[] => {
        let running = investmentBalance
        const result: number[] = []
        for (let i = 0; i < txs.length; i++) {
          if (i === 0) {
            result.push(running)
          } else {
            const prev = txs[i - 1]
            const prevAmount = Math.abs(prev.amount)
            const prevEffect = prev.type === 'BUY' ? -prevAmount : prevAmount
            running = running - prevEffect
            result.push(running)
          }
        }
        return result
      }

      if (txPage === 0) {
        setPagePostBalances(computeBalances(transactions))
      } else {
        const uptoSize = (txPage + 1) * txSize
        const all = await getTransactions(user.id, 0, uptoSize)
        const allBalances = computeBalances(all.transactions)
        const start = txPage * txSize
        setPagePostBalances(allBalances.slice(start, start + transactions.length))
      }
    }
    compute()
  }, [user?.id, txPage, transactions, investmentBalance])

  // 모의투자 계좌 잔액 조회
  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.id) return
      try {
        const bal = await getInvestmentAccountBalance(user.id)
        const value = typeof bal === 'number' ? bal : (Number(bal?.balance) || 0)
        setInvestmentBalance(value)
      } catch (_) {
        setInvestmentBalance(0)
      } finally {
        setBalanceReady(true)
      }
    }
    loadBalance()
  }, [user?.id])

  // 초기 원금은 무조건 7,770,000원 사용
  useEffect(() => {
    setInitialPrincipalBackend(7770000)
    setInitialPrincipalReady(true)
  }, [user?.id])

  // 전체 거래를 불러 실현손익 계산 (이동평균 원가법)
  useEffect(() => {
    const calcRealized = async () => {
      if (!user?.id) return
      try {
        const pageSize = 200
        let page = 0
        let all: TransactionResponse[] = []
        while (true) {
          const res = await getTransactions(user.id, page, pageSize)
          all = all.concat(res.transactions)
          if (res.transactions.length < pageSize || all.length >= (res.total || 0)) break
          page += 1
        }

        // 오래된 순으로 정렬해 이동평균 계산 (종목별 분리)
        const sorted = all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        // 종목별 상태 맵
        const tickerToAvgCost = new Map<string, number>()
        const tickerToShares = new Map<string, number>()

        let realized = 0
        let realizedCost = 0

        for (const t of sorted) {
          const ticker = String((t as any).ticker ?? '')
          const price = Number(t.pricePerShare) || 0
          const qty = Number(t.quantity) || 0
          if (!ticker) continue

          const prevShares = tickerToShares.get(ticker) ?? 0
          const prevAvgCost = tickerToAvgCost.get(ticker) ?? 0

          if (t.type === 'BUY') {
            const newCostTotal = prevAvgCost * prevShares + price * qty
            const newShares = prevShares + qty
            const newAvgCost = newShares > 0 ? newCostTotal / newShares : 0
            tickerToShares.set(ticker, newShares)
            tickerToAvgCost.set(ticker, newAvgCost)
          } else {
            // SELL: (매도가 - 종목별 평균원가) * 수량
            realized += (price - prevAvgCost) * qty
            realizedCost += prevAvgCost * qty

            const remainingShares = prevShares - qty
            tickerToShares.set(ticker, Math.max(0, remainingShares))
            if (remainingShares <= 0) {
              tickerToAvgCost.set(ticker, 0)
            }
          }
        }
        setRealizedProfit(realized)
        setRealizedCostBasis(realizedCost)
      } catch (_) {
        setRealizedProfit(0)
        setRealizedCostBasis(0)
      } finally {
        setRealizedReady(true)
      }
    }
    calcRealized()
  }, [user?.id, txTotal])

  // 10초 주기 현재가 재조회 (보유 종목 + 가격만 갱신)
  useEffect(() => {
    if (!user?.id) return
    let isCancelled = false

    const refresh = async () => {
      try {
        const data = await getHoldings(user.id)
        const withPrices = await Promise.all(
          data.map(async (h) => {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/chart/${h.ticker}/info`)
              if (!res.ok) throw new Error(String(res.status))
              const info = await res.json()
              const fetched = Number(info?.currentPrice) || 0
              const fromCache = getCachedPrice(h.ticker)
              const currentPrice = fetched > 0 ? fetched : (fromCache ?? 0)
              if (fetched > 0) setCachedPrice(h.ticker, fetched)
              const avgPrice = Number(h.averagePrice) || 0
              const shares = h.quantity
              const cost = avgPrice * shares
              const effectivePrice = currentPrice > 0 ? currentPrice : avgPrice
              const value = effectivePrice * shares
              const profit = value - cost
              const profitRate = cost > 0 ? (profit / cost) * 100 : 0
              return {
                name: h.name,
                symbol: h.ticker,
                shares,
                avgPrice,
                currentPrice: effectivePrice,
                value,
                profit,
                profitRate,
                logo: `/stock-logos/${h.ticker}.png`,
              }
            } catch (_) {
              const avgPrice = Number(h.averagePrice) || 0
              const shares = h.quantity
              const cost = avgPrice * shares
              const fromCache = getCachedPrice(h.ticker)
              const effectivePrice = fromCache && fromCache > 0 ? fromCache : avgPrice
              return {
                name: h.name,
                symbol: h.ticker,
                shares,
                avgPrice,
                currentPrice: effectivePrice,
                value: effectivePrice * shares,
                profit: effectivePrice * shares - cost,
                profitRate: cost > 0 ? (((effectivePrice * shares - cost) / cost) * 100) : 0,
                logo: `/stock-logos/${h.ticker}.png`,
              }
            }
          })
        )
        if (!isCancelled) setHoldings(withPrices)
      } catch (_) {}
    }

    const id = setInterval(refresh, 10000)
    // 즉시 1회 실행하여 첫 주기 기다림 방지
    refresh()

    return () => {
      isCancelled = true
      clearInterval(id)
    }
  }, [user?.id])

  const totalValue = useMemo(() => holdings.reduce((sum, s) => sum + s.value, 0), [holdings])
  const unrealizedProfit = useMemo(() => holdings.reduce((sum, s) => sum + s.profit, 0), [holdings])
  const totalCostCurrent = useMemo(() => holdings.reduce((sum, s) => sum + s.avgPrice * s.shares, 0), [holdings])
  const combinedProfit = unrealizedProfit + realizedProfit
  const combinedCostBasis = totalCostCurrent + realizedCostBasis
  const totalAssets = useMemo(() => totalValue + investmentBalance, [totalValue, investmentBalance])
  const initialPrincipal = useMemo(() => {
    // 우선순위: 백엔드 제공값 > 역산값
    if (initialPrincipalBackend && initialPrincipalBackend > 0) return initialPrincipalBackend
    const inferred = totalAssets - combinedProfit
    return inferred > 0 ? inferred : 0
  }, [initialPrincipalBackend, totalAssets, combinedProfit])
  const totalProfitRate = initialPrincipal > 0 ? (combinedProfit / initialPrincipal) * 100 : 0
  const txTotalPages = useMemo(() => Math.max(1, Math.ceil(txTotal / txSize)), [txTotal])
  const valueRatio = useMemo(() => (totalAssets > 0 ? totalValue / totalAssets : 0), [totalAssets, totalValue])
  const cashRatio = useMemo(() => (totalAssets > 0 ? investmentBalance / totalAssets : 0), [totalAssets, investmentBalance])
  const favTotalPages = useMemo(() => Math.max(1, Math.ceil(favorites.length / favSize)), [favorites.length])
  const pagedFavorites = useMemo(() => {
    const start = favPage * favSize
    return favorites.slice(start, start + favSize)
  }, [favorites, favPage])
  const favPlaceholders = useMemo(() => Math.max(0, favSize - pagedFavorites.length), [pagedFavorites.length])

  // 보유 종목 페이징 (3개씩)
  const [holdPage, setHoldPage] = useState(0)
  const holdSize = 3
  const holdTotalPages = useMemo(() => Math.max(1, Math.ceil(holdings.length / holdSize)), [holdings.length])
  const pagedHoldings = useMemo(() => {
    const start = holdPage * holdSize
    return holdings.slice(start, start + holdSize)
  }, [holdings, holdPage])

  // 23:50 KST에 당일 수익률 업서트 + 보정 (초기 업서트는 데이터 준비 후 1회만)
  useEffect(() => {
    if (!user?.id) return
    let timer: any

    const now = new Date()
    // KST 기준으로 다음 23:50 계산
    const toKst = (d: Date) => new Date(d.getTime() + (9 * 60 - d.getTimezoneOffset()) * 60 * 1000)
    const fromKst = (d: Date) => new Date(d.getTime() - (9 * 60 - new Date().getTimezoneOffset()) * 60 * 1000)

    const kstNow = toKst(now)
    const kstTarget = new Date(kstNow)
    kstTarget.setHours(23, 50, 0, 0)
    if (kstNow.getTime() >= kstTarget.getTime()) {
      // 이미 23:50 지났다면 내일 23:50로 설정
      kstTarget.setDate(kstTarget.getDate() + 1)
    }
    const schedule = () => {
      const now2 = new Date()
      const kstNow2 = toKst(now2)
      const kstTarget2 = new Date(kstNow2)
      kstTarget2.setHours(23, 50, 0, 0)
      if (kstNow2.getTime() >= kstTarget2.getTime()) kstTarget2.setDate(kstTarget2.getDate() + 1)
      const waitMs = Math.max(0, kstTarget2.getTime() - kstNow2.getTime())
      timer = setTimeout(async () => {
        try {
          await upsertClientSnapshot(user.id, Number(totalProfitRate.toFixed(2)))
        } catch (e) {
          console.error('snapshot@2350 failed', e)
        }
        schedule()
      }, waitMs)
    }

    schedule()

    // 보정: 데이터 준비가 된 경우에만 1회 업서트
    if (!didInitialUpsertRef.current && (holdingsReady && transactionsReady && balanceReady && initialPrincipalReady && realizedReady)) {
      didInitialUpsertRef.current = true
      ;(async () => {
        try {
          await upsertClientSnapshot(user.id, Number(totalProfitRate.toFixed(2)))
          // 업서트 직후 차트 리프레시 트리거
          setChartRefreshKey((k) => k + 1)
        } catch (e) {
          console.error('initial snapshot upsert failed', e)
        }
      })()
    }

    return () => { if (timer) clearTimeout(timer) }
  }, [user?.id, totalProfitRate, holdingsReady, transactionsReady, balanceReady, initialPrincipalReady, realizedReady])

  // 총 자산 가시성/전일 대비
  const [showAmounts, setShowAmounts] = useState(true)

  useEffect(() => {
    if (favPage > favTotalPages - 1) setFavPage(0)
  }, [favTotalPages])

  useEffect(() => {
    const loadLatest = async () => {
      if (!user?.id) return
      try {
        const r = await getTransactions(user.id, 0, 1)
        setLastTxDate(r.transactions?.[0]?.createdAt ?? null)
      } catch (_) {
        setLastTxDate(null)
      }
    }
    loadLatest()
  }, [user?.id, txTotal])

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}.${m}.${day}`
    } catch {
      return ''
    }
  }

  // 거래 내역 날짜별 그룹핑
  const groupedTransactions = useMemo((): [string, { tx: TransactionResponse; idx: number }[] ][] => {
    const groups = new Map<string, { tx: TransactionResponse; idx: number }[]>()
    transactions.forEach((tx, idx) => {
      const dateKey = formatDate(tx.createdAt) || ''
      const arr = groups.get(dateKey) ?? []
      arr.push({ tx, idx })
      groups.set(dateKey, arr)
    })
    return Array.from(groups.entries())
  }, [transactions])

  // 잔액은 리스트 하단에서 표기하므로 항목별 계산은 제거
  const handleUnfavorite = async (ticker: string, name: string) => {
    if (!user?.id) return
    try {
      await removeFavorite(user.id, ticker)
      setFavorites((prev) => prev.filter((f) => f.ticker !== ticker))
      // no toast for favorites
    } catch (e: any) {
      // no toast for favorites
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-full">
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
          <motion.div variants={itemVariants}>
            <Link href="/" className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              대시보드로 돌아가기
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">모의 투자</h1>
          </motion.div>

          {/* 슬라이드 컨테이너: 0) 즐겨찾기+보유 미리보기  1) 기존 전체 콘텐츠 */}
          <div className="relative">
            <div className="absolute right-0 -top-10 md:-top-12 z-20 hidden md:flex gap-2" onMouseDown={() => { suppressScrollRef.current = false }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollToSlide(currentSlide - 1, -1)}
                aria-label="이전 슬라이드"
                title="이전"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollToSlide(currentSlide + 1, 1)}
                aria-label="다음 슬라이드"
                title="다음"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div
              ref={sliderRef}
              onScroll={handleSliderScroll}
              className={cn("flex overflow-x-auto gap-8", isWrapping ? "snap-none" : "snap-x snap-mandatory", isWrapping ? "" : "scroll-smooth")}
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {/* 왼쪽 클론: 마지막 슬라이드 (빈 섹션로 만 유지) */}
              <section className="min-w-full snap-start" aria-hidden />

              {/* Slide 0: 포트폴리오 요약 + 즐겨찾기 */}
              <section className="min-w-full snap-start" onTouchStart={() => { suppressScrollRef.current = false }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="relative overflow-hidden border border-neutral-200/70 h-full bg-white rounded-2xl">
                       {/* 상단 바 */}
                       <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-neutral-50 to-neutral-200/70 rounded-t-2xl" />
                      <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-center h-12 px-4 gap-x-4 md:gap-x-6 lg:gap-x-8">
                        {/* 좌측 시스템 버튼들 */}
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full bg-[#FF5F57]" aria-label="Close" />
                          <span className="inline-block w-3 h-3 rounded-full bg-[#FFBD2E]" aria-label="Minimize" />
                          <span className="inline-block w-3 h-3 rounded-full bg-[#28C840]" aria-label="Zoom" />
                        </div>
                        {/* 중앙 주소창 */}
                        <div className="justify-self-start w-full max-w-md md:max-w-lg lg:max-w-xl ml-2 md:ml-3 lg:ml-4 mr-12 md:mr-16 lg:mr-20">
                          <div className="flex items-center gap-2 h-7 px-3 rounded-full bg-white/60 ring-1 ring-black/5">
                            <Search className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="text-[12px] text-neutral-500">portfolio</span>
                          </div>
                        </div>
                        {/* 우측 툴 아이콘 */}
                        <div className="justify-self-end flex items-center gap-4 text-neutral-600">
                          <RotateCw className="w-4 h-4" />
                          <Star className="w-4 h-4" />
                          <Menu className="w-4 h-4" />
                        </div>
                      </div>
                      <CardHeader className="relative z-10 pt-6">
                        <CardTitle className="text-xl font-bold mt-2 text-gray-700 inline-flex items-center gap-2">
                          <FolderOpen className="w-5 h-5 text-slate-600" />
                          포트폴리오 요약
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 pt-2">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1 p-3 h-[260px] lg:h-[360px] self-start flex flex-col gap-3 relative group">
                            {/* 호버 말풍선 (왼쪽 영역 전체에 반응) */}
                            <div
                              aria-hidden
                              className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 scale-95 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200"
                            >
                              <div className="flex items-center gap-2 rounded-full bg-white/90 ring-1 ring-black/5 shadow px-4 py-1.5 text-[13px] text-gray-700">
                                <Clover className="w-4 h-4 text-emerald-500" />
                                행운을 빌어요!
                              </div>
                            </div>
                            <div className="w-full flex items-center justify-center">
                              <img src="/portfolio.png" alt="포트폴리오 이미지" className="max-h-44 lg:max-h-60 w-auto object-contain" />
                            </div>
                            <div className="w-full">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-600">총 자산</span>
                                <span className="text-sm font-semibold text-gray-800">{totalAssets.toLocaleString()}원</span>
                              </div>
                              <TooltipProvider delayDuration={0} skipDelayDuration={0}>
                                <div className="w-full h-6 rounded-full bg-gray-100 overflow-hidden flex">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="h-full bg-emerald-400/80"
                                        style={{ width: `${Math.min(100, Math.max(0, valueRatio * 100))}%` }}
                                        aria-label="평가금액 비율"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-400/80" />
                                          <span className="font-medium">평가금액</span>
                                          <span className="font-mono text-xs text-muted-foreground">{(valueRatio * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="text-sm font-semibold">{totalValue.toLocaleString()}원</div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="h-full bg-sky-400/80 flex-1"
                                        style={{ width: `${Math.min(100, Math.max(0, cashRatio * 100))}%` }}
                                        aria-label="현금 비율"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-400/80" />
                                          <span className="font-medium">예수금(현금)</span>
                                          <span className="font-mono text-xs text-muted-foreground">{(cashRatio * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="text-sm font-semibold">{investmentBalance.toLocaleString()}원</div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                              {/* 바 하단 2열 보조 통계 (좌측 정렬, 칩 + 라벨만) */}
                              <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-block w-2 h-2 rounded-sm bg-emerald-400/80" />
                                  <span>평가금액</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-block w-2 h-2 rounded-sm bg-sky-400/80" />
                                  <span>예수금(현금)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-5">
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Banknote className="h-4 w-4 text-emerald-500" />
                                  <p className="text-sm text-gray-600">총 자산</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    aria-label={showAmounts ? '금액 숨기기' : '금액 표시'}
                                    className="p-1 rounded hover:bg-gray-100"
                                    onClick={() => setShowAmounts((s) => !s)}
                                    title={showAmounts ? '금액 숨기기' : '금액 표시'}
                                  >
                                    {showAmounts ? (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <motion.p
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-gray-700"
                              >
                                {showAmounts ? `${totalAssets.toLocaleString()}원` : '••••••'}
                              </motion.p>
                            </div>

                            <div className="p-3 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-gray-600">총 손익</p>
                                <div className={cn("flex items-center text-sm font-medium", combinedProfit >= 0 ? "text-red-500" : "text-blue-500")}>
                                  {combinedProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                  {Math.abs(totalProfitRate).toFixed(2)}%
                                </div>
                              </div>
                              <p className={cn("text-lg md:text-xl font-bold", combinedProfit >= 0 ? "text-red-500" : "text-blue-500")}>{combinedProfit >= 0 ? "+" : ""}{Math.trunc(combinedProfit).toLocaleString()}원</p>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <CircleDollarSign className="h-4 w-4 text-emerald-500" />
                                  <span>투자 원금</span>
                                </div>
                                <span className="font-medium tabular-nums">{Math.trunc(totalCostCurrent).toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <BarChart3 className="h-4 w-4 text-blue-500" />
                                  <span>평가금액</span>
                                </div>
                                <span className="font-medium tabular-nums">{totalValue.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Wallet className="h-4 w-4 text-amber-500" />
                                  <span>예수금(현금)</span>
                                </div>
                                <span className="font-medium tabular-nums">{investmentBalance.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Layers className="h-4 w-4 text-violet-500" />
                                  <span>보유 종목 수</span>
                                </div>
                                <span className="font-medium tabular-nums">{holdings.length}개</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Calendar className="h-4 w-4 text-slate-500" />
                                  <span>최근 거래일</span>
                                </div>
                                <span className="font-medium tabular-nums">{lastTxDate ? formatDate(lastTxDate) : '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* 즐겨찾기 카드 */}
                  <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="relative overflow-hidden border border-neutral-200/70 h-full rounded-2xl bg-white">
                      {/* 상단 바 (요약과 동일, 검색창 없음) */}
                      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-neutral-50 to-neutral-200/70 rounded-t-2xl" />
                      <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-center h-12 px-4 gap-x-4 md:gap-x-6 lg:gap-x-8">
                        {/* 좌측 시스템 버튼들 대체 아이콘 */}
                        <div className="flex items-center gap-2 text-neutral-600">
                          <ChevronLeft className="w-4 h-4" />
                          <ChevronRight className="w-4 h-4" />
                        </div>
                        {/* 중앙 비움 (검색창 제거) */}
                        <div />
                        {/* 우측 툴 아이콘 */}
                        <div className="justify-self-end flex items-center gap-4 text-neutral-600">
                          <Heart className="w-4 h-4" />
                          <X className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <CardHeader className="relative z-10 pt-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-bold mt-2 text-gray-700 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-500 fill-red-500" /> 즐겨찾기
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 gap-3">
                        {favorites.length === 0 && (
                          <div className="text-center text-gray-500 py-8">즐겨찾기한 종목이 없습니다.</div>
                        )}
                        {pagedFavorites.map((f) => (
                          <Link key={f.id} href={`/investment/${f.ticker}`}>
                            <div className="flex items-center justify-between h-14 px-3 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                                  <img src={`/stock-logos/${f.ticker}.png`} alt={f.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold">{f.name}</div>
                                  <div className="text-xs text-gray-500">{f.ticker}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  aria-label="즐겨찾기 해제"
                                  className="p-2 rounded-full hover:bg-red-50"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnfavorite(f.ticker, f.name); }}
                                  title="즐겨찾기 해제"
                                >
                                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                                </button>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </Link>
                        ))}
                        {favorites.length > 0 && favPlaceholders > 0 && (
                          Array.from({ length: favPlaceholders }).map((_, i) => (
                            <div key={`fav-ph-${i}`} className="h-14 border border-transparent rounded-2xl" aria-hidden />
                          ))
                        )}

                        <div className="mt-4 pt-1 min-h-[40px]">
                          {favorites.length > 0 ? (
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationLink
                                    href="#"
                                    className={cn(favPage <= 0 ? "pointer-events-none opacity-50" : "")}
                                    onClick={(e) => { e.preventDefault(); if (favPage > 0) setFavPage((p) => p - 1) }}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </PaginationLink>
                                </PaginationItem>
                                {(() => {
                                  const total = favTotalPages
                                  const current = favPage + 1
                                  const pages: (number | "ellipsis-prev" | "ellipsis-next")[] = []
                                  if (total <= 5) {
                                    for (let i = 1; i <= total; i++) pages.push(i)
                                  } else {
                                    pages.push(1)
                                    if (current > 3) pages.push("ellipsis-prev")
                                    const start = Math.max(2, current - 1)
                                    const end = Math.min(total - 1, current + 1)
                                    for (let i = start; i <= end; i++) pages.push(i)
                                    if (current < total - 2) pages.push("ellipsis-next")
                                    pages.push(total)
                                  }
                                  return pages.map((p, idx) => (
                                    typeof p === "number" ? (
                                      <PaginationItem key={p}>
                                        <PaginationLink href="#" isActive={p === current} onClick={(e) => { e.preventDefault(); setFavPage(p - 1) }}>
                                          {p}
                                        </PaginationLink>
                                      </PaginationItem>
                                    ) : (
                                      <PaginationItem key={`e-${idx}`}>
                                        <PaginationEllipsis className="text-muted-foreground" />
                                      </PaginationItem>
                                    )
                                  ))
                                })()}
                                <PaginationItem>
                                  <PaginationLink
                                    href="#"
                                    className={cn(favPage >= favTotalPages - 1 ? "pointer-events-none opacity-50" : "")}
                                    onClick={(e) => { e.preventDefault(); if (favPage < favTotalPages - 1) setFavPage((p) => p + 1) }}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </PaginationLink>
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          ) : (
                            <div className="h-10" aria-hidden />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </section>

              {/* Slide 1: 보유 종목 */}
              <section className="min-w-full snap-start" onTouchStart={() => { suppressScrollRef.current = false }}>
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border border-neutral-200/70 bg-white rounded-2xl">
                {/* 상단 바 */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-neutral-50 to-neutral-200/70 rounded-t-2xl" />
                <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-center h-12 px-4 gap-x-4 md:gap-x-6 lg:gap-x-8">
                  {/* 좌측 시스템 버튼들 */}
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#FF5F57]" aria-label="Close" />
                    <span className="inline-block w-3 h-3 rounded-full bg-[#FFBD2E]" aria-label="Minimize" />
                    <span className="inline-block w-3 h-3 rounded-full bg-[#28C840]" aria-label="Zoom" />
                  </div>
                  {/* 중앙 주소창 */}
                  <div className="justify-self-start w-full max-w-md md:max-w-lg lg:max-w-xl ml-2 md:ml-3 lg:ml-4 mr-12 md:mr-16 lg:mr-20">
                    <div className="flex items-center gap-2 h-7 px-3 rounded-full bg-white/60 ring-1 ring-black/5">
                      <Search className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-[12px] text-neutral-500">holdings</span>
                    </div>
                  </div>
                  {/* 우측 툴 아이콘 */}
                  <div className="justify-self-end flex items-center gap-4 text-neutral-600">
                    <Share className="w-4 h-4" />
                    <Maximize2 className="w-4 h-4" />
                    <Menu className="w-4 h-4" />
                  </div>
                </div>
                <CardHeader className="relative z-10 pt-6 flex flex-row justify-between items-center">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <BriefcaseBusiness className="w-5 h-5 text-slate-600" />
                  보유 종목
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {holdings.length === 0 && (
                  <div className="text-center text-gray-500 py-12">보유 종목이 없습니다. 종목을 매수해보세요.</div>
                )}
                {pagedHoldings.map((stock, index) => {
                  return (
                    <motion.div key={stock.symbol} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1 }}>
                      <Link href={`/investment/${stock.symbol}`}>
                        <Card className="p-4 grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[260px_1fr_240px_auto] lg:grid-cols-[300px_1fr_260px_auto] items-center gap-4 hover:bg-gray-50 transition-colors border-0">
                          {/* Left: Logo + Name */}
                          <div className="flex items-center gap-4 min-w-0 md:w-[260px] lg:w-[300px]">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                              <img src={stock.logo || "/placeholder.svg"} alt={stock.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold truncate">{stock.name}</p>
                                <span className="text-xs text-gray-500">{stock.symbol}</span>
                              </div>
                            </div>
                          </div>

                          {/* Middle: Chips */}
                          <div className="flex flex-col items-start justify-start gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2 text-[11.5px] leading-4 text-emerald-600 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                                <Layers className="h-4 w-4" />
                                <span>{stock.shares.toLocaleString()}주</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center text-[11.5px] leading-4 text-gray-700 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">평균단가 {stock.avgPrice.toLocaleString()}원</span>
                              <span className="inline-flex items-center text-[11.5px] leading-4 text-gray-700 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">현재 {stock.currentPrice.toLocaleString()}원</span>
                            </div>
                          </div>

                          {/* Right Info: Value + PnL (align to column end) */}
                          <div className="justify-self-end text-right flex flex-col items-end gap-1.5 pl-4 md:pl-6 pr-10 md:pr-14 lg:pr-20">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{stock.value.toLocaleString()}원</p>
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              {stock.profitRate >= 0 ? (<ChevronUp className="h-3 w-3 text-red-500" />) : (<ChevronDown className="h-3 w-3 text-blue-500" />)}
                              <p className={cn("text-sm", stock.profitRate >= 0 ? "text-red-500" : "text-blue-500")}>{Math.abs(stock.profitRate).toFixed(2)}%</p>
                            </div>
                            <p className={cn("text-xs", stock.profit >= 0 ? "text-red-500" : "text-blue-500")}>{stock.profit >= 0 ? "+" : ""}{stock.profit.toLocaleString()}원</p>
                          </div>

                          {/* Actions: Buy / Sell */}
                          <div className="justify-self-end flex items-center gap-2">
                            <Button
                              size="sm"
                              className="!bg-red-500 !hover:bg-red-600 text-white rounded-full h-8 px-3 text-xs md:h-9 md:px-3 md:text-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/investment/${stock.symbol}?action=buy`)
                              }}
                            >
                              매수
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-8 px-3 text-xs md:h-9 md:px-3 md:text-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/investment/${stock.symbol}?action=sell`)
                              }}
                            >
                              매도
                            </Button>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
                {/* 보유 종목 페이징 */}
                {holdings.length > 0 && (
                  <div className="pt-2">
                    <Pagination>
                      <PaginationContent>
                        {/* Prev */}
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            className={cn(holdPage <= 0 ? "pointer-events-none opacity-50" : "")}
                            onClick={(e) => { e.preventDefault(); if (holdPage > 0) setHoldPage((p) => p - 1) }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </PaginationLink>
                        </PaginationItem>

                        {(() => {
                          const total = holdTotalPages
                          const current = holdPage + 1
                          const pages: (number | "ellipsis-prev" | "ellipsis-next")[] = []
                          if (total <= 3) {
                            for (let i = 1; i <= total; i++) pages.push(i)
                          } else {
                            pages.push(1)
                            if (current > 2) pages.push("ellipsis-prev")
                            const start = Math.max(2, current)
                            const end = Math.min(total - 1, current)
                            // 현재 페이지만 중앙에 노출 (요청: 버튼 3개 수준)
                            for (let i = start; i <= end; i++) pages.push(i)
                            if (current < total - 1) pages.push("ellipsis-next")
                            pages.push(total)
                          }
                          return pages.map((p, idx) => (
                            typeof p === "number" ? (
                              <PaginationItem key={`hold-${p}`}>
                                <PaginationLink href="#" isActive={p === current} onClick={(e) => { e.preventDefault(); setHoldPage(p - 1) }}>
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            ) : (
                              <PaginationItem key={`hold-e-${idx}`}>
                                <PaginationEllipsis className="text-muted-foreground" />
                              </PaginationItem>
                            )
                          ))
                        })()}

                        {/* Next */}
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            className={cn(holdPage >= holdTotalPages - 1 ? "pointer-events-none opacity-50" : "")}
                            onClick={(e) => { e.preventDefault(); if (holdPage < holdTotalPages - 1) setHoldPage((p) => p + 1) }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </PaginationLink>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
              </section>

              {/* Slide 2: 수익률 추이 */}
              <section className="min-w-full snap-start" onTouchStart={() => { suppressScrollRef.current = false }}>
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border border-neutral-200/70 bg-white rounded-2xl">
              {/* 상단 바 */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-neutral-50 to-neutral-200/70 rounded-t-2xl" />
              <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-center h-12 px-4 gap-x-4 md:gap-x-6 lg:gap-x-8">
                {/* 좌측 시스템 버튼들 */}
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#FF5F57]" aria-label="Close" />
                  <span className="inline-block w-3 h-3 rounded-full bg-[#FFBD2E]" aria-label="Minimize" />
                  <span className="inline-block w-3 h-3 rounded-full bg-[#28C840]" aria-label="Zoom" />
                </div>
                {/* 중앙 주소창 */}
                <div className="justify-self-start w-full max-w-md md:max-w-lg lg:max-w-xl ml-2 md:ml-3 lg:ml-4 mr-12 md:mr-16 lg:mr-20">
                  <div className="flex items-center gap-2 h-7 px-3 rounded-full bg-white/60 ring-1 ring-black/5">
                    <Search className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[12px] text-neutral-500">performance</span>
                  </div>
                </div>
                {/* 우측 툴 아이콘 */}
                <div className="justify-self-end flex items-center gap-4 text-neutral-600">
                  <Share className="w-4 h-4" />
                  <Maximize2 className="w-4 h-4" />
                  <Menu className="w-4 h-4" />
                </div>
              </div>
              <CardHeader className="relative z-10 pt-6 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                 <BarChart3 className="w-5 h-5 text-blue-500" /> 
                 <span className="text-xl font-bold no-underline inline-flex items-center gap-2">                 
                    손익률 추이
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user?.id ? <PortfolioCharts userId={user.id} refreshKey={chartRefreshKey} /> : null}
              </CardContent>
            </Card>
          </motion.div>
              </section>

              {/* Slide 3: 거래 내역 */}
              <section className="min-w-full snap-start" onTouchStart={() => { suppressScrollRef.current = false }}>
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border border-neutral-200/70 bg-white rounded-2xl">
              {/* 상단 바 */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-neutral-50 to-neutral-200/70 rounded-t-2xl" />
              <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-center h-12 px-4 gap-x-4 md:gap-x-6 lg:gap-x-8">
                {/* 좌측 시스템 버튼들 */}
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#FF5F57]" aria-label="Close" />
                  <span className="inline-block w-3 h-3 rounded-full bg-[#FFBD2E]" aria-label="Minimize" />
                  <span className="inline-block w-3 h-3 rounded-full bg-[#28C840]" aria-label="Zoom" />
                </div>
                {/* 중앙 주소창 */}
                <div className="justify-self-start w-full max-w-md md:max-w-lg lg:max-w-xl ml-2 md:ml-3 lg:ml-4 mr-12 md:mr-16 lg:mr-20">
                  <div className="flex items-center gap-2 h-7 px-3 rounded-full bg-white/60 ring-1 ring-black/5">
                    <Search className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[12px] text-neutral-500">transactions</span>
                  </div>
                </div>
                {/* 우측 툴 아이콘 */}
                <div className="justify-self-end flex items-center gap-4 text-neutral-600">
                  <Share className="w-4 h-4" />
                  <Maximize2 className="w-4 h-4" />
                  <Menu className="w-4 h-4" />
                </div>
              </div>
              <div className="relative z-10 pt-4">
                <Accordion type="single" collapsible defaultValue="tx">
                <AccordionItem value="tx">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline focus:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl font-bold no-underline inline-flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-600" />
                        거래 내역
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-2">
                {transactions.length === 0 && (
                  <div className="text-center text-gray-500 py-12">최근 거래가 없습니다.</div>
                )}
                {groupedTransactions.map(([dateKey, items]) => (
                  <div key={`group-${dateKey}`} className="space-y-2">
                    <div className="px-1 py-1">
                      <div className="inline-flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {dateKey}
                      </div>
                    </div>
                    {items.map(({ tx: t, idx }) => {
                      const isBuy = t.type === 'BUY'
                      const amountText = `${isBuy ? '-' : '+'}${Math.abs(t.amount).toLocaleString()}원`
                      const amountColor = isBuy ? 'text-red-500' : 'text-blue-500'
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "group relative py-3 pl-6 md:pl-8 pr-2 rounded-lg overflow-hidden transition-colors",
                            isBuy ? "bg-rose-400/5 hover:bg-rose-400/20" : "bg-sky-400/5 hover:bg-sky-400/20"
                          )}
                        >
                          <div className={cn("absolute left-0 top-0 bottom-0 w-3", isBuy ? "bg-red-500" : "bg-blue-500")} aria-hidden />
                          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                            <div className="flex items-center gap-3 min-w-0 w-[320px] md:w-[360px] shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                                <img src={`/stock-logos/${t.ticker}.png`} alt={t.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold">{t.name}</div>
                                  <span className="text-xs text-gray-500">({t.ticker})</span>
                                  <Badge
                                    className={cn(
                                      "text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-none",
                                      isBuy
                                        ? 'bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800'
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800'
                                    )}
                                  >
                                    {isBuy ? '매수' : '매도'}
                                  </Badge>
                                </div>
                                {/* 날짜는 그룹 헤더로 표시되므로 항목 내부에서는 숨김 */}
                              </div>
                            </div>
                            {/* 수량/단가 중간 섹션 */}
                            <div className="flex items-center justify-start pl-6 md:pl-10 gap-2 md:gap-3">
                              <div
                                className={cn(
                                  "inline-flex items-center gap-1.5 text-[11px] md:text-xs font-medium px-2.5 py-1 rounded-full",
                                  isBuy ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                                )}
                              >
                                <Layers className="h-3.5 w-3.5" />
                                <span>{t.quantity.toLocaleString()}주</span>
                              </div>
                              <div className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-gray-700">
                                <CircleDollarSign className={cn("h-3.5 w-3.5", isBuy ? "text-red-500" : "text-blue-500")} />
                                <span>{t.pricePerShare.toLocaleString()}원</span>
                              </div>
                            </div>
                            <div className="text-right justify-self-end">
                              <div className={cn("text-[13px] font-semibold font-mono", amountColor)}>{amountText}</div>
                              <div className="text-[11px] text-gray-500">잔액 {(pagePostBalances[idx] ?? investmentBalance).toLocaleString()}원</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
               
                {/* Pagination */}
                <div className="pt-4">
                  <Pagination>
                    <PaginationContent>
                      {/* First */}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          className={cn(txPage <= 0 || txLoading ? "pointer-events-none opacity-50" : "")}
                          onClick={(e) => {
                            e.preventDefault()
                            if (txPage > 0 && !txLoading) setTxPage(0)
                          }}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </PaginationLink>
                      </PaginationItem>
                      {/* Prev */}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          className={cn(txPage <= 0 || txLoading ? "pointer-events-none opacity-50" : "")}
                          onClick={(e) => {
                            e.preventDefault()
                            if (txPage > 0 && !txLoading) setTxPage((p) => p - 1)
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </PaginationLink>
                      </PaginationItem>

                      {(() => {
                        const totalPages = txTotalPages
                        const current = txPage + 1
                        const pages: (number | "ellipsis-prev" | "ellipsis-next")[] = []
                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i)
                        } else {
                          pages.push(1)
                          if (current > 3) pages.push("ellipsis-prev")
                          const start = Math.max(2, current - 1)
                          const end = Math.min(totalPages - 1, current + 1)
                          for (let i = start; i <= end; i++) pages.push(i)
                          if (current < totalPages - 2) pages.push("ellipsis-next")
                          pages.push(totalPages)
                        }
                        return pages.map((p, idx) => (
                          typeof p === "number" ? (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href="#"
                                size="default"
                                isActive={p === current}
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (!txLoading) setTxPage(p - 1)
                                }}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={`e-${idx}`}>
                              <PaginationEllipsis className="text-muted-foreground" />
                            </PaginationItem>
                          )
                        ))
                      })()}

                      {/* Next */}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          className={cn(txPage >= txTotalPages - 1 || txLoading ? "pointer-events-none opacity-50" : "")}
                          onClick={(e) => {
                            e.preventDefault()
                            if (txPage < txTotalPages - 1 && !txLoading) setTxPage((p) => p + 1)
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </PaginationLink>
                      </PaginationItem>
                      {/* Last */}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          className={cn(txPage >= txTotalPages - 1 || txLoading ? "pointer-events-none opacity-50" : "")}
                          onClick={(e) => {
                            e.preventDefault()
                            if (txPage < txTotalPages - 1 && !txLoading) setTxPage(txTotalPages - 1)
                          }}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                    </CardContent>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              </div>
            </Card>
          </motion.div>
              </section>

              {/* 오른쪽 클론: 첫번째 슬라이드 (빈 섹션로 만 유지) */}
              <section className="min-w-full snap-start" aria-hidden />

          </div>
          </div>

        </motion.div>
      </div>
      <Toaster />
    </div>
  )
}
