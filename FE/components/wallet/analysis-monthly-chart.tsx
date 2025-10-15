"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MonthlyAnalysisItem, getCurrentMonthProjection } from "./analysis-utils"

interface AnalysisMonthlyChartProps {
  monthlyData: MonthlyAnalysisItem[]
  onMonthSelect: (monthKey: string) => void
  transactions: any[] // 전체 거래 내역
}

const formatAmount = (amount: number): string => {
  // 만원 단위로 표시
  return (amount / 10000).toFixed(0)
}

const getMaxAmount = (data: MonthlyAnalysisItem[]): number => {
  const amounts = data.map(item => item.amount).filter(amount => amount > 0)
  if (amounts.length === 0) return 1
  return Math.max(...amounts)
}

// teal 계열 색상
const getColorHue = (index: number): number => {
  const colors = [180, 185, 190, 195, 200, 205] // teal 계열
  return colors[index % colors.length]
}

// 예상 지출 계산 (최근 3개월 평균)
const getExpectedAmount = (data: MonthlyAnalysisItem[]): number => {
  if (data.length < 3) return 0
  const recentThreeMonths = data.slice(-3)
  const total = recentThreeMonths.reduce((sum, item) => sum + item.amount, 0)
  return total / 3
}

export default function AnalysisMonthlyChart({ monthlyData, onMonthSelect, transactions }: AnalysisMonthlyChartProps) {
  const [animationKey, setAnimationKey] = useState(0)

  const maxAmount = getMaxAmount(monthlyData)
  
  // 디버깅용 로그
  console.log('Monthly Data:', monthlyData.map(item => ({ month: item.month, amount: item.amount })))
  console.log('Max Amount:', maxAmount)
  console.log('Monthly Data Length:', monthlyData.length)
  console.log('All Amounts:', monthlyData.map(item => item.amount))
  
  // 현재 시점에서의 예상 지출과 평균 지출 계산 (선택된 월과 무관하게 고정)
  const { currentMonthExpected, overallAverage } = getCurrentMonthProjection(transactions)

  // 현재 선택된 월의 인덱스 찾기
  const selectedIndex = monthlyData.findIndex(item => item.isSelected)

  // 월 선택 핸들러
  const handleMonthClick = (index: number, monthKey: string) => {
    onMonthSelect(monthKey)
    setAnimationKey(prev => prev + 1)
  }

  // 월 이동 핸들러
  const handlePreviousMonth = () => {
    if (selectedIndex > 0) {
      const prevMonthData = monthlyData[selectedIndex - 1]
      const monthKey = `${prevMonthData.year}-${prevMonthData.monthNumber.toString().padStart(2, '0')}`
      onMonthSelect(monthKey)
      setAnimationKey(prev => prev + 1)
    }
  }

  const handleNextMonth = () => {
    // 현재 선택된 월의 다음 월로 이동 (현재 월을 넘어서지 않도록 제한)
    const currentSelected = monthlyData.find(item => item.isSelected)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (currentSelected) {
      let nextYear = currentSelected.year
      let nextMonth = currentSelected.monthNumber + 1
      
      // 월이 12보다 크면 다음 년도로 조정
      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }
      
      // 현재 월을 넘어서지 않도록 제한
      if (nextYear < currentYear || (nextYear === currentYear && nextMonth <= currentMonth)) {
        const monthKey = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`
        onMonthSelect(monthKey)
        setAnimationKey(prev => prev + 1)
      }
    }
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <p className="text-gray-500">월별 데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      {/* 헤더 - 예상 지출 표시 */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              이번 달엔 {formatAmount(currentMonthExpected)}만원 쓸 것 같아요
            </h3>
            <p className="text-gray-600">
              한달에 평균 {formatAmount(overallAverage)}만원 정도 써요
            </p>
          </div>
          
          {/* 월 이동 버튼 */}
          <div className="flex items-center space-x-2 mt-1">
            <button
              onClick={handlePreviousMonth}
              disabled={selectedIndex <= 0}
              className="group relative p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 border border-gray-300/50"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-700 transition-colors duration-150" />
            </button>
            <button
              onClick={handleNextMonth}
              disabled={monthlyData.find(item => item.isSelected)?.isCurrentMonth}
              className="group relative p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 border border-gray-300/50"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-700 transition-colors duration-150" />
            </button>
          </div>
        </div>
      </div>

      {/* 막대 차트 */}
      <div className="relative">
        <div className="flex justify-between h-96 px-6 gap-4" style={{ alignItems: 'flex-end', display: 'flex' }}>
          {monthlyData.map((item, index) => {
            // 막대 높이 계산 (픽셀 단위로 직접 계산)
            const maxHeight = 300 // 최대 높이 (픽셀)
            let barHeight = 50 // 0원인 경우 기본 높이
            
            if (item.amount > 0 && maxAmount > 0) {
              // 0원 초과부터는 비율에 따른 높이 + 기본 50px
              barHeight = 50 + (item.amount / maxAmount) * (maxHeight - 50)
            }
            
            const isCurrentMonth = item.isCurrentMonth
            const isSelected = item.isSelected
            
            // 디버깅용 로그
            console.log(`Bar ${index}: ${item.month} - Amount: ${item.amount}, BarHeight: ${barHeight}px, MaxAmount: ${maxAmount}`)
            
            return (
              <motion.div
                key={`${item.year}-${item.monthNumber}-${animationKey}`}
                className="flex flex-col items-center flex-1 cursor-pointer hover:transform-none"
                style={{ alignSelf: 'flex-end' }}
                initial={{ 
                  scaleY: 0,
                  opacity: 0,
                  y: 20
                }}
                animate={{ 
                  scaleY: 1,
                  opacity: 1,
                  y: 0
                }}
                transition={{ 
                  duration: 1.2, 
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94], // 커스텀 이징
                  scaleY: {
                    duration: 0.8,
                    ease: "easeOut"
                  },
                  opacity: {
                    duration: 0.6,
                    ease: "easeOut"
                  },
                  y: {
                    duration: 0.8,
                    ease: "easeOut"
                  }
                }}
                onClick={() => {
                  const monthKey = `${item.year}-${item.monthNumber.toString().padStart(2, '0')}`
                  handleMonthClick(index, monthKey)
                }}
                whileHover={{ scale: 1 }}
              >
                {/* 금액 표시 */}
                <motion.div 
                  className="mb-2 text-center"
                  initial={{ 
                    opacity: 0,
                    y: -10
                  }}
                  animate={{ 
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.15 + 0.4, // 막대보다 늦게 시작
                    ease: "easeOut"
                  }}
                >
                  <p className={`text-lg font-bold whitespace-nowrap mb-[10px] ${
                    isCurrentMonth ? 'text-teal-700' : 'text-slate-700'
                  }`}>
                    {formatAmount(item.amount)}만원
                  </p>
                  {isCurrentMonth && (
                    <p className="text-xs text-teal-700 font-medium">예상</p>
                  )}
                </motion.div>

                {/* 3D 직육면체 막대 */}
                <motion.div
                  className="relative w-full ml-7 mb-10"
                  style={{ 
                    height: `${barHeight}px`,
                    width: '55%'
                  }}
                  initial={{ 
                    opacity: 0,
                    y: 20
                  }}
                  animate={{ 
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1 + 0.2,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                >
                  {/* 진짜 3D 직육면체 - x축 기준 입체적으로 시계방향 40도 회전 */}
                  <div 
                    className="relative w-full h-full"
                    style={{
                      transform: 'perspective(8000px) rotateX(-30deg) rotateY(-35deg)',
                      transformStyle: 'preserve-3d',
                      transformOrigin: 'bottom center'
                    }}
                  >
                    {/* 정면 (메인 면) - 직사각형 (중간 밝기) */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: isSelected 
                          ? `hsl(${Math.min(180 + index * 10, 200)}, 80%, 60%)`
                          : `hsl(${getColorHue(index)}, 80%, 60%)`,
                        transform: 'translateZ(50px)',
                        border: '0px solid rgba(0,0,0,0.3)'
                      }}
                    />
                    
                    {/* 윗면 - 평행사변형 (가장 밝게) */}
                    <div 
                      className="absolute top-0 left-0"
                      style={{
                        width: '100%',
                        height: '50px',
                        background: isSelected 
                          ? `hsl(${Math.min(180 + index * 10, 200)}, 80%, 80%)`
                          : `hsl(${getColorHue(index)}, 80%, 80%)`,
                        transform: 'translateZ(50px) translateY(-50px) rotateX(90deg)',
                        transformOrigin: 'bottom center',
                        border: '0px solid rgba(0,0,0,0.3)'
                      }}
                    />
                    
                    {/* 오른쪽면 - 직사각형 (가장 어둡게) - 맞닿게 */}
                    <div 
                      className="absolute top-0 right-0"
                      style={{
                        width: '50px',
                        height: '100%',
                        background: isSelected 
                          ? `hsl(${Math.min(180 + index * 10, 200)}, 80%, 40%)`
                          : `hsl(${getColorHue(index)}, 80%, 40%)`,
                        transform: 'translateX(50px) translateZ(50px) rotateY(90deg)',
                        transformOrigin: 'left center',
                        border: '0px solid rgba(0,0,0,0.3)'
                      }}
                    />
                  </div>
                </motion.div>
                
                {/* 월 라벨 */}
                <motion.div 
                  className="mt-2 text-center"
                  initial={{ 
                    opacity: 0,
                    y: 10
                  }}
                  animate={{ 
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.15 + 1.0, // 막대 애니메이션 완료 후 시작
                    ease: "easeOut"
                  }}
                >
                  <p className={`text-base font-semibold ${
                    isCurrentMonth 
                      ? 'text-teal-700 font-bold' 
                      : 'text-slate-600'
                  }`}>
                    {isCurrentMonth ? '이번 달' : item.month}
                  </p>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
