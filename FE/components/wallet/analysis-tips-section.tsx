"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Lightbulb, 
  Shield, 
  Clock, 
  Star, 
  Zap,
  Gift,
  Target,
  Calculator,
  PiggyBank,
  TrendingDown,
  ShoppingCart
} from "lucide-react"
import AnalysisMonthlyChart from "./analysis-monthly-chart"

// 소비 팁 데이터
const consumptionTips = [
  {
    icon: Lightbulb,
    title: "스마트한 소비 습관",
    tip: "매일 아침 하루 예산을 정하고, 저녁에 지출을 체크해보세요",
    color: "from-teal-400 to-teal-500"
  },
  {
    icon: Clock,
    title: "24시간 룰",
    tip: "큰 금액 구매 전 24시간을 기다려보세요. 충동구매를 줄일 수 있어요",
    color: "from-emerald-400 to-emerald-500"
  },
  {
    icon: Zap,
    title: "자동 저축",
    tip: "매월 자동으로 저축 계좌에 돈을 넣어보세요",
    color: "from-cyan-400 to-cyan-500"
  },
  {
    icon: Star,
    title: "할인 혜택 활용",
    tip: "쿠폰과 할인 혜택을 적극 활용하여 절약하세요",
    color: "from-teal-500 to-teal-600"
  },
  {
    icon: Target,
    title: "목표 저축",
    tip: "원하는 물건을 사기 위해 목표 금액을 정하고 저축해보세요",
    color: "from-emerald-500 to-emerald-600"
  },
  {
    icon: Calculator,
    title: "가격 비교",
    tip: "온라인 쇼핑 시 여러 쇼핑몰의 가격을 비교해보세요",
    color: "from-cyan-500 to-cyan-600"
  },
  {
    icon: PiggyBank,
    title: "용돈 관리",
    tip: "용돈의 30%는 저축하고, 70%는 소비에 사용해보세요",
    color: "from-teal-600 to-teal-700"
  },
  {
    icon: TrendingDown,
    title: "필요 vs 욕구",
    tip: "정말 필요한 것인지, 단순히 갖고 싶은 것인지 생각해보세요",
    color: "from-emerald-600 to-emerald-700"
  }
]

interface AnalysisTipsSectionProps {
  monthlyData?: any[]
  onMonthSelect?: (monthKey: string) => void
  transactions?: any[]
}

export default function AnalysisTipsSection({ 
  monthlyData = [], 
  onMonthSelect = () => {}, 
  transactions = [] 
}: AnalysisTipsSectionProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [currentX, setCurrentX] = useState(0)

  return (
    <Card className="shadow-lg border border-gray-200/50 rounded-2xl">
      {/* 소비 팁 섹션 헤더 */}
      <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-t-2xl">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          스마트한 소비 팁
        </CardTitle>
        <CardDescription className="text-teal-100 !mt-3 !mb-1">
          더 합리적인 소비 습관을 위한 전문가 팁들입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-transparent">
        {/* 월별 차트 섹션 */}
        {monthlyData.length > 0 && (
          <div className="mb-8">
            <AnalysisMonthlyChart 
              monthlyData={monthlyData}
              onMonthSelect={onMonthSelect}
              transactions={transactions}
            />
          </div>
        )}
        
        <div className="relative">
          {/* 캐러셀 컨테이너 */}
          <div className="flex gap-6 pb-4 overflow-hidden" style={{ scrollSnapType: 'x mandatory' }}>
            <motion.div
              className="flex gap-6"
              animate={{ 
                x: isPaused ? currentX : [currentX, currentX - 300 * consumptionTips.length]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              onUpdate={(latest) => {
                if (!isPaused) {
                  const newX = latest.x as number
                  setCurrentX(newX)
                  
                  // 끝에 도달하면 처음으로 리셋
                  if (newX <= -300 * consumptionTips.length) {
                    setCurrentX(0)
                  }
                }
              }}
            >
              {/* 첫 번째 세트 */}
              {consumptionTips.map((tip, index) => {
              const IconComponent = tip.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.15, 
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white cursor-pointer min-w-[300px] flex-shrink-0"
                  style={{ scrollSnapAlign: 'start' }}
                  onMouseDown={() => setIsPaused(true)}
                  onMouseUp={() => setIsPaused(false)}
                  onMouseLeave={() => setIsPaused(false)}
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => setIsPaused(false)}
                >
                  {/* 배경 그라데이션 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tip.color} opacity-90`} />
                  
                  {/* 반짝이는 효과 */}
                  <motion.div
                    className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div 
                        className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <IconComponent className="w-6 h-6" />
                      </motion.div>
                      <h3 className="font-bold text-base">{tip.title}</h3>
                    </div>
                    <p className="text-sm text-white/95 leading-relaxed font-medium">{tip.tip}</p>
                    
                    {/* 하단 장식 */}
                    <div className="flex justify-end mt-4">
                      <motion.div
                        className="w-8 h-1 bg-white/30 rounded-full"
                        animate={{ width: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
              
              {/* 두 번째 세트 (무한 루프용) */}
              {consumptionTips.map((tip, index) => {
                const IconComponent = tip.icon
                return (
                  <motion.div
                    key={`duplicate-${index}`}
                    initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                    transition={{ 
                      delay: index * 0.15, 
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white cursor-pointer min-w-[300px] flex-shrink-0"
                    style={{ scrollSnapAlign: 'start' }}
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onMouseLeave={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                  >
                    {/* 배경 그라데이션 */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tip.color} opacity-90`} />
                    
                    {/* 반짝이는 효과 */}
                    <motion.div
                      className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div 
                          className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                          animate={{ 
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                          }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </motion.div>
                        <h3 className="font-bold text-base">{tip.title}</h3>
                      </div>
                      <p className="text-sm text-white/95 leading-relaxed font-medium">{tip.tip}</p>
                      
                      {/* 하단 장식 */}
                      <div className="flex justify-end mt-4">
                        <motion.div
                          className="w-8 h-1 bg-white/30 rounded-full"
                          animate={{ width: ['0%', '100%', '0%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  )
}
