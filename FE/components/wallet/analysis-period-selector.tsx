"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Calendar, TicketCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface AnalysisPeriodSelectorProps {
  selectedPeriod: 'week' | 'thisMonth' | 'lastMonth' | 'custom'
  setSelectedPeriod: (period: 'week' | 'thisMonth' | 'lastMonth' | 'custom') => void
  selectedCustomMonth: string
  setSelectedCustomMonth: (month: string) => void
  displayName: string
}

export default function AnalysisPeriodSelector({
  selectedPeriod,
  setSelectedPeriod,
  selectedCustomMonth,
  setSelectedCustomMonth,
  displayName
}: AnalysisPeriodSelectorProps) {
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // 선택된 기간 표시용 텍스트
  const getSelectedPeriodText = () => {
    const now = new Date()
    switch (selectedPeriod) {
      case 'week':
        return '최근 1주일'
      case 'thisMonth':
        return `${now.getFullYear()}년 ${now.getMonth() + 1}월`
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
        return `${lastMonth.getFullYear()}년 ${lastMonth.getMonth() + 1}월`
      case 'custom':
        if (selectedCustomMonth) {
          const [year, month] = selectedCustomMonth.split('-').map(Number)
          return `${year}년 ${month}월`
        }
        return `${now.getFullYear()}년 ${now.getMonth() + 1}월`
      default:
        return `${now.getFullYear()}년 ${now.getMonth() + 1}월`
    }
  }

  // 드롭다운이 열리기 전에 미리 스크롤 위치 설정
  useEffect(() => {
    if (isMonthDropdownOpen && dropdownRef.current && selectedCustomMonth) {
      const selectedButton = dropdownRef.current.querySelector(`[data-month-key="${selectedCustomMonth}"]`) as HTMLElement
      if (selectedButton) {
        // 드롭다운이 열리기 전에 즉시 스크롤 위치 설정
        const container = dropdownRef.current
        const targetScrollTop = selectedButton.offsetTop
        container!.scrollTop = targetScrollTop
      }
    }
  }, [isMonthDropdownOpen, selectedCustomMonth])

  return (
    <Card className="
      bg-white/95 
      backdrop-blur-xl 
      border border-white/30 
      shadow-[0_8px_32px_rgba(0,0,0,0.08)]
      hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]
      transition-all duration-500
      rounded-3xl 
      relative overflow-visible
      group
    ">
      <div className="flex items-center gap-4 p-6">
        {/* 왼쪽: 텍스트 내용 - 비율 조정 */}
        <div className="flex-[2]">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <TicketCheck className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-600">소비 패턴 분석</h2>
            </div>
            <p className="text-gray-600 text-base mb-4 leading-relaxed">
              <span className="font-semibold text-teal-600">{displayName}</span>님의 소비 패턴을 확인해보세요
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-teal-500" />
            <span className="text-sm font-medium text-gray-600">기간 선택</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'week', label: '최근 1주일' },
              { key: 'thisMonth', label: '이번 달' },
              { key: 'lastMonth', label: '지난 달' }
            ].map((period) => (
              <motion.button
                key={period.key}
                onClick={() => {
                  setSelectedPeriod(period.key as any)
                  setIsMonthDropdownOpen(false)
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm border",
                  selectedPeriod === period.key
                    ? "bg-teal-500 text-white border-teal-400 shadow-md"
                    : "bg-white/30 text-gray-700 hover:bg-white/50 border-white/40"
                )}
              >
                {period.label}
              </motion.button>
            ))}
            
            {/* 월별 선택 드롭다운 */}
            <div className="relative">
              <motion.button
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border",
                  selectedPeriod === 'custom'
                    ? "bg-teal-500 text-white border-teal-400 shadow-md"
                    : "bg-white/30 text-gray-700 hover:bg-white/50 border-white/40"
                )}
              >
                월별 선택
                <motion.div
                  animate={{ rotate: isMonthDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </motion.button>
              
              {/* 드롭다운 메뉴 */}
              <AnimatePresence>
                {isMonthDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl border border-white/30 z-50 overflow-hidden"
                  >
                    <div ref={dropdownRef} className="max-h-32 overflow-y-auto">
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date()
                        date.setMonth(date.getMonth() - i)
                        const year = date.getFullYear()
                        const month = date.getMonth() + 1
                        const monthKey = `${year}-${String(month).padStart(2, '0')}`
                        const monthLabel = `${year}년 ${month}월`
                        
                        return (
                          <motion.button
                            key={monthKey}
                            onClick={() => {
                              setSelectedPeriod('custom')
                              setSelectedCustomMonth(monthKey)
                              setIsMonthDropdownOpen(false)
                            }}
                            whileHover={{ backgroundColor: '#f0f9ff' }}
                            className={cn(
                              "w-full px-4 py-3 text-left text-sm font-medium transition-all duration-300 flex items-center justify-between backdrop-blur-sm",
                              selectedPeriod === 'custom' && selectedCustomMonth === monthKey
                                ? "bg-teal-500/20 text-teal-700 border-l-4 border-teal-500"
                                : "text-gray-700 hover:bg-white/30"
                            )}
                            data-month-key={monthKey}
                          >
                            <span>{monthLabel}</span>
                            {selectedPeriod === 'custom' && selectedCustomMonth === monthKey && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-teal-500 rounded-full"
                              />
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 오른쪽: 이미지와 말풍선 */}
        <div className="flex-[1] relative">
          {/* 말풍선 - 선택된 기간 표시 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0,
              y: [0, -8, 0],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ 
              delay: 0.3, 
              type: "spring", 
              stiffness: 100,
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="absolute -left-24 top-8 z-10"
          >
            <div className="relative">
              {/* 구름 모양 말풍선 */}
              <div className="relative">
                {/* 구름 본체 */}
                <div className="bg-gradient-to-br from-teal-400/90 to-teal-600/90 backdrop-blur-sm text-white px-5 py-3 shadow-lg relative"
                     style={{
                       borderRadius: '20px 20px 5px 20px'
                     }}>
                  <div className="text-sm font-semibold text-center">
                    {getSelectedPeriodText()}
                  </div>
                  
                  {/* 구름 하이라이트 */}
                  <div className="absolute top-1 left-2 right-2 h-2 bg-gradient-to-r from-white/25 to-transparent rounded-t-xl"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 이미지 */}
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative ml-6 mt-8"
          >
            <Image 
              src="/report.png" 
              alt="Report" 
              width={180} 
              height={180}
              className="rounded-2xl"
            />
          </motion.div>
        </div>
      </div>
    </Card>
  )
}
