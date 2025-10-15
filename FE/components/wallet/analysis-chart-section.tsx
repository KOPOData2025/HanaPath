"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, PieChart } from "lucide-react"
import ModernDonutChart from "./analysis-donut-chart"

// 도넛 차트용 색상 배열 정의 
const donutColors = [
  '#FF6B6B', // 코랄 레드
  '#4ECDC4', // 터콰이즈
  '#45B7D1', // 스카이 블루
  '#96CEB4', // 민트 그린
  '#FFEAA7', // 소프트 옐로우
  '#DDA0DD', // 플럼
  '#98D8C8', // 아쿠아 그린
  '#F7DC6F', // 골든 옐로우
  '#BB8FCE', // 라벤더
  '#85C1E9'  // 라이트 블루
]

interface CategoryAnalysisItem {
  category: string
  amount: number
  percentage: number
  icon: any
  color: string
}

interface MonthlyComparison {
  currentMonth: number
  previousMonth: number
  difference: number
  percentageChange: number
  isIncrease: boolean
  isSignificant: boolean
}

interface AnalysisChartSectionProps {
  categoryAnalysis: CategoryAnalysisItem[]
  monthlyComparison: MonthlyComparison | null
  selectedPeriod: string
  selectedCustomMonth: string
}

export default function AnalysisChartSection({
  categoryAnalysis,
  monthlyComparison,
  selectedPeriod,
  selectedCustomMonth
}: AnalysisChartSectionProps) {
  return (
    <Card className="shadow-lg border border-gray-200/50 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              카테고리별 지출
            </CardTitle>
            <div className="flex items-center gap-3 mt-1">
              <CardDescription className="text-emerald-100">
                어디에 가장 많이 소비하고 계신가요?
              </CardDescription>
              {/* 월별 비교 인사이트 - 같은 선상 */}
              {monthlyComparison && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    monthlyComparison.isIncrease 
                      ? 'bg-red-400 text-white' 
                      : 'bg-blue-400 text-white'
                  }`}>
                    {monthlyComparison.isIncrease ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                  </div>
                  <div className="text-xs font-medium text-white">
                    {monthlyComparison.isIncrease 
                      ? (
                        <>
                          저번 달보다 <span className="text-red-500 font-semibold">{monthlyComparison.difference.toLocaleString()}원 더 썼어요</span>
                        </>
                      ) : (
                        <>
                          저번 달보다 <span className="text-blue-600 font-semibold">{Math.abs(monthlyComparison.difference).toLocaleString()}원 덜 썼어요</span>
                        </>
                      )
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-emerald-100">총 지출</div>
            <div className="text-2xl font-bold text-white">
              {categoryAnalysis.slice(0, 6).reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}원
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* 범례 (왼쪽) */}
          <div className="w-full lg:w-80 space-y-3 flex flex-col justify-center">
            {categoryAnalysis.slice(0, 6).map((item, index) => {
              // 도넛 차트와 동일한 색상 사용
              const color = donutColors[index % donutColors.length]
              
              return (
                <motion.div
                  key={`${item.category}-${selectedPeriod}-${selectedCustomMonth}`}
                  initial={{ opacity: 0, x: -30, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.08 + 0.3, 
                    type: "spring",
                    stiffness: 150,
                    damping: 20
                  }}
                  className="group relative flex items-center gap-2 p-2 rounded-lg transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = color + '20' // 20% 투명도
                    // 퍼센트 색상도 변경
                    const percentageElement = e.currentTarget.querySelector('.percentage-text') as HTMLElement
                    if (percentageElement) {
                      percentageElement.style.color = color
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    const percentageElement = e.currentTarget.querySelector('.percentage-text') as HTMLElement
                    if (percentageElement) {
                      percentageElement.style.color = '#374151'
                    }
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ 
                      backgroundColor: color
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between h-12">
                      <div className="flex flex-col justify-center">
                        <span className="font-medium text-sm text-gray-700 group-hover:text-gray-800 transition-colors truncate">
                          {item.category}
                        </span>
                        <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                          {item.amount.toLocaleString()}원
                        </div>
                      </div>
                      <motion.div
                        className="percentage-text text-sm font-semibold text-gray-800 transition-colors ml-2 flex items-center justify-center h-full"
                        style={{
                          color: '#374151'
                        }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {item.percentage.toFixed(0)}%
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* 호버 시 나타나는 퍼센트 툴팁 */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 scale-90 group-hover:scale-100">
                    <div 
                      className="text-white text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap"
                      style={{ 
                        backgroundColor: color
                      }}
                    >
                      {item.percentage.toFixed(1)}% 지출
                    </div>
                    <div 
                      className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                      style={{ borderTopColor: color }}
                    ></div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          
          {/* 도넛 차트 (오른쪽) */}
          <motion.div
            key={`donut-${selectedPeriod}-${selectedCustomMonth}`}
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ 
              delay: 0.5, 
              type: "spring", 
              stiffness: 120, 
              damping: 12,
              duration: 0.8
            }}
            className="flex-shrink-0 flex items-center justify-center"
          >
            <ModernDonutChart data={categoryAnalysis.slice(0, 6)} size={280} strokeWidth={50} />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
