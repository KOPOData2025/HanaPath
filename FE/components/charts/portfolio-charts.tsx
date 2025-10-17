"use client"

import { useState, useEffect, useMemo } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

type Snapshot = {
  snapshotDate: string
  profitRate: number
}

async function fetchAllSnapshots(userId: number): Promise<Snapshot[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${base}/api/investment/performance/${userId}/all`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: 'include',
  })
  if (!res.ok) throw new Error('failed to load performance snapshots')
  const data = await res.json()
  return (data || []).map((d: any) => ({
    snapshotDate: d.snapshotDate,
    profitRate: Number(d.profitRate ?? 0),
  }))
}

interface PortfolioChartsProps {
  userId: number
  refreshKey?: number
}

export function PortfolioCharts({ userId, refreshKey = 0 }: PortfolioChartsProps) {
  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<Snapshot[]>([])

  // 초기: 전체 이력 로드(과거→현재), 화면엔 최근 7일만 보이되 가로 스크롤로 과거 탐색
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        const data = await fetchAllSnapshots(userId)
        if (!cancelled) setSeries(data)
      } catch (_) {
        if (!cancelled) setSeries([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (userId) run()
    return () => { cancelled = true }
  }, [userId, refreshKey])

  const points = useMemo(() => series.map(s => ({
    date: s.snapshotDate,
    value: Number.isFinite(s.profitRate) ? s.profitRate : 0,
  })), [series])

  const xTicks = useMemo(() => {
    const n = points.length
    if (n === 0) return []
    if (n <= 7) return points.map(p => p.date)
    const slots = 7 // 총 라벨 개수
    const result: string[] = []
    for (let i = 0; i < slots; i++) {
      const idx = Math.round((i * (n - 1)) / (slots - 1))
      const d = points[idx]?.date
      if (d && !result.includes(d)) result.push(d)
    }
    return result
  }, [points])

  // 전체 데이터 표시
  const lastValue = points.length > 0 ? points[points.length - 1].value : 0
  const chartColor = lastValue >= 0 ? "hsl(0, 100%, 60%)" : "hsl(210, 100%, 60%)"

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-6">
        <ChartContainer
          config={{ value: { label: '손익률', color: chartColor } }}
          className="h-[300px] flex-1"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                ticks={xTicks}
                interval={0}
                minTickGap={16}
                tickMargin={8}
                tickFormatter={(value: string) => {
                  // 'YYYY-MM-DD' -> 'MM/DD'
                  if (typeof value === 'string' && value.length >= 10) {
                    return value.slice(5, 10).replace('-', '/')
                  }
                  return value
                }}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    inlineValue
                    valueFormatter={(v) => `${Number(v).toLocaleString()}%`}
                  />
                }
              />
              <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="hidden md:block shrink-0 pr-2 relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
            <div className="relative flex items-center justify-center">
              <div className="relative z-10 inline-flex items-center justify-center w-[210px] md:w-[240px] px-4 py-2 rounded-3xl bg-white backdrop-blur-sm ring-1 ring-gray-200 shadow-md text-sm text-gray-700 text-center whitespace-nowrap">
                손익률 추이를 확인해보세요!
              </div>
              {/* Tail (outline + inner) */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-[2px] w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-200" aria-hidden />
              <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-[1px] w-0 h-0 border-x-7 border-x-transparent border-t-7 border-t-white" aria-hidden />
            </div>
          </div>
          <img src="/portfolio2.png" alt="포트폴리오 보조 이미지" className="w-40 md:w-48 lg:w-56 h-auto object-contain" />
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 mt-2">  </div>
    </div>
  )
}
